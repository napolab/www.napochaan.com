import { Suspense } from 'react';

import { NewsListSection } from './_components/news-list-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// SSR on every Workers Cache miss; the worker stamps the purge-driven `cms` policy
// (.claude/rules/workers-cache.md) and a CMS publish purges it.
export const dynamic = 'force-dynamic';

const newsDescription = 'お知らせ — 制作・出演・公開のアナウンス。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'news',
    description: newsDescription,
    path: '/news',
    feed: { url: '/news/rss.xml', title: 'napochaan — news' },
    markdown: '/news.md',
  });

// Page 1 only; deeper pages live at path-keyed `/news/page/[num]` (never `?page=N` —
// see .claude/rules/workers-cache.md).
const NewsPage = () => (
  <Suspense fallback={<DecodingSkeleton fill />}>
    <NewsListSection page={1} />
  </Suspense>
);

export default NewsPage;
