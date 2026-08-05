import { Suspense } from 'react';

import { WorksListSection } from './_components/works-list-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

const worksDescription = '制作物のアーカイブ — 開発・VRChat・映像・グラフィック。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'works',
    description: worksDescription,
    path: '/works',
    feed: { url: '/works/rss.xml', title: 'napochaan — works' },
    markdown: '/works.md',
  });

// Fully static — no searchParams (reading them would opt the route into dynamic
// rendering). Page 1 only; deeper pages live at `/works/page/[num]`.
const WorksPage = () => (
  <Suspense fallback={<DecodingSkeleton fill />}>
    <WorksListSection page={1} />
  </Suspense>
);

export default WorksPage;
