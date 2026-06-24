import { NewsArchive } from '../../../_components/news-archive';
import { groupNewsByYearMonth } from '../../../_lib/group-by-year-month';

import { Pagination } from '@components/pagination';
import { findNewsList } from '@lib/payload/news';

const PAGE_SIZE = 10;

// The archive owns its URL shape: page 1 is the bare path, deeper pages carry
// ?page=N (Pagination doesn't hard-code it).
const newsHref = (page: number): string => (page <= 1 ? '/news' : `/news?page=${page}`);

type Props = {
  page: number;
};

export const NewsListSection = async ({ page }: Props) => {
  // Already published + newest-first from the data layer.
  const sortedNews = await findNewsList();
  const totalPages = Math.max(1, Math.ceil(sortedNews.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), totalPages);
  const pageItems = sortedNews.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const groups = groupNewsByYearMonth(pageItems);

  return (
    <>
      <NewsArchive groups={groups} />
      {totalPages > 1 ? <Pagination currentPage={current} totalPages={totalPages} href={newsHref} /> : null}
    </>
  );
};
