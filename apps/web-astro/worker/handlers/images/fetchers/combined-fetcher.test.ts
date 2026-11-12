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
    CMS: {
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

  const cmsRequestURL = (ctx: FetchContext): string => {
    const [request] = vi.mocked(ctx.env.CMS?.fetch ?? vi.fn()).mock.calls[0] ?? [];
    if (!(request instanceof Request)) throw new Error('CMS.fetch was not called with a Request');
    return request.url;
  };

  it('fetches payload media from the cms /media/:filename over the CMS binding', async () => {
    const ctx = createCtx({
      url: new URL('https://booth2booth.com/api/media/file/image.png?v=1'),
      fetchUrl: 'https://booth2booth.com/api/media/file/image.png?v=1',
    });

    const res = await fetchImage(ctx);

    expect(res.ok).toBe(true);
    expect(await res.text()).toBe('payload-body');
    expect(cmsRequestURL(ctx)).toBe('https://cms.internal/media/image.png');
  });

  it('re-encodes a percent-encoded media filename exactly once for the cms', async () => {
    const ctx = createCtx({
      url: new URL('https://booth2booth.com/api/media/file/a%20b%E5%86%99.png'),
      fetchUrl: 'https://booth2booth.com/api/media/file/a%20b%E5%86%99.png',
    });

    await fetchImage(ctx);

    expect(cmsRequestURL(ctx)).toBe(`https://cms.internal/media/${encodeURIComponent('a b写.png')}`);
  });

  it('passes a cms 404 through so the handler reports the missing source', async () => {
    const ctx = createCtx({
      url: new URL('https://booth2booth.com/api/media/file/nope.png'),
      fetchUrl: 'https://booth2booth.com/api/media/file/nope.png',
      env: { ASSETS: { fetch: vi.fn() }, CMS: { fetch: vi.fn().mockResolvedValue(new Response('nf', { status: 404 })) } } as unknown as Cloudflare.Env,
    });

    const res = await fetchImage(ctx);

    expect(res.status).toBe(404);
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
