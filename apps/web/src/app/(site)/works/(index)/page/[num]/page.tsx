import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';

import { WorksListSection } from '../../_components/works-list-section';
import { parsePageParam } from '../../../../_lib/parse-page-param';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Pages 2+ at path-keyed `/works/page/[num]` URLs — never `?page=N`: the Workers
// Cache key is the URL, and a query-keyed page could not be told apart by the worker's
// path-based policy. SSR on every cache miss; a CMS publish purges every page.
export const dynamic = 'force-dynamic';

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
