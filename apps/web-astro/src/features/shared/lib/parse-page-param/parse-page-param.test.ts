import { describe, expect, it } from 'vitest';

import { parsePageParam } from '.';

describe('parsePageParam', () => {
  it('parses a plain decimal page number', () => {
    expect(parsePageParam('2')).toBe(2);
    expect(parsePageParam('10')).toBe(10);
  });

  it('accepts page 1 (the route redirects it to the bare path)', () => {
    expect(parsePageParam('1')).toBe(1);
  });

  it('rejects zero and leading zeros so every page has exactly one URL', () => {
    expect(parsePageParam('0')).toBeUndefined();
    expect(parsePageParam('02')).toBeUndefined();
  });

  it('rejects non-numeric, signed, decimal, and empty input', () => {
    expect(parsePageParam('abc')).toBeUndefined();
    expect(parsePageParam('-1')).toBeUndefined();
    expect(parsePageParam('+2')).toBeUndefined();
    expect(parsePageParam('1.5')).toBeUndefined();
    expect(parsePageParam('2e1')).toBeUndefined();
    expect(parsePageParam('')).toBeUndefined();
  });
});
