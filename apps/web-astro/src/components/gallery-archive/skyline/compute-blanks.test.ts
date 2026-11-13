import { describe, expect, it } from 'vitest';

import { computeBlanks } from './compute-blanks';

import type { Placement } from './pack';

describe('computeBlanks', () => {
  it('returns no blanks when every column is filled to totalHeight', () => {
    const placements: Placement[] = [
      { id: 'a', col: 0, span: 1, y: 0, height: 2 },
      { id: 'b', col: 1, span: 1, y: 0, height: 2 },
    ];
    expect(computeBlanks(placements, 2, 2)).toEqual([]);
  });

  it('ignores a column with no gap (stacked to the bottom)', () => {
    const placements: Placement[] = [
      { id: 'a', col: 0, span: 1, y: 0, height: 1 },
      { id: 'b', col: 0, span: 1, y: 1, height: 1 },
    ];
    expect(computeBlanks(placements, 1, 2)).toEqual([]);
  });

  it('fills the ragged bottom of a shorter column', () => {
    const placements: Placement[] = [
      { id: 'a', col: 0, span: 1, y: 0, height: 2 },
      { id: 'b', col: 1, span: 1, y: 0, height: 0.8 },
    ];
    const blanks = computeBlanks(placements, 2, 2);
    expect(blanks).toHaveLength(1);
    expect(blanks[0]).toMatchObject({ col: 1 });
    expect(blanks[0]?.y).toBeCloseTo(0.8);
    expect(blanks[0]?.height).toBeCloseTo(1.2);
  });

  it('fills an internal gap left beside a wide span item', () => {
    const placements: Placement[] = [
      { id: 'tall', col: 0, span: 1, y: 0, height: 1.5 },
      { id: 'short', col: 1, span: 1, y: 0, height: 0.5 },
      { id: 'wide', col: 0, span: 2, y: 1.5, height: 0.6 },
    ];
    const blanks = computeBlanks(placements, 2, 2.1);
    expect(blanks).toHaveLength(1);
    expect(blanks[0]).toMatchObject({ col: 1 });
    expect(blanks[0]?.y).toBeCloseTo(0.5);
    expect(blanks[0]?.height).toBeCloseTo(1.0);
  });
});
