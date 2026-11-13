// Accepted A (Next) ↔ B (Astro) differences for scripts/parity-check.mjs. Each entry
// matches one field on a path pattern AND both observed values, so an unrelated change
// to the same field still fails. An optional `status` also requires both sides to answer
// it. `reason` cites the ledger ruling
// (.superpowers/sdd/2026-11-13-web-astro-migration/progress.md) or the evidence.
//
// Normalizations applied before diffing (scripts/parity/compare.mjs, not entries here):
// - Cache-Control is compared by class: anything with `no-store` / `private` is
//   `uncacheable` (Next: `private, no-cache, no-store, max-age=0, must-revalidate`,
//   Astro worker: `no-store`); cacheable values compare their sorted directives.
// - og:image / twitter:image drop the query string (Next's `?hash` cache-buster;
//   Ruling: og/twitter image URL change).
// - content-type parameters are lowercased and spaced (`;charset=UTF-8` == `; charset=utf-8`).
// - Text bodies: CRLF → LF, trailing whitespace, RSS <lastBuildDate>, security.txt Expires.

const ANY = /[\s\S]*/;
const PAST_THE_END = /^\/(blog|news|works)\/page\/3$/;
const INTERNAL_MD_REWRITE = /^\/(blog|news|works)\/[^/]+\/md$/;

export const WHITELIST = [
  {
    id: 'default-og-image-url',
    path: ANY,
    field: 'og:image',
    a: /\/opengraph-image-12o0cb\.png$/,
    b: /\/og-default\.png$/,
    reason: 'Ruling: og/twitter image URL change (hashed Next file-convention → /og-default.png). Same bytes (md5 83c89b0f…); the hashed URL still serves 200 on B.',
  },
  {
    id: 'default-twitter-image-url',
    path: ANY,
    field: 'twitter:image',
    a: /\/twitter-image-12o0cb\.png$/,
    b: /\/og-default\.png$/,
    reason: 'Ruling: og/twitter image URL change. Next twitter-image.png and og-default.png are byte-identical (md5 83c89b0f…); the hashed URL still serves 200 on B.',
  },
  {
    id: 'missing-slug-og-image',
    // Only the 404 probe paths, and only when both sides answer 404: a valid slug whose
    // og:image fell back to the default must stay a mismatch.
    path: /^\/(blog|news)\/does-not-exist$/,
    status: '404',
    field: 'og:image',
    a: /\/(blog|news)\/does-not-exist\/opengraph-image-(fx5gi7|5nvrt4)$/,
    b: /\/og-default\.png$/,
    reason:
      'Next keeps the segment OG file-convention on a not-found slug (a 404, noindex page); Astro renders the 404 page with the default image. Not a ledger ruling: Next-artifact on a noindex 404 page, evidence in reports/2026-11-13-web-astro-parity.md.',
  },
  {
    id: 'not-found-robots-local',
    path: ANY,
    field: 'robots',
    a: 'noindex',
    b: 'noindex, nofollow',
    reason:
      'Local-host artifact: Next injects `noindex` ahead of the metadata `noindex, nofollow` (non-production host); Astro emits only the latter. On production both emit `noindex` (live Next 404; build-metadata.ts noindex branch).',
  },
  {
    id: 'not-found-h1-ssr',
    path: ANY,
    field: 'h1',
    a: '∅',
    b: '404',
    reason: 'Next (local and live) renders the not-found body client-side from the flight payload, so its HTML has no h1; Astro server-renders the 404 page. Improvement.',
  },
  {
    id: 'past-the-end-page-404',
    path: PAST_THE_END,
    field: ANY,
    a: ANY,
    b: ANY,
    reason: 'Ruling: /blog/page/99 real 404 (live 200 via streaming) accepted; same for news/works (Task 6 ruling: works/page/N past end 404 accepted).',
  },
  {
    id: 'internal-md-rewrite-404',
    path: INTERNAL_MD_REWRITE,
    field: ANY,
    a: ANY,
    b: ANY,
    reason: 'Ruling: /{section}/<slug>/md internal rewrite targets → 404 accepted (never public URLs).',
  },
  {
    id: 'unhashed-icon-url',
    path: '/icon.png',
    field: ANY,
    a: ANY,
    b: ANY,
    reason: 'Ruling: icon URL change (/icon.png) accepted. The hashed /icon-12o0cb.png is probed separately and matches.',
  },
  {
    id: 'logs-redirect-cache-control',
    path: /^\/logs(\?.*)?$/,
    field: 'cache-control',
    a: 'none',
    b: 'uncacheable',
    reason: 'Ruling: /logs as endpoint (Next config redirects bypass the worker → no Cache-Control) accepted; Astro stamps no-store like every other redirect.',
  },
  {
    id: 'robots-txt-charset-local',
    path: '/robots.txt',
    field: 'content-type',
    a: 'text/plain',
    b: 'text/plain; charset=utf-8',
    reason: 'OpenNext local preview artifact: live https://napochaan.com/robots.txt answers `text/plain; charset=utf-8`, which B matches.',
  },
];
