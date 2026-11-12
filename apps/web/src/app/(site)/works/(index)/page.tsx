import { Suspense } from 'react';

import { WorksListSection } from './_components/works-list-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// SSR on every Workers Cache miss; the worker stamps the purge-driven `cms` policy
// (.claude/rules/workers-cache.md) and a CMS publish purges it.
export const dynamic = 'force-dynamic';

const worksDescription = '制作物のアーカイブ — 開発・VRChat・映像・グラフィック。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'works',
    description: worksDescription,
    path: '/works',
    feed: { url: '/works/rss.xml', title: 'napochaan — works' },
    markdown: '/works.md',
  });

// Page 1 only; deeper pages live at path-keyed `/works/page/[num]` (never `?page=N` —
// see .claude/rules/workers-cache.md).
const WorksPage = () => (
  <Suspense fallback={<DecodingSkeleton fill />}>
    <WorksListSection page={1} />
  </Suspense>
);

export default WorksPage;
