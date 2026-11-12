import { createMiddleware } from 'hono/factory';

import { createRunner } from '../../lib/first-match-runner';
import { resolveCSP } from './frame-headers';
import { adminFramePlugin } from './plugins/admin-frame';
import { adminLandingPlugin } from './plugins/admin-landing';
import { safeDecodePathname } from './safe-decode-pathname';

import type { FramePolicy, PathAction, PathRequest } from './types';
import type { Context } from 'hono';
import type { Result } from 'neverthrow';

// 先頭から順に照合し、最初に match した plugin の action を採る(first match wins)。
// 具体的なものを先に置く: admin-landing の対象(`/admin/` より深い)は admin-frame の対象(`/admin` 配下)の部分集合なので、
// 後ろに置くと frame に先に match して redirect されなくなる。
const plugins = [adminLandingPlugin, adminFramePlugin] as const;

const runPlugins = createRunner(plugins);

export const resolvePathAction = (request: PathRequest): Result<PathAction, PathRequest> => runPlugins(request);

const toPathRequest = (c: Context): PathRequest => ({ method: c.req.method, pathname: safeDecodePathname(new URL(c.req.url).pathname), headers: c.req.raw.headers });

const applyRedirect = (c: Context, location: string): Response => {
  c.header('Cache-Control', 'no-store');
  return c.redirect(location, 302);
};

// Post-finalization c.header() rebuilds the response, which handles the
// immutable headers of mounted handler responses (see weaken-etag.ts).
const applyFrameHeaders = (c: Context, policy: FramePolicy): void => {
  c.header('Content-Security-Policy', resolveCSP(c.res.headers.get('Content-Security-Policy'), policy.frameAncestors));
  c.header('X-Frame-Options', policy.xFrameOptions);
};

export const pathPolicy = () =>
  createMiddleware(async (c, next) => {
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
