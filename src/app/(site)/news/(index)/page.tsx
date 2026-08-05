import { Suspense } from 'react';

import { NewsListSection } from './_components/news-list-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

const newsDescription = 'お知らせ — 制作・出演・公開のアナウンス。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'news',
    description: newsDescription,
    path: '/news',
    feed: { url: '/news/rss.xml', title: 'napochaan — news' },
    markdown: '/news.md',
  });

// Fully static — no searchParams (reading them would opt the route into dynamic
// rendering). Page 1 only; deeper pages live at `/news/page/[num]`.
const NewsPage = () => (
  <Suspense fallback={<DecodingSkeleton fill />}>
    <NewsListSection page={1} />
  </Suspense>
);

export default NewsPage;
