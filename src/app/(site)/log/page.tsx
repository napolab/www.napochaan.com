import { Suspense } from 'react';

import { LogTimelineSection } from './_components/log-timeline-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Revalidate hourly — this page CANNOT go purge-only: it renders external RSS
// posts (outside the CMS, no hook can bust them) and flips `upcoming` as gigs
// pass, both of which need a time window. The chronicle is a single continuous
// page — no pagination — so the whole timeline is statically cached.
export const revalidate = 3600;

const logDescription = '活動年表 — DJ・VJ・リリース・制作物の記録。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'log',
    description: logDescription,
    path: '/log',
    feed: { url: '/log/rss.xml', title: 'napochaan — log' },
    markdown: '/log.md',
  });

const LogPage = () => (
  <Suspense fallback={<DecodingSkeleton fill />}>
    <LogTimelineSection />
  </Suspense>
);

export default LogPage;
