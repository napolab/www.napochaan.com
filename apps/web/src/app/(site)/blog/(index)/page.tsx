import { Suspense } from 'react';

import { BlogListSection } from './_components/blog-list-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// SSR on every Workers Cache miss; the worker stamps the purge-driven `cms` policy
// (.claude/rules/workers-cache.md) and a CMS publish purges it.
export const dynamic = 'force-dynamic';

const blogDescription = '記事 — プログラミング・DJ・VJ についての覚え書き。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'blog',
    description: blogDescription,
    path: '/blog',
    feed: { url: '/blog/rss.xml', title: 'napochaan — blog' },
    markdown: '/blog.md',
  });

// Page 1 only; deeper pages live at path-keyed `/blog/page/[num]` (never `?page=N` —
// see .claude/rules/workers-cache.md).
const BlogPage = () => (
  <Suspense fallback={<DecodingSkeleton fill />}>
    <BlogListSection page={1} />
  </Suspense>
);

export default BlogPage;
