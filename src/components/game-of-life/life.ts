export type Grid = {
  cols: number;
  rows: number;
  cells: Uint8Array;
};

export const createGrid = (cols: number, rows: number): Grid => ({
  cols,
  rows,
  cells: new Uint8Array(cols * rows),
});

const OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

const neighborCount = (grid: Grid, x: number, y: number): number =>
  OFFSETS.reduce((acc, offset) => {
    const nx = (x + offset[0] + grid.cols) % grid.cols;
    const ny = (y + offset[1] + grid.rows) % grid.rows;
    return acc + (grid.cells[ny * grid.cols + nx] ?? 0);
  }, 0);

const nextCell = (grid: Grid, x: number, y: number): number => {
  const alive = grid.cells[y * grid.cols + x];
  const n = neighborCount(grid, x, y);
  if (alive !== 0) return n === 2 || n === 3 ? 1 : 0;
  return n === 3 ? 1 : 0;
};

export const step = (grid: Grid): Grid => {
  const next = new Uint8Array(grid.cols * grid.rows);
  for (const i of next.keys()) {
    const x = i % grid.cols;
    const y = Math.floor(i / grid.cols);
    next[i] = nextCell(grid, x, y);
  }
  return { cols: grid.cols, rows: grid.rows, cells: next };
};

export const countAlive = (grid: Grid): number => grid.cells.reduce((acc, c) => acc + c, 0);

export const seedRandom = (grid: Grid, density: number, rand: () => number): Grid => ({
  ...grid,
  cells: Uint8Array.from({ length: grid.cells.length }, () => (rand() < density ? 1 : 0)),
});
