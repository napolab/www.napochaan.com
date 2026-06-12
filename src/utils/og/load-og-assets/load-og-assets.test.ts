import { afterEach, describe, expect, it, vi } from 'vitest';

// ASSETS binding stub + origin stub. The SUT reads getCloudflareContext().env.ASSETS
// and (in dev) requestOrigin(); both are mocked so this stays a pure node test.
const assetsFetch = vi.fn();
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => ({ env: { ASSETS: { fetch: assetsFetch } } }) }));
vi.mock('../og-image-url', () => ({ requestOrigin: async () => 'http://localhost:3000' }));

import { loadOgAssets } from './index';

const okResponse = (): Response => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) }) as unknown as Response;
const notFound = (): Response => ({ ok: false, status: 404 }) as unknown as Response;

describe('loadOgAssets — dev fallback', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('fetches OG assets from the dev origin when the ASSETS binding 404s in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    assetsFetch.mockResolvedValue(notFound());
    const fetchSpy = vi.fn(async () => okResponse());
    vi.stubGlobal('fetch', fetchSpy);

    const result = await loadOgAssets();

    expect(result.fonts).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3000/og/LINESeedJP-Bold.otf');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3000/og/GeistMono-subset.ttf');
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3000/og/wordmark.png');
  });

  it('throws (no fallback) when the ASSETS binding 404s outside development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    assetsFetch.mockResolvedValue(notFound());
    const fetchSpy = vi.fn(async () => okResponse());
    vi.stubGlobal('fetch', fetchSpy);

    await expect(loadOgAssets()).rejects.toThrow('failed: 404');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses the ASSETS binding directly when it resolves (no dev fetch)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    assetsFetch.mockResolvedValue(okResponse());
    const fetchSpy = vi.fn(async () => okResponse());
    vi.stubGlobal('fetch', fetchSpy);

    const result = await loadOgAssets();

    expect(result.fonts).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
