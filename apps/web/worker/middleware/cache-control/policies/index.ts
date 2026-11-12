// Policies for the non-page routes. Page classes live in PAGE_CACHE_POLICIES
// (src/utils/cache-control). Workers Cache (wrangler `[cache] enabled`) serves any 200
// with a public Cache-Control straight from the edge without invoking this Worker — and,
// per RFC 9111 heuristics, ALSO caches header-less 200s for 2 hours. Every CMS publish
// purges everything (cms → `env.WEB.purge()`, worker/entrypoint). `s-maxage` /
// `must-revalidate` would disable stale-while-revalidate, so neither is used here.
export const MEDIA_POLICY = 'public, max-age=86400, stale-while-revalidate=604800';
// Payload's REST API (src/app/(payload)/api/[...slug]/route.ts) emits no Cache-Control on
// its 200 JSON responses. Workers Cache would otherwise store those header-less 200s for 2h
// keyed by path+query with cookies ignored — replaying an admin's session data to anonymous
// visitors, or serving a cached anonymous response back to a logged-in admin. Media stays
// cacheable (evaluated first in the registry), everything else under /api/ is denied storage.
export const PRIVATE_POLICY = 'private, no-store';
