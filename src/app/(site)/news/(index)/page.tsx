import { NewsArchive } from '../_components/news-archive';
import { groupNewsByYearMonth } from '../_lib/group-by-year-month';

import { FeedLink } from '@components/feed-link';
import { PageHeader } from '@components/page-header';
import { Pagination } from '@components/pagination';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';
import { findNewsList } from '@lib/payload/news';

import type { Metadata } from 'next';

const crumbs = [{ href: '/', label: 'home' }, { label: 'news' }] as const;

// Revalidate hourly. NOTE: reading `searchParams` below opts this route into
// dynamic rendering, so this `revalidate` no longer drives static ISR caching —
// kept for parity with the other site pages.
export const revalidate = 3600;

const PAGE_SIZE = 10;

// The archive owns its URL shape: page 1 is the bare path, deeper pages carry
// ?page=N (Pagination doesn't hard-code it).
const newsHref = (page: number): string => (page <= 1 ? '/news' : `/news?page=${page}`);

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
  });

const NewsPage = async ({ searchParams }: Props) => {
  const { page: raw } = await searchParams;
  // Already published + newest-first from the data layer.
  const sortedNews = await findNewsList();
  const totalPages = Math.max(1, Math.ceil(sortedNews.length / PAGE_SIZE));
  const requested = typeof raw === 'string' ? parseInt(raw, 10) : 1;
  const page = Number.isNaN(requested) ? 1 : Math.min(Math.max(requested, 1), totalPages);
  const pageItems = sortedNews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const groups = groupNewsByYearMonth(pageItems);

  return (
    <>
      <PageHeader title="news" breadcrumbs={crumbs} kicker="// お知らせ" lead="近況すぎ〜↑" />
      <FeedLink href="/news/rss.xml" label="news の RSS フィード" />
      <NewsArchive groups={groups} />
      {totalPages > 1 ? <Pagination currentPage={page} totalPages={totalPages} href={newsHref} /> : null}
    </>
  );
};

export default NewsPage;
