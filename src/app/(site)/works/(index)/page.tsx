import { Suspense } from 'react';

import { WorksListSection } from './_components/works-list-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Revalidate hourly. NOTE: reading `searchParams` below opts this route into
// dynamic rendering, so this `revalidate` value no longer drives static ISR
// caching — it is harmless and kept for parity with the home page. Remove it if a
// future build emits a "dynamic route ignores revalidate" warning.
export const revalidate = 3600;

const worksDescription = '制作物のアーカイブ — 開発・VRChat・映像・グラフィック。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'works',
    description: worksDescription,
    path: '/works',
    feed: { url: '/works/rss.xml', title: 'napochaan — works' },
  });

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type Props = {
  searchParams: SearchParams;
};

const WorksPage = async ({ searchParams }: Props) => {
  const { page: raw } = await searchParams;
  const requested = typeof raw === 'string' ? parseInt(raw, 10) : 1;
  const page = Number.isNaN(requested) ? 1 : Math.max(requested, 1);

  return (
    <Suspense fallback={<DecodingSkeleton fill />}>
      <WorksListSection page={page} />
    </Suspense>
  );
};

export default WorksPage;
