import { describe, expect, it } from 'vitest';

import { createGrid, step, countAlive } from './life';

describe('game of life', () => {
  it('createGrid makes a cols*rows Uint8Array', () => {
    const g = createGrid(3, 2);
    expect(g.cols).toBe(3);
    expect(g.rows).toBe(2);
    expect(g.cells.length).toBe(6);
  });
  it('a block (2x2) is stable', () => {
    const g = createGrid(4, 4);
    for (const [x, y] of [
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
    ] as const)
      g.cells[y * 4 + x] = 1;
    const next = step(g);
    expect([...next.cells]).toEqual([...g.cells]);
  });
  it('a blinker oscillates (horizontal -> vertical)', () => {
    const g = createGrid(5, 5);
    for (const [x, y] of [
      [1, 2],
      [2, 2],
      [3, 2],
    ] as const)
      g.cells[y * 5 + x] = 1;
    const next = step(g);
    expect(next.cells[1 * 5 + 2]).toBe(1);
    expect(next.cells[2 * 5 + 2]).toBe(1);
    expect(next.cells[3 * 5 + 2]).toBe(1);
    expect(next.cells[2 * 5 + 1]).toBe(0);
    expect(next.cells[2 * 5 + 3]).toBe(0);
  });
  it('lone cell dies (underpopulation)', () => {
    const g = createGrid(3, 3);
    g.cells[1 * 3 + 1] = 1;
    expect(countAlive(step(g))).toBe(0);
  });
});
