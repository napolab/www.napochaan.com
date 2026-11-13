import type { WorkRow } from '../../work-row';

// Shared with the `/works/page/[num]` route.
export const PAGE_SIZE = 50;

export type WorksPage = {
  works: readonly WorkRow[];
  current: number;
  totalPages: number;
};

// Port of WorksListSection's paging: PAGE_SIZE works per page in the CMS order (never
// re-sorted here). A page past the end is `undefined` (a real 404, not a clamp —
// clamping would cache the last page's content under an unbounded set of URLs). An
// empty archive still has page 1. Pure.
export const paginateWorks = (works: readonly WorkRow[], page: number): WorksPage | undefined => {
  const totalPages = Math.max(1, Math.ceil(works.length / PAGE_SIZE));
  const current = Math.max(page, 1);
  if (current > totalPages) return undefined;

  return { works: works.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), current, totalPages };
};

// The archive owns its URL shape: page 1 is the bare path, deeper pages live at the
// path-keyed `/works/page/N` (never `?page=N`: the Workers Cache key is the URL).
export const worksPageHref = (page: number): string => (page <= 1 ? '/works' : `/works/page/${page}`);
