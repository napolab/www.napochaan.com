import { describe, expect, it } from 'vitest';

import { contrastRatio } from '../contrast';
import { tokens } from './index';

const val = (group: 'gray' | 'blue' | 'red', step: number): string => {
  const scale = tokens.colors[group] as Record<number, { value: string } | undefined>;
  const entry = scale[step];
  if (entry === undefined) throw new Error(`missing step ${step} in ${group}`);
  return entry.value;
};

describe('color ramps', () => {
  it('blue-9 is the electric brand blue', () => {
    expect(val('blue', 9)).toBe('oklch(0.490 0.287 266)');
  });
  it('red-9 is the vivid danger red', () => {
    expect(val('red', 9)).toBe('oklch(0.630 0.256 25)');
  });
  it('gray is a cool neutral (hue 265)', () => {
    expect(val('gray', 1)).toContain('265');
  });
  it('only blue, red, gray ramps exist (no pink/violet/cyan)', () => {
    expect(tokens.colors).not.toHaveProperty('pink');
    expect(tokens.colors).not.toHaveProperty('violet');
  });
});

describe('raw ramp WCAG (on paper gray-1)', () => {
  it('ink (gray-12) on paper >= 4.5', () => {
    expect(contrastRatio(val('gray', 12), val('gray', 1))).toBeGreaterThanOrEqual(4.5);
  });
  it('blue-9 on paper >= 4.5 (link text safe)', () => {
    expect(contrastRatio(val('blue', 9), val('gray', 1))).toBeGreaterThanOrEqual(4.5);
  });
  it('ink on red-9 >= 4.5 (black label on red button)', () => {
    expect(contrastRatio(val('gray', 12), val('red', 9))).toBeGreaterThanOrEqual(4.5);
  });
});
