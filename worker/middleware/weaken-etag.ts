import { createMiddleware } from 'hono/factory';

// Cloudflare's edge refuses to transform (= compress) any response carrying a
// strong ETag, because compressing would change the bytes the strong validator
// vouches for. Next.js emits strong ETags for HTML payloads, so without this
// rewrite production HTML ships uncompressed (~426KB instead of ~27KB).
// A weak ETag (`W/"..."`) keeps If-None-Match revalidation working while
// permitting the edge to apply gzip/brotli/zstd.
//
// Hono's built-in `hono/etag` (with `{ weak: true }`) is deliberately not used
// here: it buffers and hashes every response body to generate ETags, while the
// upstream (Next.js) already computed one — this only needs a header rewrite.
export const toWeakETag = (value: string): string => {
  if (value.startsWith('W/')) return value;
  return `W/${value}`;
};

export const weakenETag = () =>
  createMiddleware(async (c, next) => {
    await next();

    const etag = c.res.headers.get('ETag');
    if (etag === null || etag.startsWith('W/')) return;

    // Post-finalization c.header() rebuilds the response internally before
    // setting, which transparently handles the immutable headers of mounted
    // handler responses. The guard above still matters: it keeps ETag-less
    // responses (e.g. `webSocket` upgrades from the cursor routes, whose
    // non-standard properties a rebuild would drop) untouched by reference.
    c.header('ETag', toWeakETag(etag));
  });
