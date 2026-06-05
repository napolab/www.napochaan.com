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

describe('typography tokens', () => {
  it('text scale base + explosive display clamp', () => {
    expect(tokens.fontSizes.md.value).toBe('1rem');
    expect(tokens.fontSizes.xl.value).toBe('1.4375rem'); // 23px
    expect(tokens.fontSizes.hero.value).toContain('clamp(');
  });
  it('editorial line-heights', () => {
    expect(tokens.lineHeights.none.value).toBe('0.9');
    expect(tokens.lineHeights.body.value).toBe('1.7');
    expect(tokens.lineHeights.jp.value).toBe('1.9');
  });
  it('font families: display digibop, mono config-mono-vf', () => {
    expect(tokens.fonts.display.value).toContain('digibop');
    expect(tokens.fonts.mono.value).toContain('config-mono-vf');
  });
});

describe('shape tokens', () => {
  it('radius is sharp by default + pill only', () => {
    expect(tokens.radii.none.value).toBe('0');
    expect(tokens.radii.pill.value).toBe('9999px');
  });
  it('border widths are hairline/default/strong', () => {
    expect(tokens.borderWidths.hairline.value).toBe('1px');
    expect(tokens.borderWidths.default.value).toBe('2px');
    expect(tokens.borderWidths.strong.value).toBe('3px');
  });
  it('grid cell is the 24px module', () => {
    expect(tokens.sizes.gridCell.value).toBe('24px');
  });
});
