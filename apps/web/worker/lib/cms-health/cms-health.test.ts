import { describe, expect, it, vi } from 'vitest';

import { createCMSHealth, isDegradedCMSResponse, trackCMSBinding, withTrackedCMS } from './index';

const fetcherReturning = (respond: () => Promise<Response>): Fetcher => ({ fetch: vi.fn(respond), connect: vi.fn() }) as unknown as Fetcher;

describe('isDegradedCMSResponse', () => {
  it.each([500, 502, 503])('treats %i as degraded', (status) => {
    expect(isDegradedCMSResponse(new Response(null, { status }))).toBe(true);
  });

  // 404 / 403 are normal outcomes (missing slug, preview secret mismatch).
  it.each([200, 403, 404])('treats %i as healthy', (status) => {
    expect(isDegradedCMSResponse(new Response(null, { status }))).toBe(false);
  });
});

describe('trackCMSBinding', () => {
  it('marks the request degraded when fetch throws, and rethrows', async () => {
    const health = createCMSHealth();
    const cms = trackCMSBinding(
      fetcherReturning(async () => {
        throw new Error('binding down');
      }),
      health,
    );

    await expect(cms.fetch('https://cms.internal/blog')).rejects.toThrow('binding down');
    expect(health.isDegraded()).toBe(true);
  });

  it('marks the request degraded on a 5xx and passes the response through', async () => {
    const health = createCMSHealth();
    const cms = trackCMSBinding(
      fetcherReturning(async () => new Response('boom', { status: 500 })),
      health,
    );

    const res = await cms.fetch('https://cms.internal/blog');
    expect(res.status).toBe(500);
    expect(health.isDegraded()).toBe(true);
  });

  it('stays healthy on a 404', async () => {
    const health = createCMSHealth();
    const cms = trackCMSBinding(
      fetcherReturning(async () => new Response(null, { status: 404 })),
      health,
    );

    await cms.fetch('https://cms.internal/blog/missing');
    expect(health.isDegraded()).toBe(false);
  });

  it('forwards the original arguments to the binding', async () => {
    const target = fetcherReturning(async () => new Response('ok'));
    const cms = trackCMSBinding(target, createCMSHealth());

    await cms.fetch('https://cms.internal/blog', { method: 'GET' });
    expect(target.fetch).toHaveBeenCalledWith('https://cms.internal/blog', { method: 'GET' });
  });
});

describe('withTrackedCMS', () => {
  it('replaces only the CMS binding', () => {
    const cms = fetcherReturning(async () => new Response('ok'));
    const env = { CMS: cms, BASE_URL: 'https://example.com' } as unknown as Cloudflare.Env;

    const tracked = withTrackedCMS(env, createCMSHealth());

    expect(tracked.CMS).not.toBe(cms);
    expect(tracked.BASE_URL).toBe('https://example.com');
  });

  it('leaves an env without CMS untouched', () => {
    const env = { BASE_URL: 'https://example.com' } as unknown as Cloudflare.Env;
    expect(withTrackedCMS(env, createCMSHealth())).toBe(env);
  });
});
