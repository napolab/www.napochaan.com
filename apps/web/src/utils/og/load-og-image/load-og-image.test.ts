import { afterEach, describe, expect, it, vi } from 'vitest';

// CMS Service Binding stub behind a mutable env holder so each case can present
// or omit the binding. The SUT reads the async Cloudflare context's env.CMS; the
// sync form throws (as it does outside a request under `next dev`).
const refFetch = vi.fn();
const env: { CMS: { fetch: typeof refFetch } | undefined } = {
  CMS: { fetch: refFetch },
};
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: (options?: { async?: boolean }) => {
    if (options?.async !== true) throw new Error('getCloudflareContext called in sync mode');
    return Promise.resolve({ env });
  },
}));

import { loadOgImage } from './index';

const ORIGIN = 'https://stg.napochaan.com';

// Real JPEG magic bytes (ff d8 ff …): the runner sniffs the body, not the header.
const jpegResponse = (): Response =>
  ({
    ok: true,
    arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0x00]).buffer,
  }) as unknown as Response;
const notFound = (): Response => ({ ok: false, status: 404 }) as unknown as Response;

describe('loadOgImage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    env.CMS = { fetch: refFetch };
  });

  it('returns undefined for an absent src and never touches the binding', async () => {
    const result = await loadOgImage(undefined, ORIGIN);

    expect(result).toBeUndefined();
    expect(refFetch).not.toHaveBeenCalled();
  });

  it('returns an external absolute URL unchanged without touching the binding', async () => {
    const external = 'https://cdn.example.com/x.png';

    const result = await loadOgImage(external, ORIGIN);

    expect(result).toBe(external);
    expect(refFetch).not.toHaveBeenCalled();
  });

  it('inlines same-origin payload media from the cms binding as a data URL in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    refFetch.mockResolvedValue(jpegResponse());

    const result = await loadOgImage('/api/media/file/x.png', ORIGIN);

    const [request] = refFetch.mock.calls[0] ?? [];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe('https://cms.internal/media/x.png');
    expect(result).toBe('data:image/jpeg;base64,/9j/AA==');
  });

  it('returns undefined when the binding fetch is not ok in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    refFetch.mockResolvedValue(notFound());

    const result = await loadOgImage('/api/media/file/x.png', ORIGIN);

    expect(result).toBeUndefined();
  });

  // next/og refuses localhost image URLs (SSRF guard), so dev must inline via
  // the binding too — the CMS binding exists under `next dev` as well.
  it('inlines same-origin payload media from the cms binding in development too', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    refFetch.mockResolvedValue(jpegResponse());

    const result = await loadOgImage('/api/media/file/x.png', ORIGIN);

    expect(refFetch).toHaveBeenCalledOnce();
    expect(result).toBe('data:image/jpeg;base64,/9j/AA==');
  });

  it('returns the absolute URL when the binding is unavailable in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    env.CMS = undefined;

    const result = await loadOgImage('/api/media/file/x.png', ORIGIN);

    expect(result).toBe(`${ORIGIN}/api/media/file/x.png`);
  });
});
