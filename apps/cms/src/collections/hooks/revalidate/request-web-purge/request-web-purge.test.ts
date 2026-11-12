import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestWebPurge } from '.';

const getCloudflareContext = vi.fn();
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => getCloudflareContext() }));

describe('requestWebPurge', () => {
  beforeEach(() => {
    getCloudflareContext.mockReset();
  });

  it('calls env.WEB.purge() once and keeps the request alive with waitUntil', async () => {
    const purge = vi.fn(async () => undefined);
    const waitUntil = vi.fn();
    getCloudflareContext.mockReturnValue({ env: { WEB: { purge } }, ctx: { waitUntil } });

    requestWebPurge();

    expect(waitUntil).toHaveBeenCalledOnce();
    await waitUntil.mock.calls[0]?.[0];
    expect(purge).toHaveBeenCalledOnce();
  });

  it('is a no-op outside a worker (CLI seed/migrate)', () => {
    getCloudflareContext.mockImplementation(() => {
      throw new Error('no context');
    });
    expect(() => requestWebPurge()).not.toThrow();
  });

  it('is a no-op when the WEB binding is missing', () => {
    const waitUntil = vi.fn();
    getCloudflareContext.mockReturnValue({ env: {}, ctx: { waitUntil } });
    expect(() => requestWebPurge()).not.toThrow();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('is a no-op when the WEB binding has no purge RPC method', () => {
    const waitUntil = vi.fn();
    getCloudflareContext.mockReturnValue({ env: { WEB: {} }, ctx: { waitUntil } });
    requestWebPurge();
    expect(waitUntil).not.toHaveBeenCalled();
  });

  // Await the promise handed to waitUntil directly: an unawaited rejection would still be
  // "handled" by vitest's global listener and the test would false-pass.
  it('swallows a rejected purge (web Worker down) instead of rejecting', async () => {
    const purge = vi.fn(async () => {
      throw new Error('web unavailable');
    });
    const waitUntil = vi.fn();
    getCloudflareContext.mockReturnValue({ env: { WEB: { purge } }, ctx: { waitUntil } });

    requestWebPurge();

    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
  });
});
