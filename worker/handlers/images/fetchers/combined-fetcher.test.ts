import { describe, expect, it, vi } from 'vitest';

import { fetchImage } from './combined-fetcher';

import type { FetchContext } from './types';

const createCtx = (overrides: Partial<FetchContext> = {}): FetchContext => ({
  url: new URL('https://booth2booth.com/images/logo.png'),
  origin: 'https://booth2booth.com',
  fetchUrl: 'https://booth2booth.com/images/logo.png',
  env: {
    ASSETS: {
      fetch: vi.fn().mockResolvedValue(new Response('asset-body', { status: 200 })),
    },
    WORKER_SELF_REFERENCE: {
      fetch: vi.fn().mockResolvedValue(new Response('payload-body', { status: 200 })),
    },
  } as unknown as Cloudflare.Env,
  fetchOptions: {},
  ...overrides,
});

describe('fetchImage', () => {
  it('fetches internal assets via ASSETS binding for same-origin non-payload paths', async () => {
    const ctx = createCtx();
    const res = await fetchImage(ctx);

    expect(res.ok).toBe(true);
    expect(await res.text()).toBe('asset-body');
    expect(ctx.env.ASSETS.fetch).toHaveBeenCalledWith(ctx.fetchUrl, ctx.fetchOptions);
  });

  it('fetches payload media via WORKER_SELF_REFERENCE for /api/media/file/ paths', async () => {
    const ctx = createCtx({
      url: new URL('https://booth2booth.com/api/media/file/image.png'),
      fetchUrl: 'https://booth2booth.com/api/media/file/image.png',
    });

    const res = await fetchImage(ctx);

    expect(res.ok).toBe(true);
    expect(await res.text()).toBe('payload-body');
    expect(ctx.env.WORKER_SELF_REFERENCE.fetch).toHaveBeenCalledWith(ctx.fetchUrl, ctx.fetchOptions);
  });

  it('falls back to external fetch for cross-origin URLs', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('external-body', { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    const ctx = createCtx({
      url: new URL('https://cdn.example.com/image.png'),
      origin: 'https://booth2booth.com',
      fetchUrl: 'https://cdn.example.com/image.png',
    });

    const res = await fetchImage(ctx);

    expect(res.ok).toBe(true);
    expect(await res.text()).toBe('external-body');
    expect(mockFetch).toHaveBeenCalledWith(ctx.fetchUrl, ctx.fetchOptions);

    vi.unstubAllGlobals();
  });

  it('returns 500 when all fetchers fail', async () => {
    const ctx = createCtx({
      url: new URL('https://cdn.example.com/image.png'),
      origin: 'https://booth2booth.com',
      fetchUrl: 'https://cdn.example.com/image.png',
    });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const res = await fetchImage(ctx);
    expect(res.status).toBe(500);

    vi.unstubAllGlobals();
  });
});
