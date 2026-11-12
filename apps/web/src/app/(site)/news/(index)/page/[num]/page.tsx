import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';

import { NewsListSection, PAGE_SIZE } from '../../_components/news-list-section';
import { parsePageParam } from '../../../../_lib/parse-page-param';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { findNewsList } from '@lib/payload/news';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Fully static — pages 2+ of the news archive at path-keyed `/news/page/[num]`
// URLs (query-param pagination would opt the route into dynamic rendering). The
// news hook's `/news/page/[num]` pattern purge busts every page on publish/delete.

// Deeper pages only — page 1 is the bare `/news` (its route renders it directly),
// and the build-phase guard makes this [] at `next build` so pages fill on demand.
export const generateStaticParams = async () => {
  const news = await findNewsList();
  const totalPages = Math.ceil(news.length / PAGE_SIZE);

  return Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => ({ num: `${index + 2}` }));
};

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
