import { describe, expect, it } from 'vitest';

import { buildFetchUrl, isAllowedUrl, isInternalAsset, isPayloadMediaPath } from './helpers';

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
