import { notFound } from 'next/navigation';

import { PostList } from '../../../_components/post-list';

import { Pagination } from '@components/pagination';
import { dayjs } from '@utils/dayjs';
import { findBlogList } from '@lib/payload/blog';

// Shared with the `/blog/page/[num]` route's generateStaticParams.
export const PAGE_SIZE = 10;

// The feed owns its URL shape: page 1 is the bare path, deeper pages live at the
// path-keyed `/blog/page/N` (query params would opt the route into dynamic
// rendering and break static caching).
const blogHref = (page: number): string => (page <= 1 ? '/blog' : `/blog/page/${page}`);

type Props = {
  page: number;
};

export const BlogListSection = async ({ page }: Props) => {
  const posts = await findBlogList();
  const sortedPosts = [...posts].sort((a, b) => dayjs(b.date).tz('Asia/Tokyo').valueOf() - dayjs(a.date).tz('Asia/Tokyo').valueOf());
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / PAGE_SIZE));
  const current = Math.max(page, 1);
  // A page past the end is a real 404, not a clamp — clamping would cache the last
  // page's content under an unbounded set of URLs.
  if (current > totalPages) notFound();
  const pagePosts = sortedPosts.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PostList posts={pagePosts} />
      {totalPages > 1 ? <Pagination currentPage={current} totalPages={totalPages} href={blogHref} /> : null}
    </>
  );
};
