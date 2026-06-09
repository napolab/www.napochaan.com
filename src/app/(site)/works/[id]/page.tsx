import { notFound } from 'next/navigation';

import { AdjacentNav } from './_components/adjacent-nav';
import { RelatedWorks } from './_components/related-works';
import { WorkDetail } from './_components/work-detail';
import { adjacentWorks } from '../_lib/adjacent-works';
import { relatedWorks } from '../_lib/related-works';
import * as s from './styles.css';

import { findWorkById, findWorksList } from '@lib/payload/works';

import { PageHeader } from '@components/page-header';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Detail pages are static (no searchParams), so this
// drives the static cache for the pre-rendered sample ids.
export const revalidate = 3600;

export const generateStaticParams = async () => {
  const works = await findWorksList();
  return works.map((work) => ({ id: work.id }));
};

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

// Build the breadcrumb trail outside the component scope so the array isn't
// re-created as an inline JSX prop (react-perf/jsx-no-new-array-as-prop).
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: title }];

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { id } = await params;
  const work = await findWorkById(id);

  return {
    get title() {
      if (work === undefined) return 'works';
      return work.title;
    },
    get description() {
      return work?.description;
    },
  };
};

const WorkDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const work = await findWorkById(id);
  if (work === undefined) return notFound();

  const works = await findWorksList();
  const { prev, next } = adjacentWorks(works, id);
  const related = relatedWorks(works, work);
  const crumbs = buildCrumbs(work.title);

  return (
    <main id="main-content" className={s.main}>
      <PageHeader title={work.title} breadcrumbs={crumbs} titleTracking="tight" />
      <WorkDetail work={work} />
      {related.length > 0 ? (
        <>
          <hr className={s.divider} />
          <RelatedWorks works={related} />
        </>
      ) : null}
      <AdjacentNav prev={prev} next={next} />
    </main>
  );
};

export default WorkDetailPage;
