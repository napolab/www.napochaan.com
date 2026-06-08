import { describe, expect, it } from 'vitest';

import { pack } from './pack';

import type { PackItem, Placement } from './pack';

// True if two placement rectangles overlap (touching edges is allowed).
const overlaps = (a: Placement, b: Placement): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const square = (id: string): PackItem => ({ id, width: 100, height: 100, span: 1 });

describe('pack', () => {
  it('returns nothing for an empty list', () => {
    expect(pack([], { width: 800, gap: 2, columns: 4 })).toEqual({ placements: [], totalHeight: 0 });
  });

  it('places a single 1-span item at the origin with the column width', () => {
    const { placements } = pack([square('a')], { width: 800, gap: 2, columns: 4 });
    const colW = (800 - 3 * 2) / 4;
    expect(placements).toHaveLength(1);
    expect(placements[0]).toMatchObject({ id: 'a', x: 0, y: 0, width: colW });
    expect(placements[0]?.height).toBeCloseTo(colW);
  });

  it('preserves source order in the output', () => {
    const { placements } = pack([square('a'), square('b'), square('c')], { width: 800, gap: 2, columns: 4 });
    expect(placements.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('lays the first N equal items across the top row, left to right', () => {
    const { placements } = pack([square('a'), square('b'), square('c'), square('d')], { width: 800, gap: 2, columns: 4 });
    expect(placements.every((p) => p.y === 0)).toBe(true);
    const xs = placements.map((p) => p.x);
    expect([...xs].sort((m, n) => m - n)).toEqual(xs);
    expect(new Set(xs).size).toBe(xs.length);
  });

  it('drops the overflow item under the shortest (leftmost) column', () => {
    const items = [square('a'), square('b'), square('c'), square('d'), square('e')];
    const { placements } = pack(items, { width: 800, gap: 2, columns: 4 });
    const colW = (800 - 3 * 2) / 4;
    const e = placements.find((p) => p.id === 'e');
    expect(e?.x).toBe(0);
    expect(e?.y).toBeCloseTo(colW + 2);
  });

  it('gives a wide item (span 2) twice the column width plus the inner gap', () => {
    const wide: PackItem = { id: 'w', width: 160, height: 90, span: 2 };
    const { placements } = pack([wide], { width: 800, gap: 2, columns: 4 });
    const colW = (800 - 3 * 2) / 4;
    expect(placements[0]?.width).toBeCloseTo(2 * colW + 2);
  });

  it('clamps span to the column count (span 3 in a 2-column grid = full width)', () => {
    const wide: PackItem = { id: 'w', width: 160, height: 90, span: 3 };
    const { placements } = pack([wide], { width: 480, gap: 2, columns: 2 });
    expect(placements[0]?.width).toBeCloseTo(480);
    expect(placements[0]?.x).toBe(0);
  });

  it('produces no overlapping rectangles for a mixed set', () => {
    const items: PackItem[] = [
      { id: '1', width: 400, height: 600, span: 1 },
      { id: '2', width: 160, height: 90, span: 2 },
      { id: '3', width: 100, height: 100, span: 1 },
      { id: '4', width: 160, height: 90, span: 2 },
      { id: '5', width: 400, height: 600, span: 1 },
      { id: '6', width: 100, height: 100, span: 1 },
    ];
    const { placements, totalHeight } = pack(items, { width: 800, gap: 2, columns: 4 });
    for (const [i, a] of placements.entries()) {
      for (const b of placements.slice(i + 1)) {
        expect(overlaps(a, b)).toBe(false);
      }
    }
    expect(placements.every((p) => p.y + p.height <= totalHeight + 0.001)).toBe(true);
  });
});
