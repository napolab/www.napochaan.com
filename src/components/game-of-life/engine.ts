import { countAlive, createGrid, seedRandom, step, type Grid } from './life';

export type LifeEngineOptions = {
  cols: number;
  rows: number;
  density?: number;
  rand?: () => number;
  stagnationLimit?: number;
};

export type LifeState = {
  cells: Uint8Array;
  cols: number;
  rows: number;
  generation: number;
  alive: number;
};

export type LifeEngine = {
  tick: () => LifeState;
  resize: (cols: number, rows: number) => void;
  getState: () => LifeState;
};

type InternalState = {
  grid: Grid;
  generation: number;
  lastAlive: number;
  stagnation: number;
};

const snapshot = (state: InternalState): LifeState => ({
  cells: state.grid.cells,
  cols: state.grid.cols,
  rows: state.grid.rows,
  generation: state.generation,
  alive: countAlive(state.grid),
});

const RESEED_DENSITY = 0.16;

export const createLifeEngine = (options: LifeEngineOptions): LifeEngine => {
  const density = options.density ?? RESEED_DENSITY;
  const rand = options.rand ?? Math.random;
  const stagnationLimit = options.stagnationLimit ?? 12;

  const state: InternalState = {
    grid: seedRandom(createGrid(options.cols, options.rows), density, rand),
    generation: 0,
    lastAlive: -1,
    stagnation: 0,
  };

  const reseed = () => {
    const { cols, rows } = state.grid;
    state.grid = seedRandom(createGrid(cols, rows), RESEED_DENSITY, rand);
    state.stagnation = 0;
    state.lastAlive = countAlive(state.grid);
  };

  const tick = (): LifeState => {
    state.grid = step(state.grid);
    state.generation++;
    const alive = countAlive(state.grid);

    state.stagnation = alive === state.lastAlive ? state.stagnation + 1 : 0;
    state.lastAlive = alive;

    const threshold = state.grid.cells.length * 0.02;
    if (alive < threshold || state.stagnation > stagnationLimit) reseed();

    return snapshot(state);
  };

  const resize = (cols: number, rows: number) => {
    state.grid = seedRandom(createGrid(cols, rows), RESEED_DENSITY, rand);
    state.generation = 0;
    state.lastAlive = -1;
    state.stagnation = 0;
  };

  const getState = (): LifeState => snapshot(state);

  return { tick, resize, getState };
};
