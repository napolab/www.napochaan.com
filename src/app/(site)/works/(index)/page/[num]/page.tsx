import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';

import { WorksListSection, PAGE_SIZE } from '../../_components/works-list-section';
import { parsePageParam } from '../../../../_lib/parse-page-param';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { findWorksList } from '@lib/payload/works';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Fully static — pages 2+ of the works archive at path-keyed `/works/page/[num]`
// URLs (query-param pagination would opt the route into dynamic rendering). The
// works hook's `/works/page/[num]` pattern purge busts every page on publish/delete.

// Deeper pages only — page 1 is the bare `/works` (its route renders it directly),
// and the build-phase guard makes this [] at `next build` so pages fill on demand.
export const generateStaticParams = async () => {
  const works = await findWorksList();
  const totalPages = Math.ceil(works.length / PAGE_SIZE);

  return Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => ({ num: `${index + 2}` }));
};

type Params = Promise<{ num: string }>;

type Props = {
  params: Params;
};

const worksDescription = '制作物のアーカイブ — 開発・VRChat・映像・グラフィック。';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { num } = await params;

  return resolveSectionMetadata({
    docTitle: `works — page ${num}`,
    description: worksDescription,
    path: `/works/page/${num}`,
    feed: { url: '/works/rss.xml', title: 'napochaan — works' },
  });
};

const WorksPagedPage = async ({ params }: Props) => {
  const { num } = await params;
  const page = parsePageParam(num);
  if (page === undefined) notFound();
  // `/works/page/1` duplicates the bare `/works` — collapse it to one canonical URL.
  if (page === 1) permanentRedirect('/works');

  return (
    <Suspense fallback={<DecodingSkeleton fill />}>
      <WorksListSection page={page} />
    </Suspense>
  );
};

export default WorksPagedPage;
