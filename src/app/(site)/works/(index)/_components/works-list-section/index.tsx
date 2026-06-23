import { WorksArchive } from '../../../_components/works-archive';

import { Pagination } from '@components/pagination';
import { findWorksList } from '@lib/payload/works';

const PAGE_SIZE = 50;

// Inject the page href: the archive owns its own URL shape (page 1 is the bare
// path, deeper pages carry ?page=N) instead of Pagination hard-coding it.
const worksHref = (page: number): string => (page <= 1 ? '/works' : `/works?page=${page}`);

type Props = {
  page: number;
};

export const WorksListSection = async ({ page }: Props) => {
  const works = await findWorksList();
  const totalPages = Math.max(1, Math.ceil(works.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), totalPages);
  const pageWorks = works.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <WorksArchive works={pageWorks} />
      {totalPages > 1 ? <Pagination currentPage={current} totalPages={totalPages} href={worksHref} /> : null}
    </>
  );
};
