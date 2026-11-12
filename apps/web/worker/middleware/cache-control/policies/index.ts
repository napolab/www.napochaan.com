// Policies for the non-page routes. Page classes live in PAGE_CACHE_POLICIES
// (src/utils/cache-control). Workers Cache (wrangler `[cache] enabled`) serves any 200
// with a public Cache-Control straight from the edge without invoking this Worker — and,
// per RFC 9111 heuristics, ALSO caches header-less 200s for 2 hours. Every CMS publish
// purges everything (cms → `env.WEB.purge()`, worker/entrypoint). `s-maxage` /
// `must-revalidate` would disable stale-while-revalidate, so neither is used here.
export const MEDIA_POLICY = 'public, max-age=86400, stale-while-revalidate=604800';
