import { describe, expect, it, vi } from 'vitest';

import { resolveOgImage } from './combined-runner';

import type { OgImageContext } from '../types';

const ORIGIN = 'https://stg.napochaan.com';
const MEDIA = `${ORIGIN}/api/media/file/x.png`;

// Real JPEG magic bytes (ff d8 ff …): the runner sniffs the body, not the header.
const jpegResponse = (): Response =>
  ({
    ok: true,
    arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0x00]).buffer,
  }) as unknown as Response;
// RIFF…WEBP magic: a Satori-unsupported format that must fall back to no-image.
const webpResponse = (): Response =>
  ({
    ok: true,
    arrayBuffer: async () => new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]).buffer,
  }) as unknown as Response;
const notFound = (): Response => ({ ok: false, status: 404 }) as unknown as Response;

const createCtx = (overrides: Partial<OgImageContext> = {}): OgImageContext => ({
  absolute: MEDIA,
  origin: ORIGIN,
  env: { CMS: { fetch: vi.fn().mockResolvedValue(jpegResponse()) } } as unknown as CloudflareEnv,
  ...overrides,
});

const requestedURL = (ctx: OgImageContext): string => {
  const [request] = vi.mocked(ctx.env.CMS?.fetch ?? vi.fn()).mock.calls[0] ?? [];
  if (!(request instanceof Request)) throw new Error('CMS.fetch was not called with a Request');
  return request.url;
};

describe('resolveOgImage', () => {
  it('passes a non-media URL through the external runner unchanged', async () => {
    const ctx = createCtx({ absolute: 'https://cdn.example.com/x.png' });

    const result = await resolveOgImage(ctx);

    expect(result).toBe('https://cdn.example.com/x.png');
  });

  it('inlines same-origin media fetched from the cms /media/:filename as a data URL in production', async () => {
    const ctx = createCtx();

    const result = await resolveOgImage(ctx);

    expect(requestedURL(ctx)).toBe('https://cms.internal/media/x.png');
    expect(result).toBe('data:image/jpeg;base64,/9j/AA==');
  });

  it('re-encodes a percent-encoded media filename exactly once for the cms', async () => {
    const ctx = createCtx({ absolute: `${ORIGIN}/api/media/file/a%20b%E5%86%99.png` });

    await resolveOgImage(ctx);

    expect(requestedURL(ctx)).toBe(`https://cms.internal/media/${encodeURIComponent('a b写.png')}`);
  });

  it('returns undefined when the binding serves a Satori-unsupported format (WebP)', async () => {
    const ctx = createCtx({
      env: { CMS: { fetch: vi.fn().mockResolvedValue(webpResponse()) } } as unknown as CloudflareEnv,
    });

    const result = await resolveOgImage(ctx);

    expect(result).toBeUndefined();
  });

  it('returns the absolute URL when the binding is unavailable in production', async () => {
    const ctx = createCtx({ env: {} as unknown as CloudflareEnv });

    const result = await resolveOgImage(ctx);

    expect(result).toBe(MEDIA);
  });

  it('returns undefined when the binding fetch is not ok in production', async () => {
    const ctx = createCtx({
      env: { CMS: { fetch: vi.fn().mockResolvedValue(notFound()) } } as unknown as CloudflareEnv,
    });

    const result = await resolveOgImage(ctx);

    expect(result).toBeUndefined();
  });
});
