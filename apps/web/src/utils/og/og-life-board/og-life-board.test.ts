import { describe, expect, it } from 'vitest';

import { ogLifeBoard } from './index';

describe('ogLifeBoard', () => {
  it('is deterministic for a fixed seed', () => {
    const a = ogLifeBoard(10, 8, { seed: 42 });
    const b = ogLifeBoard(10, 8, { seed: 42 });
    expect(a.alive).toBe(b.alive);
    expect(a.cells).toEqual(b.cells);
  });

  it('reports board dimensions and a positive alive count', () => {
    const board = ogLifeBoard(20, 12, { seed: 7 });
    expect(board.cols).toBe(20);
    expect(board.rows).toBe(12);
    expect(board.alive).toBeGreaterThan(0);
    expect(board.cells).toHaveLength(board.alive);
  });

  it('flags red cells by the production formula (x*31 + y*17) % 23 === 0', () => {
    const board = ogLifeBoard(20, 12, { seed: 7 });
    for (const cell of board.cells) {
      expect(cell.red).toBe((cell.x * 31 + cell.y * 17) % 23 === 0);
      expect(cell.x).toBeLessThan(20);
      expect(cell.y).toBeLessThan(12);
    }
  });
});
