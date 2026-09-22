import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCloudflareContext = vi.fn();
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => getCloudflareContext() }));

describe('purgeWorkersCache', () => {
  beforeEach(() => {
    getCloudflareContext.mockReset();
  });

  it('purges everything through the execution context and keeps the request alive with waitUntil', async () => {
    const purge = vi.fn(async () => ({ success: true }));
    const waitUntil = vi.fn();
    getCloudflareContext.mockReturnValue({ ctx: { cache: { purge }, waitUntil } });
    const { purgeWorkersCache } = await import('./purge-workers-cache');

    purgeWorkersCache();

    expect(purge).toHaveBeenCalledWith({ purgeEverything: true });
    expect(waitUntil).toHaveBeenCalledOnce();
  });

  it('is a no-op outside a worker (CLI seed/migrate)', async () => {
    getCloudflareContext.mockImplementation(() => {
      throw new Error('no context');
    });
    const { purgeWorkersCache } = await import('./purge-workers-cache');
    expect(() => purgeWorkersCache()).not.toThrow();
  });

  it('is a no-op when the runtime has no cache binding (cache disabled)', async () => {
    const waitUntil = vi.fn();
    getCloudflareContext.mockReturnValue({ ctx: { waitUntil } });
    const { purgeWorkersCache } = await import('./purge-workers-cache');
    purgeWorkersCache();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  // A failed purge only delays freshness until the next write (see the inline
  // comment in purge-workers-cache.ts) — it must never surface as an unhandled
  // rejection. Await the promise handed to waitUntil directly: an unawaited
  // rejection would otherwise still be "handled" by vitest's global rejection
  // listener and the test would false-pass.
  it('swallows a rejected purge instead of throwing or rejecting unhandled', async () => {
    const purge = vi.fn(async () => {
      throw new Error('cache API unavailable');
    });
    const waitUntil = vi.fn();
    getCloudflareContext.mockReturnValue({ ctx: { cache: { purge }, waitUntil } });
    const { purgeWorkersCache } = await import('./purge-workers-cache');

    purgeWorkersCache();

    expect(waitUntil).toHaveBeenCalledOnce();
    const [awaited] = waitUntil.mock.calls[0] ?? [];
    await expect(awaited).resolves.toBeUndefined();
  });
});
