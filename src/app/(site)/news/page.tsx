import { NewsArchive } from './_components/news-archive';
import { groupNewsByYearMonth } from './_lib/group-by-year-month';
import { news } from './sample-news';
import * as s from './styles.css';

import { PageHeader } from '@components/page-header';
import { Pagination } from '@components/pagination';
import { dayjs } from '@utils/dayjs';

import type { Metadata } from 'next';

// Revalidate hourly. NOTE: reading `searchParams` below opts this route into
// dynamic rendering, so this `revalidate` no longer drives static ISR caching —
// kept for parity with the other site pages.
export const revalidate = 3600;

const PAGE_SIZE = 10;

// Built at module scope so it isn't re-created as an inline JSX array prop
// (react-perf/jsx-no-new-array-as-prop).
const crumbs = [{ href: '/', label: 'home' }, { label: 'news' }];

// The archive owns its URL shape: page 1 is the bare path, deeper pages carry
// ?page=N (Pagination doesn't hard-code it).
const newsHref = (page: number): string => (page <= 1 ? '/news' : `/news?page=${page}`);

// Full feed flattened newest-first, so a page slice crosses year-month groups
// cleanly before the slice is re-grouped for display.
const sortedNews = [...news].sort((a, b) => dayjs(b.date).tz('Asia/Tokyo').valueOf() - dayjs(a.date).tz('Asia/Tokyo').valueOf());

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type Props = {
  searchParams: SearchParams;
};

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return 'news';
    },
    get description() {
      return 'お知らせ — 制作・出演・公開のアナウンス。';
    },
  };
};

const NewsPage = async ({ searchParams }: Props) => {
  const { page: raw } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(sortedNews.length / PAGE_SIZE));
  const requested = typeof raw === 'string' ? parseInt(raw, 10) : 1;
  const page = Number.isNaN(requested) ? 1 : Math.min(Math.max(requested, 1), totalPages);
  const pageItems = sortedNews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const groups = groupNewsByYearMonth(pageItems);

  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="news" breadcrumbs={crumbs} kicker="// お知らせ" lead="近況すぎ〜↑" />
      <NewsArchive groups={groups} />
      {totalPages > 1 ? <Pagination currentPage={page} totalPages={totalPages} href={newsHref} /> : null}
    </main>
  );
};

export default NewsPage;
