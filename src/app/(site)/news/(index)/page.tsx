import { Suspense } from 'react';

import { NewsListSection } from './_components/news-list-section';

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

const newsDescription = 'お知らせ — 制作・出演・公開のアナウンス。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'news',
    description: newsDescription,
    path: '/news',
    feed: { url: '/news/rss.xml', title: 'napochaan — news' },
    markdown: '/news.md',
  });

const NewsPage = async ({ searchParams }: Props) => {
  const { page: raw } = await searchParams;
  const requested = typeof raw === 'string' ? parseInt(raw, 10) : 1;
  const page = Number.isNaN(requested) ? 1 : Math.max(requested, 1);

  return (
    <Suspense fallback={<DecodingSkeleton fill />}>
      <NewsListSection page={page} />
    </Suspense>
  );
};

export default NewsPage;
