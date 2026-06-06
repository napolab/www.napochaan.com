import flyerBooth0424 from '../../(design-system)/_assets/flyer-booth-0424.jpg';
import flyerBooth0523 from '../../(design-system)/_assets/flyer-booth-0523.jpg';
import vrchatAlice from '../../(design-system)/_assets/vrchat-alice.jpg';
import vrchatGlitch from '../../(design-system)/_assets/vrchat-glitch.jpg';
import vrchatSquare from '../../(design-system)/_assets/vrchat-square.jpg';
import vrchatWide from '../../(design-system)/_assets/vrchat-wide.jpg';
import { WorksArchive } from './_components/works-archive';
import * as s from './styles.css';

import { PageHeader } from '@components/page-header';
import { Pagination } from '@components/pagination';

import type { WorkRow } from './_components/works-archive';

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

// Sample archive — replaced by Payload CMS in a later plan. Reuses the same
// design-system assets as the home teaser ledger. Spans 2020–2026 (since 2020)
// so the stacked-spine ledger has enough year groups to accumulate.
const works: readonly WorkRow[] = [
  { id: '1', no: '01', title: 'Booth² key visual', type: 'graphic', year: 2026, thumbnail: { src: vrchatSquare.src, width: vrchatSquare.width, height: vrchatSquare.height } },
  { id: '2', no: '02', title: 'light trails set', type: 'vj', year: 2026, thumbnail: { src: vrchatWide.src, width: vrchatWide.width, height: vrchatWide.height } },
  { id: '3', no: '03', title: 'VRChat stage VJ set', type: 'vj', year: 2025, thumbnail: { src: vrchatGlitch.src, width: vrchatGlitch.width, height: vrchatGlitch.height } },
  { id: '4', no: '04', title: 'midnight flyer 05.23', type: 'flyer', year: 2025, thumbnail: { src: flyerBooth0523.src, width: flyerBooth0523.width, height: flyerBooth0523.height } },
  { id: '5', no: '05', title: 'glitch study', type: 'graphic', year: 2025, thumbnail: { src: vrchatGlitch.src, width: vrchatGlitch.width, height: vrchatGlitch.height } },
  { id: '6', no: '06', title: 'night graphics vol.13', type: 'flyer', year: 2024, thumbnail: { src: flyerBooth0424.src, width: flyerBooth0424.width, height: flyerBooth0424.height } },
  { id: '7', no: '07', title: 'ALICE portrait series', type: 'graphic', year: 2024, thumbnail: { src: vrchatAlice.src, width: vrchatAlice.width, height: vrchatAlice.height } },
  { id: '8', no: '08', title: 'neon grid flyer', type: 'flyer', year: 2023, thumbnail: { src: flyerBooth0424.src, width: flyerBooth0424.width, height: flyerBooth0424.height } },
  { id: '9', no: '09', title: 'techno set @ basement', type: 'vj', year: 2023, thumbnail: { src: vrchatWide.src, width: vrchatWide.width, height: vrchatWide.height } },
  { id: '10', no: '10', title: 'first booth² poster', type: 'graphic', year: 2022, thumbnail: { src: vrchatSquare.src, width: vrchatSquare.width, height: vrchatSquare.height } },
  { id: '11', no: '11', title: 'warehouse VJ rig', type: 'vj', year: 2022, thumbnail: { src: vrchatGlitch.src, width: vrchatGlitch.width, height: vrchatGlitch.height } },
  { id: '12', no: '12', title: 'lockdown stream set', type: 'vj', year: 2021, thumbnail: { src: vrchatWide.src, width: vrchatWide.width, height: vrchatWide.height } },
  { id: '13', no: '13', title: 'zine cover 02', type: 'graphic', year: 2021, thumbnail: { src: vrchatAlice.src, width: vrchatAlice.width, height: vrchatAlice.height } },
  { id: '14', no: '14', title: 'debut night flyer', type: 'flyer', year: 2020, thumbnail: { src: flyerBooth0523.src, width: flyerBooth0523.width, height: flyerBooth0523.height } },
  { id: '15', no: '15', title: 'since 2020 logo', type: 'graphic', year: 2020, thumbnail: { src: vrchatSquare.src, width: vrchatSquare.width, height: vrchatSquare.height } },
];

type Props = {
  searchParams: SearchParams;
};

const WorksPage = async ({ searchParams }: Props) => {
  const { page: raw } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(works.length / PAGE_SIZE));
  const requested = typeof raw === 'string' ? parseInt(raw, 10) : 1;
  const page = Number.isNaN(requested) ? 1 : Math.min(Math.max(requested, 1), totalPages);
  const pageWorks = works.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="works" breadcrumbs={worksCrumbs} kicker="// archive — flyer·graphic·vj" lead="制作物のアーカイブ。グリッドの上に並べた proof のログ。" />
      <WorksArchive works={pageWorks} />
      {totalPages > 1 ? <Pagination currentPage={page} totalPages={totalPages} href={worksHref} /> : null}
    </main>
  );
};

export default WorksPage;
