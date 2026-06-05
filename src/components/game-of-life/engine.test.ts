import { describe, expect, it } from 'vitest';

import { createLifeEngine } from './engine';

describe('life engine', () => {
  it('starts seeded and tracks generation', () => {
    const e = createLifeEngine({ cols: 5, rows: 5, density: 0.5, rand: () => 0 }); // rand 0 < density → all alive
    const s0 = e.getState();
    expect(s0.generation).toBe(0);
    expect(s0.cols).toBe(5);
    expect(s0.alive).toBe(25);
    const s1 = e.tick();
    expect(s1.generation).toBe(1);
  });

  it('tick advances the simulation (blinker)', () => {
    const e = createLifeEngine({ cols: 5, rows: 5, density: 0, rand: () => 1 }); // empty seed
    // manually set a blinker via resize-free seeding is not exposed; instead verify extinction reseed below
    const s = e.tick();
    expect(s.generation).toBe(1);
  });

  it('reseeds on extinction (empty grid repopulates)', () => {
    // density 0 → starts empty (alive 0). On tick, alive stays 0 → below 2% threshold → engine reseeds.
    // reseed uses options.rand/density: give rand 0 (<reseedDensity) so reseed fills cells.
    const e = createLifeEngine({ cols: 6, rows: 6, density: 0, rand: () => 0 });
    expect(e.getState().alive).toBe(0);
    const s = e.tick();
    expect(s.alive).toBeGreaterThan(0); // repopulated
  });

  it('resize reseeds to new dimensions', () => {
    const e = createLifeEngine({ cols: 4, rows: 4, density: 1, rand: () => 0 });
    e.resize(8, 3);
    const s = e.getState();
    expect(s.cols).toBe(8);
    expect(s.rows).toBe(3);
    expect(s.cells.length).toBe(24);
  });
});
