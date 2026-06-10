// Post-deploy ISR cache bust.
//
// `next build` evaluates payload.config with INERT stub bindings (the NEXT_PHASE
// guard in src/payload.config.ts), so every ISR list / home / about page is
// prerendered EMPTY and pushed to the OpenNext R2 incremental cache by `deploy`.
// CMS data only lands afterwards (seed / admin edits), and a Payload CLI seed runs
// outside the worker so its revalidation never reaches the deployed cache. Result:
// list pages keep serving the empty build snapshot until their 1h ISR window elapses.
//
// This writes fresh revalidation rows (build-id-prefixed, matching OpenNext's
// D1NextModeTagCache.getCacheKey = `${NEXT_BUILD_ID}/${tag}`) into the OpenNext D1
// tag cache (`napochaan-cache-<env>`) for BOTH the data tags (unstable_cache reads)
// AND the `_N_T_/<path>` soft path tags (path-keyed ISR HTML). Every listed page is
// marked stale, so the next request regenerates it from live D1.
//
// Runs automatically at the tail of `deploy:staging`. Keep `tags` in sync with
// CACHE_TAGS (src/utils/cache-tags) and the ISR routes whose afterChange hooks
// revalidate paths (src/collections/*, src/globals/profile.ts).

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const env = process.env.CLOUDFLARE_ENV;
if (env !== 'staging' && env !== 'production') {
  console.error('[bust-isr-cache] CLOUDFLARE_ENV must be "staging" or "production".');
  process.exit(1);
}

const buildId = readFileSync('.next/BUILD_ID', 'utf8').trim();
const database = `napochaan-cache-${env}`;
const now = Date.now();

// Data tags (unstable_cache) + `_N_T_/<path>` soft tags for each ISR list/home/about page.
const tags = ['gallery', 'works', 'news', 'blog', 'logs', 'profile', '_N_T_/', '_N_T_/gallery', '_N_T_/works', '_N_T_/news', '_N_T_/blog', '_N_T_/log', '_N_T_/about'];

const values = tags.map((tag) => `('${buildId}/${tag}', ${now})`).join(', ');
const sql = `INSERT INTO revalidations (tag, revalidatedAt) VALUES ${values};`;

console.log(`[bust-isr-cache] ${database} buildId=${buildId} tags=${tags.length}`);
execFileSync('npx', ['wrangler', 'd1', 'execute', database, '--remote', '--command', sql], { stdio: 'inherit' });
console.log('[bust-isr-cache] done.');
