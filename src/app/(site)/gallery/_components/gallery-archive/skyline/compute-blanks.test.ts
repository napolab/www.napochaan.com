import { describe, expect, it } from 'vitest';

import { computeBlanks } from './compute-blanks';

import type { Placement } from './pack';

describe('computeBlanks', () => {
  it('returns no blanks when every column is filled to totalHeight', () => {
    const placements: Placement[] = [
      { id: 'a', x: 0, y: 0, width: 100, height: 200 },
      { id: 'b', x: 102, y: 0, width: 100, height: 200 },
    ];
    expect(computeBlanks(placements, { columns: 2, width: 202, gap: 2, totalHeight: 200 })).toEqual([]);
  });

  it('ignores the normal 2px seam between stacked photos', () => {
    const placements: Placement[] = [
      { id: 'a', x: 0, y: 0, width: 100, height: 100 },
      { id: 'b', x: 0, y: 102, width: 100, height: 98 },
    ];
    expect(computeBlanks(placements, { columns: 1, width: 100, gap: 2, totalHeight: 200 })).toEqual([]);
  });

  it('fills the ragged bottom of a shorter column, inset by a seam', () => {
    const placements: Placement[] = [
      { id: 'a', x: 0, y: 0, width: 100, height: 200 },
      { id: 'b', x: 102, y: 0, width: 100, height: 80 },
    ];
    const blanks = computeBlanks(placements, { columns: 2, width: 202, gap: 2, totalHeight: 200 });
    expect(blanks).toHaveLength(1);
    expect(blanks[0]).toMatchObject({ x: 102, width: 100 });
    expect(blanks[0]?.y).toBeCloseTo(82);
    expect(blanks[0]?.height).toBeCloseTo(118);
  });

  it('fills an internal gap left beside a wide span item', () => {
    const placements: Placement[] = [
      { id: 'tall', x: 0, y: 0, width: 100, height: 150 },
      { id: 'short', x: 102, y: 0, width: 100, height: 50 },
      { id: 'wide', x: 0, y: 152, width: 202, height: 60 },
    ];
    const blanks = computeBlanks(placements, { columns: 2, width: 202, gap: 2, totalHeight: 212 });
    expect(blanks).toHaveLength(1);
    expect(blanks[0]).toMatchObject({ x: 102, width: 100 });
    expect(blanks[0]?.y).toBeCloseTo(52);
    expect(blanks[0]?.height).toBeCloseTo(100);
  });
});
