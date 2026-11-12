export type PageItem = number | 'ellipsis';

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const range = (start: number, end: number): number[] => {
  const length = end - start + 1;
  if (length <= 0) return [];

  return Array.from({ length }, (_, index) => start + index);
};

// Build a compact, ascending page list with single 'ellipsis' markers for hidden
// ranges. An ellipsis replaces a hidden run only when it actually saves space — a
// single hidden page renders as that page (an ellipsis must never stand in for
// exactly one page). The result always includes page 1 and `totalPages`, is
// ascending, and contains no duplicate or adjacent ellipses. `totalPages < 1`
// returns an empty list.
export const paginationRange = (currentPage: number, totalPages: number, siblings = 1): PageItem[] => {
  if (totalPages < 1) return [];

  const current = clamp(currentPage, 1, totalPages);
  const windowStart = Math.max(current - siblings, 1);
  const windowEnd = Math.min(current + siblings, totalPages);

  // Pages hidden between page 1 and the left edge of the window. Two or more hidden
  // pages collapse to an ellipsis; one or zero hidden pages render in full.
  const hiddenLeft = windowStart - 2;
  const left: PageItem[] = hiddenLeft > 1 ? [1, 'ellipsis'] : range(1, windowStart - 1);

  // Mirror of the left boundary on the trailing side.
  const hiddenRight = totalPages - windowEnd - 1;
  const right: PageItem[] = hiddenRight > 1 ? ['ellipsis', totalPages] : range(windowEnd + 1, totalPages);

  return [...left, ...range(windowStart, windowEnd), ...right];
};
