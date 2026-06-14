import { describe, expect, it } from 'vitest';

import { isProductionHost } from './index';

describe('isProductionHost', () => {
  it('treats the apex production host as production', () => {
    expect(isProductionHost('https://napochaan.com')).toBe(true);
  });

  it('treats the www production host as production', () => {
    expect(isProductionHost('https://www.napochaan.com')).toBe(true);
  });

  it('treats a path-bearing production URL as production', () => {
    expect(isProductionHost('https://napochaan.com/works/abc')).toBe(true);
  });

  it('treats the staging host as non-production', () => {
    expect(isProductionHost('https://stg.napochaan.com')).toBe(false);
  });

  it('treats localhost as non-production', () => {
    expect(isProductionHost('http://localhost:3000')).toBe(false);
    expect(isProductionHost('http://localhost:8787')).toBe(false);
  });

  it('treats an unknown host as non-production (fail closed)', () => {
    expect(isProductionHost('https://preview.example.com')).toBe(false);
  });
});
