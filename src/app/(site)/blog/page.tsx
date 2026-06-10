import { PostList } from './_components/post-list';

import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';
import { Pagination } from '@components/pagination';
import { dayjs } from '@utils/dayjs';
import { findBlogList } from '@lib/payload/blog';

import type { Metadata } from 'next';

// Revalidate hourly. NOTE: reading `searchParams` below opts this route into
// dynamic rendering, so this `revalidate` no longer drives static ISR caching —
// kept for parity with the other site pages.
export const revalidate = 3600;

const PAGE_SIZE = 10;

// The shared `<main>` lives in `blog/layout.tsx`; this list renders the page
// header + feed link + list as content only.
const crumbs = [{ href: '/', label: 'home' }, { label: 'blog' }] as const;

// The feed owns its URL shape: page 1 is the bare path, deeper pages carry
// ?page=N (Pagination doesn't hard-code it).
const blogHref = (page: number): string => (page <= 1 ? '/blog' : `/blog?page=${page}`);

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type Props = {
  searchParams: SearchParams;
};

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return 'blog';
    },
    get description() {
      return '記事 — プログラミング・DJ・VJ についての覚え書き。';
    },
    alternates: {
      types: {
        'application/rss+xml': [{ url: '/blog/rss.xml', title: 'napochaan — blog' }],
      },
    },
  };
};

const BlogPage = async ({ searchParams }: Props) => {
  const { page: raw } = await searchParams;
  const posts = await findBlogList();
  const sortedPosts = [...posts].sort((a, b) => dayjs(b.date).tz('Asia/Tokyo').valueOf() - dayjs(a.date).tz('Asia/Tokyo').valueOf());
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / PAGE_SIZE));
  const requested = typeof raw === 'string' ? parseInt(raw, 10) : 1;
  const page = Number.isNaN(requested) ? 1 : Math.min(Math.max(requested, 1), totalPages);
  const pagePosts = sortedPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader title="blog" breadcrumbs={crumbs} kicker="// 記事" lead="あ、ほんと(発見)" />
      <FeedLink href="/blog/rss.xml" label="blog の RSS フィード" />
      <PostList posts={pagePosts} />
      {totalPages > 1 ? <Pagination currentPage={page} totalPages={totalPages} href={blogHref} /> : null}
    </>
  );
};

export default BlogPage;
