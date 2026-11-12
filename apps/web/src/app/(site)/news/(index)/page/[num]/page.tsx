import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';

import { NewsListSection } from '../../_components/news-list-section';
import { parsePageParam } from '../../../../_lib/parse-page-param';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Pages 2+ at path-keyed `/news/page/[num]` URLs — never `?page=N`: the Workers
// Cache key is the URL, and a query-keyed page could not be told apart by the worker's
// path-based policy. SSR on every cache miss; a CMS publish purges every page.
export const dynamic = 'force-dynamic';

type Params = Promise<{ num: string }>;

type Props = {
  params: Params;
};

const newsDescription = 'お知らせ — 制作・出演・公開のアナウンス。';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { num } = await params;

  return resolveSectionMetadata({
    docTitle: `news — page ${num}`,
    description: newsDescription,
    path: `/news/page/${num}`,
    feed: { url: '/news/rss.xml', title: 'napochaan — news' },
  });
};

const NewsPagedPage = async ({ params }: Props) => {
  const { num } = await params;
  const page = parsePageParam(num);
  if (page === undefined) notFound();
  // `/news/page/1` duplicates the bare `/news` — collapse it to one canonical URL.
  if (page === 1) permanentRedirect('/news');

  return (
    <Suspense fallback={<DecodingSkeleton fill />}>
      <NewsListSection page={page} />
    </Suspense>
  );
};

export default NewsPagedPage;
