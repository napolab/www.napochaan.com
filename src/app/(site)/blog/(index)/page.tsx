import { Suspense } from 'react';

import { BlogListSection } from './_components/blog-list-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

const blogDescription = '記事 — プログラミング・DJ・VJ についての覚え書き。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'blog',
    description: blogDescription,
    path: '/blog',
    feed: { url: '/blog/rss.xml', title: 'napochaan — blog' },
    markdown: '/blog.md',
  });

// Fully static — no searchParams (reading them would opt the route into dynamic
// rendering). Page 1 only; deeper pages live at `/blog/page/[num]`.
const BlogPage = () => (
  <Suspense fallback={<DecodingSkeleton fill />}>
    <BlogListSection page={1} />
  </Suspense>
);

export default BlogPage;
