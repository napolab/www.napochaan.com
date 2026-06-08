import { describe, expect, it } from 'vitest';

import { resolveColumns, spanForAspect } from './layout';

describe('resolveColumns', () => {
  it('returns 2 columns below the tablet breakpoint (480)', () => {
    expect(resolveColumns(0)).toBe(2);
    expect(resolveColumns(479)).toBe(2);
  });
  it('returns 3 columns from tablet (480) up to desktop (768)', () => {
    expect(resolveColumns(480)).toBe(3);
    expect(resolveColumns(767)).toBe(3);
  });
  it('returns 4 columns at desktop (768) and above', () => {
    expect(resolveColumns(768)).toBe(4);
    expect(resolveColumns(1920)).toBe(4);
  });
});

describe('spanForAspect', () => {
  it('spans 2 columns for wide images (ratio >= 1.6)', () => {
    expect(spanForAspect(1.6)).toBe(2);
    expect(spanForAspect(16 / 9)).toBe(2);
  });
  it('spans 1 column for portrait and near-square images', () => {
    expect(spanForAspect(1)).toBe(1);
    expect(spanForAspect(400 / 600)).toBe(1);
    expect(spanForAspect(1.59)).toBe(1);
  });
});
