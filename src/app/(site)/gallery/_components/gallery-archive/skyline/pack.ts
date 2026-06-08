export type PackItem = { id: string; width: number; height: number; span: number };
export type Placement = { id: string; x: number; y: number; width: number; height: number };
export type PackResult = { placements: Placement[]; totalHeight: number };
export type PackOptions = { width: number; gap: number; columns: number };

const clampSpan = (span: number, columns: number): number => Math.max(1, Math.min(span, columns));

// The skyline sampled per column: heights[c] is the current filled bottom of column c.
// The best start for a span is the leftmost column whose covered shelf (max height
// across the span) is lowest — this keeps source order reading left-to-right.
const bestStart = (heights: readonly number[], span: number): { start: number; y: number } => {
  const candidates = Array.from({ length: heights.length - span + 1 }, (_, start) => ({
    start,
    y: Math.max(...heights.slice(start, start + span)),
  }));

  return candidates.reduce((best, candidate) => (candidate.y < best.y ? candidate : best));
};

type Acc = { heights: number[]; placements: Placement[] };

export const pack = (items: readonly PackItem[], options: PackOptions): PackResult => {
  const { width, gap, columns } = options;
  const colW = (width - (columns - 1) * gap) / columns;

  const seed: Acc = { heights: Array.from({ length: columns }, () => 0), placements: [] };

  const { placements } = items.reduce<Acc>((acc, item) => {
    const span = clampSpan(item.span, columns);
    const itemW = span * colW + (span - 1) * gap;
    const { start, y } = bestStart(acc.heights, span);
    const x = start * (colW + gap);
    const itemH = itemW * (item.height / item.width);
    const placement: Placement = { id: item.id, x, y, width: itemW, height: itemH };
    const nextBottom = y + itemH + gap;
    const heights = acc.heights.map((h, i) => (i >= start && i < start + span ? nextBottom : h));

    return { heights, placements: [...acc.placements, placement] };
  }, seed);

  const totalHeight = placements.reduce((max, p) => Math.max(max, p.y + p.height), 0);

  return { placements, totalHeight };
};
