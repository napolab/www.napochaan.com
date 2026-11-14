import { createMiddleware } from 'hono/factory';

import { isNegotiablePath } from '../lib/markdown-negotiation/negotiable-path';
import { appendVary } from '../lib/vary';

// Negotiable pages answer HTML or Markdown at the same URL (worker/handlers/astro), and
// Workers Cache keys variants on `Vary`. Every response of such a path — HTML included,
// 404 / redirect too — must vary on Accept, or a stored HTML entry would answer a
// Markdown request (and vice versa). Registered outermost in app.ts so no later header
// rewrite (weakenETag, cacheControlHeaders, pathPolicy) can drop it.
export const varyAccept = () =>
  createMiddleware(async (c, next) => {
    await next();

    if (!isNegotiablePath({ method: c.req.method, pathname: new URL(c.req.url).pathname })) return;

    // Post-finalization c.header() rebuilds the response (see weaken-etag.ts).
    c.header('Vary', appendVary(c.res.headers.get('Vary'), 'Accept'));
  });
