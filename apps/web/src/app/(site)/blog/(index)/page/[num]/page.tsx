import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';

import { BlogListSection } from '../../_components/blog-list-section';
import { parsePageParam } from '../../../../_lib/parse-page-param';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Pages 2+ at path-keyed `/blog/page/[num]` URLs — never `?page=N`: the Workers
// Cache key is the URL, and a query-keyed page could not be told apart by the worker's
// path-based policy. SSR on every cache miss; a CMS publish purges every page.
export const dynamic = 'force-dynamic';

type Params = Promise<{ num: string }>;

type Props = {
  params: Params;
};

const blogDescription = '記事 — プログラミング・DJ・VJ についての覚え書き。';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { num } = await params;

  return resolveSectionMetadata({
    docTitle: `blog — page ${num}`,
    description: blogDescription,
    path: `/blog/page/${num}`,
    feed: { url: '/blog/rss.xml', title: 'napochaan — blog' },
  });
};

const BlogPagedPage = async ({ params }: Props) => {
  const { num } = await params;
  const page = parsePageParam(num);
  if (page === undefined) notFound();
  // `/blog/page/1` duplicates the bare `/blog` — collapse it to one canonical URL.
  if (page === 1) permanentRedirect('/blog');

  return (
    <Suspense fallback={<DecodingSkeleton fill />}>
      <BlogListSection page={page} />
    </Suspense>
  );
};

export default BlogPagedPage;
