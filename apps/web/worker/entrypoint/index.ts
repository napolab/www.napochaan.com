import { WorkerEntrypoint } from 'cloudflare:workers';

import { createWorkerApp } from '../app';

import type { MountedFetch } from '../app';

// The RPC surface the cms Worker calls over its `WEB` Service Binding (no `entrypoint`,
// so it reaches the DEFAULT export). Mirrors `WebPurger` in apps/cms request-web-purge.
export type WebPurger = { purge(): Promise<void> };

// `ctx.cache.purge` only empties the cache of the entrypoint whose ctx it is — pages are
// cached in front of the default entrypoint, so this must run on that class (Task 0 spike).
// `ctx.cache` is undefined under `wrangler dev` / `next dev` even with `[cache] enabled`.
export const purgeEntrypointCache = async (ctx: ExecutionContext): Promise<void> => {
  const cache = ctx.cache;
  if (cache === undefined) return;

  await cache.purge({ purgeEverything: true });
};

// The default export of worker.ts. `fetch` is the public entrance (the Hono app wrapping
// the Astro handler); `purge` is JS RPC only — there is no HTTP route to it.
export const createWebEntrypoint = (handlerFetch: MountedFetch) => {
  const app = createWorkerApp(handlerFetch);

  return class Web extends WorkerEntrypoint<Cloudflare.Env> implements WebPurger {
    override async fetch(request: Request): Promise<Response> {
      return app.fetch(request, this.env, this.ctx);
    }

    async purge(): Promise<void> {
      await purgeEntrypointCache(this.ctx);
    }
  };
};
