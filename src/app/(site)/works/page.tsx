import { WorksArchive } from './_components/works-archive';
import * as s from './styles.css';

import { findWorksList } from '@lib/payload/works';

import { PageHeader } from '@components/page-header';
import { Pagination } from '@components/pagination';

// Revalidate hourly. NOTE: reading `searchParams` below opts this route into
// dynamic rendering, so this `revalidate` value no longer drives static ISR
// caching — it is harmless and kept for parity with the home page. Remove it if a
// future build emits a "dynamic route ignores revalidate" warning.
export const revalidate = 3600;

const PAGE_SIZE = 50;

const worksCrumbs = [{ href: '/', label: 'home' }, { label: 'works' }] as const;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Inject the page href: the archive owns its own URL shape (page 1 is the bare
// path, deeper pages carry ?page=N) instead of Pagination hard-coding it.
const worksHref = (page: number): string => (page <= 1 ? '/works' : `/works?page=${page}`);

type Props = {
  searchParams: SearchParams;
};

const WorksPage = async ({ searchParams }: Props) => {
  const { page: raw } = await searchParams;
  const works = await findWorksList();
  const totalPages = Math.max(1, Math.ceil(works.length / PAGE_SIZE));
  const requested = typeof raw === 'string' ? parseInt(raw, 10) : 1;
  const page = Number.isNaN(requested) ? 1 : Math.min(Math.max(requested, 1), totalPages);
  const pageWorks = works.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="works" breadcrumbs={worksCrumbs} kicker="// archive — dev·vrchat·video·graphic" lead="なにかを作るって楽しいんだよなぁ〜😁" />
      <WorksArchive works={pageWorks} />
      {totalPages > 1 ? <Pagination currentPage={page} totalPages={totalPages} href={worksHref} /> : null}
    </main>
  );
};

export default WorksPage;
