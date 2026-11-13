import { countAlive, createGrid, seedRandom, step, type Grid } from '@components/game-of-life/life';

export type LifeCell = { x: number; y: number; red: boolean };
export type OgLifeBoard = { cells: LifeCell[]; alive: number; cols: number; rows: number };
export type OgLifeBoardOptions = { seed?: number; density?: number; steps?: number };

// Deterministic LCG so the OG board is identical across builds (the OG is
// generated at build / revalidate time — no need for Math.random).
const makeRand = (seed: number): (() => number) => {
  const state = { value: seed >>> 0 };

  return () => {
    state.value = (state.value * 1103515245 + 12345) & 0x7fffffff;

    return state.value / 0x7fffffff;
  };
};

const advance = (grid: Grid, steps: number): Grid => Array.from({ length: steps }).reduce<Grid>((g) => step(g), grid);

// Build a Game-of-Life board for the OG field, reusing the production engine
// (src/components/game-of-life/life.ts). Returns only the live cells (with the
// production red-cell flag) plus the alive count. Pure given the seed.
export const ogLifeBoard = (cols: number, rows: number, options?: OgLifeBoardOptions): OgLifeBoard => {
  const rand = makeRand(options?.seed ?? 20260612);
  const seeded = seedRandom(createGrid(cols, rows), options?.density ?? 0.16, rand);
  const grid = advance(seeded, options?.steps ?? 8);

  const cells = [...grid.cells].flatMap((value, index) => {
    if (value !== 1) return [];

    const x = index % cols;
    const y = Math.floor(index / cols);

    return [{ x, y, red: (x * 31 + y * 17) % 23 === 0 }];
  });

  return { cells, alive: countAlive(grid), cols, rows };
};
