import { Suspense } from 'react';

import { BlogListSection } from './_components/blog-list-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Revalidate hourly. NOTE: reading `searchParams` below opts this route into
// dynamic rendering, so this `revalidate` no longer drives static ISR caching —
// kept for parity with the other site pages.
export const revalidate = 3600;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type Props = {
  searchParams: SearchParams;
};

const blogDescription = '記事 — プログラミング・DJ・VJ についての覚え書き。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'blog',
    description: blogDescription,
    path: '/blog',
    feed: { url: '/blog/rss.xml', title: 'napochaan — blog' },
    markdown: '/blog.md',
  });

const BlogPage = async ({ searchParams }: Props) => {
  const { page: raw } = await searchParams;
  const requested = typeof raw === 'string' ? parseInt(raw, 10) : 1;
  const page = Number.isNaN(requested) ? 1 : Math.max(requested, 1);

  return (
    <Suspense fallback={<DecodingSkeleton fill />}>
      <BlogListSection page={page} />
    </Suspense>
  );
};

export default BlogPage;
