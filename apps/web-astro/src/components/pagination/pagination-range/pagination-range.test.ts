import { describe, expect, it } from 'vitest';

import { paginationRange } from './index';

describe('paginationRange', () => {
  it('returns a single page when there is one page', () => {
    expect(paginationRange(1, 1)).toEqual([1]);
  });

  it('returns every page when the total fits without gaps', () => {
    expect(paginationRange(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses the trailing gap when current is at the start', () => {
    expect(paginationRange(1, 10)).toEqual([1, 2, 'ellipsis', 10]);
  });

  it('collapses both gaps when current is in the middle', () => {
    expect(paginationRange(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  });

  it('collapses the leading gap when current is at the end', () => {
    // Mirror of (1,10): the window is current±siblings clamped to range, so page 10
    // shows {9,10}. Pages 2..8 (7 pages) collapse to one ellipsis. This is the
    // symmetric counterpart of [1, 2, 'ellipsis', 10]; it intentionally does not pad
    // the boundary to a fixed width (which would contradict the (1,10) example).
    expect(paginationRange(10, 10)).toEqual([1, 'ellipsis', 9, 10]);
  });

  it('renders the hidden page instead of an ellipsis when the gap is exactly one page', () => {
    // currentPage 4 of 7, siblings 1 -> window 3,4,5; page 2 is the single gap between 1 and 3.
    // It must show 2, not an ellipsis.
    expect(paginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('shows a single page rather than an ellipsis on the trailing side too', () => {
    // currentPage 5 of 9, siblings 1 -> window 4,5,6. Page 8 alone sits between 6 and 9.
    expect(paginationRange(5, 9)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 9]);
    // currentPage 6 of 9 -> window 5,6,7; page 3 alone between 1 and 5 shows as 3; trailing 8 shows as 8.
    expect(paginationRange(6, 9)).toEqual([1, 'ellipsis', 5, 6, 7, 8, 9]);
  });

  it('respects a custom sibling count', () => {
    // siblings=2 -> window 3..7. Page 2 is the single hidden page between 1 and 3, so
    // the "never hide exactly one page behind an ellipsis" rule renders it in full.
    expect(paginationRange(5, 10, 2)).toEqual([1, 2, 3, 4, 5, 6, 7, 'ellipsis', 10]);
  });

  it('clamps the current page into range and stays ascending and unique', () => {
    // current clamps to 5 (= totalPages). Window 4,5; pages 2,3 (two pages) collapse
    // to an ellipsis since hiding them saves a slot.
    const result = paginationRange(99, 5);
    expect(result).toEqual([1, 'ellipsis', 4, 5]);
  });

  it('returns an empty array when there are no pages', () => {
    expect(paginationRange(1, 0)).toEqual([]);
  });

  it('returns an empty array for negative totals', () => {
    expect(paginationRange(1, -3)).toEqual([]);
  });
});
