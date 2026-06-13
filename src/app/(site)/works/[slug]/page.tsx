import { notFound } from 'next/navigation';

import { AdjacentNav } from './_components/adjacent-nav';
import { RelatedWorks } from './_components/related-works';
import { WorkDetail } from './_components/work-detail';
import { adjacentWorks } from '../_lib/adjacent-works';
import { relatedWorks } from '../_lib/related-works';
import * as s from './styles.css';

import { findWorkBySlug, findWorksList } from '@lib/payload/works';

import { PageHeader } from '@components/page-header';
import { ShareBar } from '@components/share-bar';
import { absoluteUrl } from '@utils/site-url';
import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Detail pages are static (no searchParams), so this
// drives the static cache for the pre-rendered sample slugs.
export const revalidate = 3600;

export const generateStaticParams = async () => {
  const works = await findWorksList();
  return works.map((work) => ({ slug: work.slug }));
};

type Params = Promise<{ slug: string }>;

type Props = {
  params: Params;
};

// Build the breadcrumb trail outside the component scope so the array isn't
// re-created as an inline JSX prop (react-perf/jsx-no-new-array-as-prop).
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: title }];

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const work = await findWorkBySlug(slug);
  if (work === undefined) return { title: 'works' };

  return resolveDetailMetadata({
    docTitle: work.title,
    path: `/works/${slug}`,
    seo: work.seo,
    body: work.body,
    descriptionCandidates: [work.description],
    imageCandidates: [work.thumbnail?.src],
    genericDescription: 'works',
    defaultImage: '/og-default.png',
  });
};

const WorkDetailPage = async ({ params }: Props) => {
  const { slug } = await params;
  const work = await findWorkBySlug(slug);
  if (work === undefined) return notFound();

  const works = await findWorksList();
  const { prev, next } = adjacentWorks(works, slug);
  const related = relatedWorks(works, work);
  const crumbs = buildCrumbs(work.title);

  // Renders inside the works segment's shared `<main>` (see `works/layout.tsx`).
  return (
    <>
      <PageHeader title={work.title} breadcrumbs={crumbs} titleTracking="tight" />
      <WorkDetail work={work} url={absoluteUrl(`/works/${slug}`)} />
      {related.length > 0 ? (
        <>
          <hr className={s.divider} />
          <RelatedWorks works={related} />
        </>
      ) : null}
      <ShareBar url={absoluteUrl(`/works/${slug}`)} title={work.title} />
      <AdjacentNav prev={prev} next={next} />
    </>
  );
};

export default WorkDetailPage;
