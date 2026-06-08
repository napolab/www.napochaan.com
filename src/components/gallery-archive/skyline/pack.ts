// Column-width (cw) unit skyline packing. Everything is expressed in cw units — the
// column width — with no pixel gap, so every position is a pure multiple of cw and
// never depends on the viewport. CSS turns the units into pixels via
// `calc(var(--cw) * n)`, which makes the layout responsive and shift-free with zero
// measurement. The 2px seams are drawn as 1px cell borders, not a packing gap.
export type PackItem = {
  id: string;
  // intrinsic height / width — the cell's height in cw units is span * ratio.
  ratio: number;
  span: number;
};

// col is an integer column index; y and height are in cw units.
export type Placement = { id: string; col: number; span: number; y: number; height: number };
export type PackResult = { placements: Placement[]; totalHeight: number };

const clampSpan = (span: number, columns: number): number => Math.max(1, Math.min(span, columns));

// The skyline sampled per column (filled bottom of each column, in cw units). The best
// start for a span is the leftmost column whose covered shelf (max height across the
// span) is lowest — keeping source order reading left-to-right.
const bestStart = (heights: readonly number[], span: number): { start: number; y: number } => {
  const candidates = Array.from({ length: heights.length - span + 1 }, (_, start) => ({
    start,
    y: Math.max(...heights.slice(start, start + span)),
  }));

  return candidates.reduce((best, candidate) => (candidate.y < best.y ? candidate : best));
};

type Acc = { heights: number[]; placements: Placement[] };

export const pack = (items: readonly PackItem[], columns: number): PackResult => {
  const seed: Acc = { heights: Array.from({ length: columns }, () => 0), placements: [] };

  const { heights, placements } = items.reduce<Acc>((acc, item) => {
    const span = clampSpan(item.span, columns);
    const { start, y } = bestStart(acc.heights, span);
    // cell width = span (cw); cell height = width * ratio = span * ratio (cw).
    const height = span * item.ratio;
    const placement: Placement = { id: item.id, col: start, span, y, height };
    const bottom = y + height;
    const nextHeights = acc.heights.map((h, i) => (i >= start && i < start + span ? bottom : h));

    return { heights: nextHeights, placements: [...acc.placements, placement] };
  }, seed);

  const totalHeight = heights.reduce((max, h) => Math.max(max, h), 0);

  return { placements, totalHeight };
};
