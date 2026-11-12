// Workers Cache (wrangler `[cache] enabled`) serves any 200 with a public
// Cache-Control straight from the edge without invoking this Worker — and, per
// RFC 9111 heuristics, ALSO caches header-less 200s for 2 hours. These policies
// make that explicit for the routes Next.js leaves header-less. Every CMS write
// purges everything (see src/collections/hooks/revalidate/purge-workers-cache),
// so long max-age values are safe. `s-maxage`/`must-revalidate` would disable
// stale-while-revalidate, so neither is used here.
export const MEDIA_POLICY = 'public, max-age=86400, stale-while-revalidate=604800';
export const TEXT_FEED_POLICY = 'public, max-age=3600, stale-while-revalidate=86400';
// Payload's REST API (src/app/(payload)/api/[...slug]/route.ts) emits no Cache-Control on
// its 200 JSON responses. Workers Cache would otherwise store those header-less 200s for 2h
// keyed by path+query with cookies ignored — replaying an admin's session data to anonymous
// visitors, or serving a cached anonymous response back to a logged-in admin. Media stays
// cacheable (evaluated first in the registry), everything else under /api/ is denied storage.
export const PRIVATE_POLICY = 'private, no-store';
