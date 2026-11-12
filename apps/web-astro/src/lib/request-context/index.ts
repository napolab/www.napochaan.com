import { AsyncLocalStorage } from 'node:async_hooks';

// Per-request Cloudflare context for Astro page code. The worker's Astro handler
// (worker/handlers/astro) runs the render inside `runWithRequestContext` with the
// request's env — whose `CMS` binding is already wrapped by `withTrackedCMS` — so
// every CMS read in a render goes through the health tracker. Page code must read
// bindings from here, never from `import { env } from 'cloudflare:workers'` (the raw
// global binding, invisible to cms-health).
export type RequestContext = { env: Cloudflare.Env; ctx: ExecutionContext | undefined; request: Request };

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithRequestContext = <T>(context: RequestContext, fn: () => T): T => storage.run(context, fn);

export const getRequestContext = (): RequestContext => {
  const context = storage.getStore();
  if (context === undefined) throw new Error('request context is not available outside a request');

  return context;
};
