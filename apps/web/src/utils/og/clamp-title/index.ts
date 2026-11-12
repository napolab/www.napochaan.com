import { phrase } from '@utils/phrase';

export type ClampedTitle = { chunks: string[]; truncated: boolean };

type Acc = { chunks: string[]; count: number; done: boolean };

// Title split into wrap units for nowrap-chunk rendering in Satori: BudouX 文節
// for Japanese, further split at whitespace (space kept as a prefix) so Latin
// titles break between words instead of overflowing as one unbreakable chunk.
// Clamped to `maxChars`; an ellipsis is appended to the last kept unit, and a
// first unit longer than the budget is hard-clipped. Pure.
export const clampTitle = (title: string, maxChars: number): ClampedTitle => {
  const segments = phrase(title)
    .flatMap((segment) => segment.split(/(?=\s)/))
    .filter((segment) => segment !== '');
  if (segments.length === 0) return { chunks: [], truncated: false };

  const total = segments.reduce((n, s) => n + s.length, 0);
  if (total <= maxChars) return { chunks: segments, truncated: false };

  const kept = segments.reduce<Acc>(
    (acc, seg) => {
      if (acc.done || acc.count + seg.length > maxChars) return { ...acc, done: true };

      return { chunks: [...acc.chunks, seg], count: acc.count + seg.length, done: false };
    },
    { chunks: [], count: 0, done: false },
  ).chunks;

  if (kept.length === 0) {
    const head = title.slice(0, Math.max(1, maxChars - 1));

    return { chunks: [`${head}…`], truncated: true };
  }

  const [last] = kept.slice(-1);

  return { chunks: [...kept.slice(0, -1), `${last}…`], truncated: true };
};
