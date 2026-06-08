import type { Placement } from './pack';

type BlanksOptions = { columns: number; width: number; gap: number; totalHeight: number };

// A covered vertical interval [top, bottom) within one column.
type Interval = { top: number; bottom: number };

// The skyline packer leaves two kinds of empty space: a ragged bottom (shorter
// columns end above totalHeight) and internal gaps (a wide span item can sit below
// a column that was shorter than its neighbour). computeBlanks returns one filler
// rectangle per uncovered interval per column — the complement of the placements —
// so the gallery can paint a crosshatch into the blanks. Each filler is inset by a
// `gap` on its top edge so the 2px grid seam survives between a photo and its blank.
export const computeBlanks = (placements: readonly Placement[], options: BlanksOptions): Placement[] => {
  const { columns, width, gap, totalHeight } = options;
  const colW = (width - (columns - 1) * gap) / columns;
  const step = colW + gap;

  const columnIndexes = Array.from({ length: columns }, (_, c) => c);

  return columnIndexes.flatMap((c) => {
    const colX = c * step;

    const covers = placements
      .filter((p) => {
        const startCol = Math.round(p.x / step);
        const span = Math.max(1, Math.round((p.width + gap) / step));

        return startCol <= c && c < startCol + span;
      })
      .map((p): Interval => ({ top: p.y, bottom: p.y + p.height }))
      .sort((a, b) => a.top - b.top);

    const fill = (from: number, to: number, key: string): Placement[] => (to - from > gap ? [{ id: `blank-${c}-${key}`, x: colX, y: from + gap, width: colW, height: to - from - gap }] : []);

    const seed = { cursor: 0, rects: [] as Placement[] };
    const walked = covers.reduce((acc, interval) => {
      const rects = [...acc.rects, ...fill(acc.cursor, interval.top, `${acc.cursor}`)];

      return { cursor: Math.max(acc.cursor, interval.bottom), rects };
    }, seed);

    return [...walked.rects, ...fill(walked.cursor, totalHeight, 'tail')];
  });
};
