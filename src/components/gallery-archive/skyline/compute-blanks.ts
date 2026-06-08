import type { Placement } from './pack';

// Per-column blank in cw units: column index + y/height. Width is always one column.
export type Blank = { id: string; col: number; y: number; height: number };

// Smallest cw-unit gap worth filling — guards against zero-height slivers from float
// error.
const EPSILON = 0.001;

// The skyline leaves two kinds of empty space: a ragged bottom (shorter columns end
// above totalHeight) and internal gaps (a wide span can sit below a shorter neighbour).
// computeBlanks returns one filler per uncovered interval per column — the complement
// of the placements — all in cw units. Seams are drawn by the cells' 1px borders, so
// there is no inset here.
export const computeBlanks = (placements: readonly Placement[], columns: number, totalHeight: number): Blank[] => {
  const columnIndexes = Array.from({ length: columns }, (_, c) => c);

  return columnIndexes.flatMap((c) => {
    const covers = placements
      .filter((p) => p.col <= c && c < p.col + p.span)
      .map((p) => ({ top: p.y, bottom: p.y + p.height }))
      .sort((a, b) => a.top - b.top);

    const fill = (from: number, to: number, key: string): Blank[] => (to - from > EPSILON ? [{ id: `blank-${c}-${key}`, col: c, y: from, height: to - from }] : []);

    const seed = { cursor: 0, rects: [] as Blank[] };
    const walked = covers.reduce((acc, interval) => {
      const rects = [...acc.rects, ...fill(acc.cursor, interval.top, `${acc.cursor}`)];

      return { cursor: Math.max(acc.cursor, interval.bottom), rects };
    }, seed);

    return [...walked.rects, ...fill(walked.cursor, totalHeight, 'tail')];
  });
};
