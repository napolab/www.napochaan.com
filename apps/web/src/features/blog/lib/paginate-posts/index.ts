import { dayjs } from '@utils/dayjs';

import type { Post } from '../../post';

// Shared with the `/blog/page/[num]` route.
export const PAGE_SIZE = 10;

export type PostPage = {
  posts: readonly Post[];
  current: number;
  totalPages: number;
};

const byDateDesc = (a: Post, b: Post): number => dayjs(b.date).tz('Asia/Tokyo').valueOf() - dayjs(a.date).tz('Asia/Tokyo').valueOf();

// Port of BlogListSection's paging: newest first, PAGE_SIZE per page. A page past the
// end is `undefined` (a real 404, not a clamp — clamping would cache the last page's
// content under an unbounded set of URLs). An empty feed still has page 1. Pure.
export const paginatePosts = (posts: readonly Post[], page: number): PostPage | undefined => {
  const sorted = [...posts].sort(byDateDesc);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.max(page, 1);
  if (current > totalPages) return undefined;

  return { posts: sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), current, totalPages };
};

// The feed owns its URL shape: page 1 is the bare path, deeper pages live at the
// path-keyed `/blog/page/N` (never `?page=N`: the Workers Cache key is the URL).
export const blogPageHref = (page: number): string => (page <= 1 ? '/blog' : `/blog/page/${page}`);
