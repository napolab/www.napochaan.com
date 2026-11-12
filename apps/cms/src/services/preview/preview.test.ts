import { describe, expect, it } from 'vitest';

import { createPreviewService, safeEqual } from './index';

describe('safeEqual', () => {
  it('is true only for identical strings', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
  });

  it('is false on length mismatch, including prefixes', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('abcd', 'abc')).toBe(false);
  });
});

describe('createPreviewService', () => {
  it('rejects everything when expected is undefined', () => {
    expect(createPreviewService(undefined).verify('x')).toBe(false);
    expect(createPreviewService(undefined).verify('')).toBe(false);
  });

  it('rejects everything when expected is empty', () => {
    expect(createPreviewService('').verify('')).toBe(false);
  });

  it('accepts the matching secret and rejects others', () => {
    const service = createPreviewService('s');

    expect(service.verify('s')).toBe(true);
    expect(service.verify('t')).toBe(false);
    expect(service.verify('')).toBe(false);
    expect(service.verify('ss')).toBe(false);
  });
});
