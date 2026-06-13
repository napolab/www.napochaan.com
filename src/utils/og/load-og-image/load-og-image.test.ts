import { afterEach, describe, expect, it, vi } from 'vitest';

// WORKER_SELF_REFERENCE binding stub behind a mutable env holder so each case can
// present or omit the binding. The SUT reads getCloudflareContext().env.WORKER_SELF_REFERENCE.
const refFetch = vi.fn();
const env: { WORKER_SELF_REFERENCE: { fetch: typeof refFetch } | undefined } = {
  WORKER_SELF_REFERENCE: { fetch: refFetch },
};
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => ({ env }) }));

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
    env.WORKER_SELF_REFERENCE = { fetch: refFetch };
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

  it('inlines same-origin payload media via the binding as a data URL in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    refFetch.mockResolvedValue(jpegResponse());

    const result = await loadOgImage('/api/media/file/x.png', ORIGIN);

    expect(refFetch).toHaveBeenCalledWith(`${ORIGIN}/api/media/file/x.png`);
    expect(result).toBe('data:image/jpeg;base64,/9j/AA==');
  });

  it('returns undefined when the binding fetch is not ok in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    refFetch.mockResolvedValue(notFound());

    const result = await loadOgImage('/api/media/file/x.png', ORIGIN);

    expect(result).toBeUndefined();
  });

  it('returns the absolute URL for same-origin media in development without touching the binding', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const result = await loadOgImage('/api/media/file/x.png', ORIGIN);

    expect(result).toBe(`${ORIGIN}/api/media/file/x.png`);
    expect(refFetch).not.toHaveBeenCalled();
  });

  it('returns the absolute URL when the binding is unavailable in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    env.WORKER_SELF_REFERENCE = undefined;

    const result = await loadOgImage('/api/media/file/x.png', ORIGIN);

    expect(result).toBe(`${ORIGIN}/api/media/file/x.png`);
  });
});
