// Post-deploy Workers Cache warm-up.
//
// Workers Cache (enabled on production, see wrangler config) is keyed by
// Worker version, so every deploy starts with an EMPTY cache. The first
// visitor of each page pays a full 0.6–5s ISR regeneration cold-start — the
// home page has hit a 524 this way. This script fetches every URL in
// sitemap.xml (plus the RSS feeds and llms.txt exports, which are not in the
// sitemap but ARE served through Workers Cache) right after deploy, so the
// cache is already warm before a real visitor arrives.
//
// Runs automatically at the tail of `deploy:production`, right after
// bust-isr-cache.mjs. It is intentionally best-effort: a slow or failing
// individual URL should not fail the deploy, so this only exits non-zero
// when the sitemap itself cannot be fetched (a strong signal the deploy is
// broken).

import { buildWarmTargets } from './warm-cache/targets.mjs';

const USER_AGENT = 'napochaan-warm-cache/1';
const RETRY_DELAY_MS = 2000;

const parsePositiveInt = (value, fallback) => {
  if (value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const baseUrl = process.env.BASE_URL;
if (baseUrl === undefined || baseUrl === '') {
  console.error('[warm-cache] BASE_URL is required (e.g. https://napochaan.com).');
  process.exit(1);
}

const concurrency = parsePositiveInt(process.env.WARM_CONCURRENCY, 4);
const timeoutMs = parsePositiveInt(process.env.WARM_TIMEOUT_MS, 90000);
const attemptsLimit = parsePositiveInt(process.env.WARM_ATTEMPTS, 3);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchSitemap = async () => {
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  try {
    const response = await fetch(sitemapUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) {
      console.error(`[warm-cache] sitemap fetch failed: ${response.status} ${sitemapUrl}`);
      process.exit(1);
    }
    return await response.text();
  } catch (error) {
    console.error(`[warm-cache] sitemap fetch failed: ${error} ${sitemapUrl}`);
    process.exit(1);
  }
};

/** Warm a single URL, retrying on a thrown error or a >=500 response, up to `attemptsLimit` attempts. */
const warmURL = async (url, attempt = 1) => {
  const startedAt = Date.now();
  const attemptSuffix = attempt > 1 ? ` attempt=${attempt}` : '';

  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': USER_AGENT },
    });
    await response.arrayBuffer();
    const elapsedMs = Date.now() - startedAt;
    const cfCacheStatus = response.headers.get('cf-cache-status') ?? '-';
    console.log(`[warm-cache] ${response.status} ${elapsedMs}ms cf=${cfCacheStatus}${attemptSuffix} ${url}`);

    if (response.status < 500) return { url, ok: true };
    if (attempt >= attemptsLimit) return { url, ok: false };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    console.log(`[warm-cache] error ${elapsedMs}ms${attemptSuffix} ${url} (${error})`);
    if (attempt >= attemptsLimit) return { url, ok: false };
  }

  await sleep(RETRY_DELAY_MS);
  return warmURL(url, attempt + 1);
};

/** Split `items` into `count` round-robin buckets, preserving relative order within each bucket. */
const partitionRoundRobin = (items, count) => Array.from({ length: count }, (_, bucketIndex) => items.filter((_, index) => index % count === bucketIndex));

/** Warm a bucket's URLs one at a time — this is a single pool worker. */
const warmSequential = async (urls) => {
  const [first, ...rest] = urls;
  if (first === undefined) return [];
  const result = await warmURL(first);
  const restResults = await warmSequential(rest);
  return [result, ...restResults];
};

/** Small fixed-size worker pool over `urls` — no external deps. */
const warmAll = async (urls) => {
  const workerCount = Math.min(concurrency, urls.length);
  if (workerCount === 0) return [];
  const buckets = partitionRoundRobin(urls, workerCount);
  const bucketResults = await Promise.all(buckets.map((bucket) => warmSequential(bucket)));
  return bucketResults.flat();
};

const main = async () => {
  const sitemapXml = await fetchSitemap();
  const targets = buildWarmTargets(baseUrl, sitemapXml);

  console.log(`[warm-cache] baseUrl=${baseUrl} targets=${targets.length} concurrency=${concurrency}`);

  const startedAt = Date.now();
  const results = await warmAll(targets);
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  const okCount = results.filter((result) => result.ok).length;
  const failedCount = results.length - okCount;
  console.log(`[warm-cache] warmed ${okCount}/${results.length} (${failedCount} failed) in ${elapsedSeconds}s`);
};

try {
  await main();
} catch (error) {
  console.error(`[warm-cache] unexpected failure: ${error}`);
  process.exit(1);
}
