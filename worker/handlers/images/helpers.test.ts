import { describe, expect, it } from 'vitest';

import { buildFetchUrl, isAllowedUrl, isGifSource, isInternalAsset, isPayloadMediaPath, resolveOutputFormat } from './helpers';

const ORIGIN = 'https://booth2booth.com';

describe('isPayloadMediaPath', () => {
  it('returns true for payload media paths', () => {
    expect(isPayloadMediaPath('/api/media/file/image.png')).toBe(true);
  });

  it('returns false for non-payload paths', () => {
    expect(isPayloadMediaPath('/images/logo.png')).toBe(false);
    expect(isPayloadMediaPath('/_next/static/image.png')).toBe(false);
  });
});

describe('isAllowedUrl', () => {
  it('allows same-origin URLs', () => {
    const url = new URL('/images/logo.png', ORIGIN);
    expect(isAllowedUrl(url, ORIGIN)).toBe(true);
  });

  it('rejects external URLs not in allowlist', () => {
    const url = new URL('https://evil.com/image.png');
    expect(isAllowedUrl(url, ORIGIN)).toBe(false);
  });
});

describe('buildFetchUrl', () => {
  it('returns origin-prefixed URL for payload media paths', () => {
    const url = new URL('/api/media/file/image.png', ORIGIN);
    expect(buildFetchUrl(url, ORIGIN)).toBe(`${ORIGIN}/api/media/file/image.png`);
  });

  it('preserves query string for payload media paths', () => {
    const url = new URL('/api/media/file/image.png?w=100', ORIGIN);
    expect(buildFetchUrl(url, ORIGIN)).toBe(`${ORIGIN}/api/media/file/image.png?w=100`);
  });

  it('returns full URL string for non-payload paths', () => {
    const url = new URL('/images/logo.png', ORIGIN);
    expect(buildFetchUrl(url, ORIGIN)).toBe(`${ORIGIN}/images/logo.png`);
  });
});

describe('isGifSource', () => {
  it('returns true for image/gif content type', () => {
    expect(isGifSource('image/gif', '/api/media/file/anim')).toBe(true);
  });

  it('returns true for image/gif content type with parameters', () => {
    expect(isGifSource('image/gif; charset=binary', '/api/media/file/anim')).toBe(true);
  });

  it('falls back to the .gif extension when content type is missing', () => {
    expect(isGifSource(null, '/images/anim.gif')).toBe(true);
    expect(isGifSource('application/octet-stream', '/images/anim.GIF')).toBe(true);
  });

  it('returns false for non-gif sources', () => {
    expect(isGifSource('image/png', '/images/logo.png')).toBe(false);
    expect(isGifSource(null, '/images/logo.png')).toBe(false);
  });
});

describe('resolveOutputFormat', () => {
  it('honors an explicit format over everything else', () => {
    expect(resolveOutputFormat({ explicit: 'png', accept: 'image/avif,image/webp', isGif: true })).toBe('image/png');
  });

  it('keeps gif sources animated as webp when the client accepts webp', () => {
    expect(resolveOutputFormat({ explicit: undefined, accept: 'image/avif,image/webp,*/*', isGif: true })).toBe('image/webp');
  });

  it('keeps gif sources as gif when the client does not accept webp', () => {
    expect(resolveOutputFormat({ explicit: undefined, accept: 'image/avif,*/*', isGif: true })).toBe('image/gif');
    expect(resolveOutputFormat({ explicit: undefined, accept: '', isGif: true })).toBe('image/gif');
  });

  it('negotiates avif > webp > jpeg for non-gif sources', () => {
    expect(resolveOutputFormat({ explicit: undefined, accept: 'image/avif,image/webp', isGif: false })).toBe('image/avif');
    expect(resolveOutputFormat({ explicit: undefined, accept: 'image/webp', isGif: false })).toBe('image/webp');
    expect(resolveOutputFormat({ explicit: undefined, accept: '', isGif: false })).toBe('image/jpeg');
  });
});

describe('isInternalAsset', () => {
  it('returns true for same-origin non-payload paths', () => {
    const url = new URL('/_next/static/image.png', ORIGIN);
    expect(isInternalAsset(url, ORIGIN)).toBe(true);
  });

  it('returns false for payload media paths', () => {
    const url = new URL('/api/media/file/image.png', ORIGIN);
    expect(isInternalAsset(url, ORIGIN)).toBe(false);
  });

  it('returns false for external URLs', () => {
    const url = new URL('https://cdn.example.com/image.png');
    expect(isInternalAsset(url, ORIGIN)).toBe(false);
  });
});
