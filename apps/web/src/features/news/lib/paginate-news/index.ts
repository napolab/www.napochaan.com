import { groupNewsByYearMonth } from '../group-by-year-month';

import type { NewsItem } from '../../news-item';
import type { NewsGroup } from '../group-by-year-month';

// Shared with the `/news/page/[num]` route.
export const PAGE_SIZE = 10;

export type NewsPage = {
  groups: readonly NewsGroup[];
  current: number;
  totalPages: number;
};

// Port of NewsListSection's paging: PAGE_SIZE items per page in the CMS order (pinned
// first, then newest — never re-sorted here), each page grouped by year-month. A page
// past the end is `undefined` (a real 404, not a clamp — clamping would cache the last
// page's content under an unbounded set of URLs). An empty feed still has page 1. Pure.
export const paginateNews = (items: readonly NewsItem[], page: number): NewsPage | undefined => {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.max(page, 1);
  if (current > totalPages) return undefined;

  return { groups: groupNewsByYearMonth(items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)), current, totalPages };
};

// The archive owns its URL shape: page 1 is the bare path, deeper pages live at the
// path-keyed `/news/page/N` (never `?page=N`: the Workers Cache key is the URL).
export const newsPageHref = (page: number): string => (page <= 1 ? '/news' : `/news/page/${page}`);
