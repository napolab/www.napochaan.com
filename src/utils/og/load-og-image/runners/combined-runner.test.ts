import { describe, expect, it, vi } from 'vitest';

import { resolveOgImage } from './combined-runner';

import type { OgImageContext } from '../types';

const ORIGIN = 'https://stg.napochaan.com';
const MEDIA = `${ORIGIN}/api/media/file/x.png`;

const okResponse = (): Response =>
  ({
    ok: true,
    headers: { get: () => 'image/png' },
    arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
  }) as unknown as Response;
const notFound = (): Response => ({ ok: false, status: 404 }) as unknown as Response;

const createCtx = (overrides: Partial<OgImageContext> = {}): OgImageContext => ({
  absolute: MEDIA,
  origin: ORIGIN,
  isDev: false,
  env: { WORKER_SELF_REFERENCE: { fetch: vi.fn().mockResolvedValue(okResponse()) } } as unknown as CloudflareEnv,
  ...overrides,
});

describe('resolveOgImage', () => {
  it('passes a non-media URL through the external runner unchanged', async () => {
    const ctx = createCtx({ absolute: 'https://cdn.example.com/x.png' });

    const result = await resolveOgImage(ctx);

    expect(result).toBe('https://cdn.example.com/x.png');
  });

  it('returns the absolute URL for same-origin media in development', async () => {
    const ctx = createCtx({ isDev: true });

    const result = await resolveOgImage(ctx);

    expect(result).toBe(MEDIA);
  });

  it('inlines same-origin media via the binding as a data URL in production', async () => {
    const ctx = createCtx();

    const result = await resolveOgImage(ctx);

    expect(ctx.env.WORKER_SELF_REFERENCE?.fetch).toHaveBeenCalledWith(MEDIA);
    expect(result).toBe('data:image/png;base64,AQIDBA==');
  });

  it('returns the absolute URL when the binding is unavailable in production', async () => {
    const ctx = createCtx({ env: {} as unknown as CloudflareEnv });

    const result = await resolveOgImage(ctx);

    expect(result).toBe(MEDIA);
  });

  it('returns undefined when the binding fetch is not ok in production', async () => {
    const ctx = createCtx({
      env: { WORKER_SELF_REFERENCE: { fetch: vi.fn().mockResolvedValue(notFound()) } } as unknown as CloudflareEnv,
    });

    const result = await resolveOgImage(ctx);

    expect(result).toBeUndefined();
  });
});
