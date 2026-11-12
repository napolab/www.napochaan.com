// Cache-Control per page class, stamped by the worker's cache-control middleware
// (worker/middleware/cache-control). Workers Cache serves a HIT without running the
// Worker, keys entries by Worker version (a deploy starts empty), and is emptied on
// every CMS publish by the cms Worker calling `env.WEB.purge()` (worker/entrypoint).
//
// HTML splits edge and browser: `s-maxage` is how long Workers Cache keeps the page,
// `max-age=0` makes the browser revalidate on every view — a purge only empties the
// edge, so a browser-held copy would otherwise outlive a publish. `s-maxage` disables
// `stale-while-revalidate` (RFC 9111), which purge-driven freshness does not need.
// Never add `must-revalidate` / `proxy-revalidate`.
export const PAGE_CACHE_POLICIES = {
  // CMS-only pages / feeds / `.md` / llms / sitemap: freshness comes from the purge.
  cms: 'public, max-age=0, s-maxage=31536000',
  // home, log, security.txt: external RSS posts / current time, which no purge reaches.
  timeSensitive: 'public, max-age=0, s-maxage=3600',
  // draft previews, `/next/*` handshakes, admin, and any render whose CMS read failed.
  uncacheable: 'no-store',
} as const;
