import { PostList } from '../../../_components/post-list';

import { Pagination } from '@components/pagination';
import { dayjs } from '@utils/dayjs';
import { findBlogList } from '@lib/payload/blog';

const PAGE_SIZE = 10;

// The feed owns its URL shape: page 1 is the bare path, deeper pages carry
// ?page=N (Pagination doesn't hard-code it).
const blogHref = (page: number): string => (page <= 1 ? '/blog' : `/blog?page=${page}`);

type Props = {
  page: number;
};

export const BlogListSection = async ({ page }: Props) => {
  const posts = await findBlogList();
  const sortedPosts = [...posts].sort((a, b) => dayjs(b.date).tz('Asia/Tokyo').valueOf() - dayjs(a.date).tz('Asia/Tokyo').valueOf());
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), totalPages);
  const pagePosts = sortedPosts.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PostList posts={pagePosts} />
      {totalPages > 1 ? <Pagination currentPage={current} totalPages={totalPages} href={blogHref} /> : null}
    </>
  );
};
