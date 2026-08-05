import { notFound } from 'next/navigation';

import { WorksArchive } from '../../../_components/works-archive';

import { Pagination } from '@components/pagination';
import { findWorksList } from '@lib/payload/works';

// Shared with the `/works/page/[num]` route's generateStaticParams.
export const PAGE_SIZE = 50;

// Inject the page href: the archive owns its own URL shape (page 1 is the bare
// path, deeper pages live at the path-keyed `/works/page/N` — query params would
// opt the route into dynamic rendering and break static caching).
const worksHref = (page: number): string => (page <= 1 ? '/works' : `/works/page/${page}`);

type Props = {
  page: number;
};

export const WorksListSection = async ({ page }: Props) => {
  const works = await findWorksList();
  const totalPages = Math.max(1, Math.ceil(works.length / PAGE_SIZE));
  const current = Math.max(page, 1);
  // A page past the end is a real 404, not a clamp — clamping would cache the last
  // page's content under an unbounded set of URLs.
  if (current > totalPages) notFound();
  const pageWorks = works.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <WorksArchive works={pageWorks} />
      {totalPages > 1 ? <Pagination currentPage={current} totalPages={totalPages} href={worksHref} /> : null}
    </>
  );
};
