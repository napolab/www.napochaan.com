import { describe, expect, it } from 'vitest';

import { contrastRatio } from '../contrast';
import { semanticTokens, tokens } from './index';

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

describe('motion tokens', () => {
  it('stepped easing for mechanical feel', () => {
    expect(tokens.easings.stepSnap.value).toBe('steps(3, end)');
    expect(tokens.easings.step1.value).toBe('steps(1)');
  });
  it('durations include glitch', () => {
    expect(tokens.durations.base.value).toBe('150ms');
    expect(tokens.durations.glitch.value).toBe('630ms');
  });
});

const resolve = (ref: string): string => {
  const m = ref.match(/\{colors\.(\w+)\.(\d+)\}/);
  if (m === null) throw new Error(`unresolvable: ${ref}`);
  const group = m[1];
  const step = m[2];
  if (group === undefined || step === undefined) throw new Error(`unresolvable: ${ref}`);
  const scale = tokens.colors[group as 'gray' | 'blue' | 'red'] as Record<number, { value: string } | undefined>;
  const entry = scale[parseInt(step, 10)];
  if (entry === undefined) throw new Error(`missing ${ref}`);
  return entry.value;
};

const sem = (path: string): string => {
  const node = path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)[k], semanticTokens.colors);
  return (node as { value: string }).value;
};

describe('semantic tokens WCAG AA (light theme)', () => {
  const canvas = resolve(sem('bg.canvas'));
  it('fg.default on bg.canvas >= 4.5', () => {
    expect(contrastRatio(resolve(sem('fg.default')), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('fg.muted on bg.canvas >= 4.5', () => {
    expect(contrastRatio(resolve(sem('fg.muted')), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('accent.text on bg.canvas >= 4.5', () => {
    expect(contrastRatio(resolve(sem('accent.text')), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('danger.text on bg.canvas >= 4.5', () => {
    expect(contrastRatio(resolve(sem('danger.text')), canvas)).toBeGreaterThanOrEqual(4.5);
  });
  it('fg.onSolid on accent.solid >= 4.5 (white on blue button)', () => {
    expect(contrastRatio(resolve(sem('fg.onSolid')), resolve(sem('accent.solid')))).toBeGreaterThanOrEqual(4.5);
  });
  it('fg.onDanger on danger.solid >= 5.0 (light label on deep-red button)', () => {
    expect(contrastRatio(resolve(sem('fg.onDanger')), resolve(sem('danger.solid')))).toBeGreaterThanOrEqual(5.0);
  });
  it('fg.onDanger on danger.solidHover >= 4.5 (light label on hover state)', () => {
    expect(contrastRatio(resolve(sem('fg.onDanger')), resolve(sem('danger.solidHover')))).toBeGreaterThanOrEqual(4.5);
  });
  it('danger.spot preserves the vivid decorative red (red-9)', () => {
    expect(sem('danger.spot')).toBe('{colors.red.9}');
  });
});

describe('code syntax palette WCAG (on ink fg.default = gray-12)', () => {
  const grayScale = tokens.colors.gray as Record<number, { value: string } | undefined>;
  const gray12 = grayScale[12];
  if (gray12 === undefined) throw new Error('missing gray-12 token');
  const ink = gray12.value;
  const code = semanticTokens.colors.code as Record<string, { value: string } | undefined>;

  for (const role of ['fg', 'comment', 'keyword', 'string', 'number', 'function', 'punctuation']) {
    it(`code.${role} on ink >= 4.5`, () => {
      const entry = code[role];
      if (entry === undefined) throw new Error(`missing code.${role} token`);
      expect(contrastRatio(entry.value, ink)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
