import { createCMSHealth, withTrackedCMS } from '../../lib/cms-health';
import { resolveCacheControl } from '../../middleware/cache-control';

import type { MountedFetch } from '../../app';
import type { CMSHealthVariables } from '../../lib/cms-health';
import type { Context } from 'hono';

type NextEnv = { Bindings: Cloudflare.Env; Variables: CMSHealthVariables };

// `app.request()` without an execution context (tests) throws on access.
const readExecutionCtx = (c: Context<NextEnv>): Context['executionCtx'] | undefined => {
  try {
    return c.executionCtx;
  } catch {
    return undefined;
  }
};

const isCacheablePage = (c: Context<NextEnv>, response: Response): boolean => {
  if (response.status !== 200 || response.body === null) return false;
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') return false;

  return resolveCacheControl(new URL(c.req.url).pathname).kind === 'page';
};

// Streaming SSR resolves Suspense'd CMS reads after OpenNext returns the Response, so a
// cacheable page is read to the end before the degraded flag is final. Only Workers
// Cache misses pay this (a HIT never runs the Worker).
const settle = async (c: Context<NextEnv>, response: Response): Promise<Response> => {
  if (!isCacheablePage(c, response)) return response;

  return new Response(await response.arrayBuffer(), response);
};

// The mounted OpenNext fetch, with this request's `CMS` binding wrapped. OpenNext runs
// the handler inside an AsyncLocalStorage holding exactly the env passed here, and
// `getCloudflareContext()` reads that store, so every CMS read in the render goes
// through the wrapper (see task-10-report "Fix round 1" for the source citations).
export const createNextHandler = (handlerFetch: MountedFetch) => async (c: Context<NextEnv>) => {
  const health = createCMSHealth();
  const response = await handlerFetch(c.req.raw, withTrackedCMS(c.env, health), readExecutionCtx(c));
  const settled = await settle(c, response);
  if (health.isDegraded()) c.set('cmsDegraded', true);

  return settled;
};
