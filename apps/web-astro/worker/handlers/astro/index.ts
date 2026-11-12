import { runWithRequestContext } from '../../../src/lib/request-context';
import { createCMSHealth, withTrackedCMS } from '../../lib/cms-health';
import { resolveCacheControl } from '../../middleware/cache-control';

import type { MountedFetch } from '../../app';
import type { CMSHealthVariables } from '../../lib/cms-health';
import type { Context } from 'hono';

type AstroEnv = { Bindings: Cloudflare.Env; Variables: CMSHealthVariables };

// `app.request()` without an execution context (tests) throws on access. Hono types it
// with its own narrower ExecutionContext; on Workers it is the runtime's.
const readExecutionCtx = (c: Context<AstroEnv>): ExecutionContext | undefined => {
  try {
    return c.executionCtx as ExecutionContext;
  } catch {
    return undefined;
  }
};

const isCacheablePage = (c: Context<AstroEnv>, response: Response): boolean => {
  if (response.status !== 200 || response.body === null) return false;
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') return false;

  return resolveCacheControl(new URL(c.req.url).pathname).kind === 'page';
};

// Astro streams the page body, so CMS reads in nested components resolve after the
// adapter returns the Response. A cacheable page is read to the end before the
// degraded flag is final. Only Workers Cache misses pay this (a HIT never runs the Worker).
const settle = async (c: Context<AstroEnv>, response: Response): Promise<Response> => {
  if (!isCacheablePage(c, response)) return response;

  return new Response(await response.arrayBuffer(), response);
};

// The mounted Astro fetch (`@astrojs/cloudflare/handler`), with this request's `CMS`
// binding wrapped. The adapter never hands page code the env passed here (pages would
// otherwise read the raw global `cloudflare:workers` env), so the render runs inside
// an AsyncLocalStorage request context holding the wrapped env, and `getCMSClient()`
// reads that store. Settling stays inside the scope so streamed reads see it too.
export const createAstroHandler = (astroFetch: MountedFetch) => async (c: Context<AstroEnv>) => {
  const health = createCMSHealth();
  const env = withTrackedCMS(c.env, health);
  const ctx = readExecutionCtx(c);
  const settled = await runWithRequestContext({ env, ctx, request: c.req.raw }, async () => settle(c, await astroFetch(c.req.raw, env, ctx)));
  if (health.isDegraded()) c.set('cmsDegraded', true);

  return settled;
};
