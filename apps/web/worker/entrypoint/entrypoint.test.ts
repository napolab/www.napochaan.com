import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';

import { createWebEntrypoint, purgeEntrypointCache } from './index';

// Only the members the entrypoint touches; the rest of ExecutionContext is irrelevant here.
const contextWith = (cache: CacheContext | undefined): ExecutionContext => ({ cache, waitUntil: vi.fn(), passThroughOnException: vi.fn(), props: {} }) as unknown as ExecutionContext;

const purgeMock = () => vi.fn(async (_options: CachePurgeOptions): Promise<CachePurgeResult> => ({ success: true, errors: [] }));

const cacheWith = (purge: CacheContext['purge']): CacheContext => ({ purge, invalidate: vi.fn() });

describe('purgeEntrypointCache', () => {
  it('purges everything once', async () => {
    const purge = purgeMock();
    await purgeEntrypointCache(contextWith(cacheWith(purge)));
    expect(purge).toHaveBeenCalledOnce();
    expect(purge).toHaveBeenCalledWith({ purgeEverything: true });
  });

  // `wrangler dev` / `next dev` expose no ctx.cache even with `[cache] enabled`.
  it('is a no-op when ctx.cache is undefined', async () => {
    await expect(purgeEntrypointCache(contextWith(undefined))).resolves.toBeUndefined();
  });
});

describe('createWebEntrypoint', () => {
  it('purge() purges the entrypoint cache with purgeEverything', async () => {
    const purge = purgeMock();
    const Web = createWebEntrypoint(vi.fn(async () => new Response('next')));
    const web = new Web(contextWith(cacheWith(purge)), env);

    await web.purge();

    expect(purge).toHaveBeenCalledOnce();
    expect(purge).toHaveBeenCalledWith({ purgeEverything: true });
  });

  it('purge() does not throw without ctx.cache', async () => {
    const Web = createWebEntrypoint(vi.fn(async () => new Response('next')));
    const web = new Web(contextWith(undefined), env);

    await expect(web.purge()).resolves.toBeUndefined();
  });

  it('fetch() delegates to the composed Hono app', async () => {
    const handlerFetch = vi.fn(async () => new Response('next'));
    const Web = createWebEntrypoint(handlerFetch);
    const web = new Web(contextWith(undefined), env);

    const response = await web.fetch(new Request('https://example.com/some-page'));

    expect(await response.text()).toBe('next');
    expect(handlerFetch).toHaveBeenCalledOnce();
  });
});
