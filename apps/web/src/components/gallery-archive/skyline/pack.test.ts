import { describe, expect, it } from 'vitest';

import { pack } from './pack';

import type { PackItem, Placement } from './pack';

// Two cells overlap if their cw-unit rectangles intersect (touching edges is allowed).
const overlaps = (a: Placement, b: Placement): boolean => a.col < b.col + b.span && b.col < a.col + a.span && a.y < b.y + b.height && b.y < a.y + a.height;

const square = (id: string): PackItem => ({ id, ratio: 1, span: 1 });

describe('pack', () => {
  it('returns nothing for an empty list', () => {
    expect(pack([], 4)).toEqual({ placements: [], totalHeight: 0 });
  });

  it('places a single square at the origin one cw tall', () => {
    const { placements, totalHeight } = pack([square('a')], 4);
    expect(placements).toEqual([{ id: 'a', col: 0, span: 1, y: 0, height: 1 }]);
    expect(totalHeight).toBe(1);
  });

  it('preserves source order', () => {
    const { placements } = pack([square('a'), square('b'), square('c')], 4);
    expect(placements.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('lays the first N squares across the top row, left to right', () => {
    const { placements } = pack([square('a'), square('b'), square('c'), square('d')], 4);
    expect(placements.every((p) => p.y === 0)).toBe(true);
    expect(placements.map((p) => p.col)).toEqual([0, 1, 2, 3]);
  });

  it('drops the overflow square under the shortest (leftmost) column', () => {
    const { placements } = pack([square('a'), square('b'), square('c'), square('d'), square('e')], 4);
    const e = placements.find((p) => p.id === 'e');
    expect(e).toMatchObject({ col: 0, y: 1 });
  });

  it('makes a wide (span 2) cell height span * ratio', () => {
    const wide: PackItem = { id: 'w', ratio: 9 / 16, span: 2 };
    const { placements } = pack([wide], 4);
    expect(placements[0]).toMatchObject({ col: 0, span: 2, y: 0 });
    expect(placements[0]?.height).toBeCloseTo(2 * (9 / 16));
  });

  it('clamps span to the column count (span 3 in a 2-column grid = full width)', () => {
    const wide: PackItem = { id: 'w', ratio: 0.5, span: 3 };
    const { placements } = pack([wide], 2);
    expect(placements[0]).toMatchObject({ col: 0, span: 2 });
    expect(placements[0]?.height).toBeCloseTo(1);
  });

  it('produces no overlapping rectangles for a mixed set', () => {
    const items: PackItem[] = [
      { id: '1', ratio: 1.5, span: 1 },
      { id: '2', ratio: 9 / 16, span: 2 },
      { id: '3', ratio: 1, span: 1 },
      { id: '4', ratio: 9 / 16, span: 2 },
      { id: '5', ratio: 1.5, span: 1 },
      { id: '6', ratio: 1, span: 1 },
    ];
    const { placements, totalHeight } = pack(items, 4);
    for (const [i, a] of placements.entries()) {
      for (const b of placements.slice(i + 1)) {
        expect(overlaps(a, b)).toBe(false);
      }
    }
    expect(placements.every((p) => p.y + p.height <= totalHeight + 0.001)).toBe(true);
  });
});
