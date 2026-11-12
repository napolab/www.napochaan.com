import { describe, expect, it } from 'vitest';

import { clampTitle } from './index';

describe('clampTitle', () => {
  it('returns BudouX phrase chunks unchanged when within budget', () => {
    const result = clampTitle('サイトを v3 にリニューアルしました', 40);
    expect(result.truncated).toBe(false);
    expect(result.chunks.join('')).toBe('サイトを v3 にリニューアルしました');
    expect(result.chunks.length).toBeGreaterThan(1); // segmented into 文節
  });

  it('keeps whole 文節 and appends an ellipsis when over budget', () => {
    const result = clampTitle('サイトを v3 にリニューアルしました', 8);
    expect(result.truncated).toBe(true);
    expect(result.chunks.at(-1)?.endsWith('…')).toBe(true);
    expect(result.chunks.join('').length).toBeLessThanOrEqual(9); // budget + ellipsis
  });

  it('hard-clips a single phrase that alone exceeds the budget', () => {
    const result = clampTitle('リニューアルしました', 4);
    expect(result.truncated).toBe(true);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]?.endsWith('…')).toBe(true);
  });

  it('returns no chunks for empty input', () => {
    expect(clampTitle('', 10)).toEqual({ chunks: [], truncated: false });
  });
});
