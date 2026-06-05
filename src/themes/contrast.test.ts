import { describe, expect, it } from 'vitest';

import { contrastRatio, oklchToSrgb, relativeLuminance } from './contrast';

describe('oklchToSrgb', () => {
  it('converts white', () => {
    const { r, g, b } = oklchToSrgb('oklch(1 0 0)');
    expect(r).toBeCloseTo(255, -0.5);
    expect(g).toBeCloseTo(255, -0.5);
    expect(b).toBeCloseTo(255, -0.5);
  });

  it('converts black', () => {
    const { r, g, b } = oklchToSrgb('oklch(0 0 0)');
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('converts electric blue-9 near #1a34ff', () => {
    const { r, g, b } = oklchToSrgb('oklch(0.490 0.287 266)');
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(60);
    expect(b).toBeGreaterThan(220);
  });
});

describe('contrastRatio', () => {
  it('white vs black is 21:1', () => {
    expect(contrastRatio('oklch(1 0 0)', 'oklch(0 0 0)')).toBeCloseTo(21, 0);
  });

  it('blue-9 on paper passes AA normal (>=4.5)', () => {
    expect(contrastRatio('oklch(0.490 0.287 266)', 'oklch(0.963 0.003 265)')).toBeGreaterThanOrEqual(4.5);
  });

  it('ink on red-9 passes AA normal (black text on vivid red)', () => {
    expect(contrastRatio('oklch(0.145 0.020 265)', 'oklch(0.630 0.256 25)')).toBeGreaterThanOrEqual(4.5);
  });

  it('red-9 on paper fails AA normal (documents why red text must use red-11)', () => {
    expect(contrastRatio('oklch(0.630 0.256 25)', 'oklch(0.963 0.003 265)')).toBeLessThan(4.5);
  });
});

describe('relativeLuminance', () => {
  it('white is ~1, black is 0', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2);
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });
});
