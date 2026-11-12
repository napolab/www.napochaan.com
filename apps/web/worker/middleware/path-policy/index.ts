import { createMiddleware } from 'hono/factory';

import { createRunner } from '../../lib/first-match-runner';
import { resolveCSP } from './frame-headers';
import { previewFramePlugin } from './plugins/preview-frame';
import { safeDecodePathname } from './safe-decode-pathname';

import type { FramePolicy, PathAction, PathRequest } from './types';
import type { Context } from 'hono';
import type { Result } from 'neverthrow';

// 先頭から順に照合し、最初に match した plugin の action を採る(first match wins)。
const plugins = [previewFramePlugin] as const;

const runPlugins = createRunner(plugins);

export const resolvePathAction = (request: PathRequest): Result<PathAction, PathRequest> => runPlugins(request);

type HonoEnv = { Bindings: Cloudflare.Env };

// app.request() without env (tests) leaves c.env undefined.
const readCMSOrigin = (env: Cloudflare.Env | undefined): string | undefined => env?.CMS_ORIGIN;

const toPathRequest = (c: Context<HonoEnv>): PathRequest => ({
  method: c.req.method,
  pathname: safeDecodePathname(new URL(c.req.url).pathname),
  headers: c.req.raw.headers,
  cmsOrigin: readCMSOrigin(c.env),
});

const applyRedirect = (c: Context, location: string): Response => {
  c.header('Cache-Control', 'no-store');
  return c.redirect(location, 302);
};

// Post-finalization c.header() rebuilds the response, which handles the
// immutable headers of mounted handler responses (see weaken-etag.ts).
// X-Frame-Options cannot allow a cross-origin parent, so drop any upstream value
// and let CSP frame-ancestors decide.
const applyFrameHeaders = (c: Context, policy: FramePolicy): void => {
  c.header('Content-Security-Policy', resolveCSP(c.res.headers.get('Content-Security-Policy'), policy.frameAncestors));
  c.header('X-Frame-Options', undefined);
};

export const pathPolicy = () =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const resolved = resolvePathAction(toPathRequest(c));
    if (resolved.isErr()) return next();

    const action = resolved.value;
    switch (action.kind) {
      case 'redirect':
        return applyRedirect(c, action.location);
      case 'frame':
        await next();
        applyFrameHeaders(c, action.policy);
        return;
      default: {
        const exhaustive: never = action;
        throw new Error(`unhandled path action: ${JSON.stringify(exhaustive)}`);
      }
    }
  });
