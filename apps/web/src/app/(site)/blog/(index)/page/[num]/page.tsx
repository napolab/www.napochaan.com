import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';

import { BlogListSection, PAGE_SIZE } from '../../_components/blog-list-section';
import { parsePageParam } from '../../../../_lib/parse-page-param';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { findBlogList } from '@lib/payload/blog';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Fully static — pages 2+ of the blog feed at path-keyed `/blog/page/[num]` URLs
// (query-param pagination would opt the route into dynamic rendering). The blog
// hook's `/blog/page/[num]` pattern purge busts every page on publish/delete.

// Deeper pages only — page 1 is the bare `/blog` (its route renders it directly),
// and the build-phase guard makes this [] at `next build` so pages fill on demand.
export const generateStaticParams = async () => {
  const posts = await findBlogList();
  const totalPages = Math.ceil(posts.length / PAGE_SIZE);

  return Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => ({ num: `${index + 2}` }));
};

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
