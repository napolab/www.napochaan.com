import { Suspense } from 'react';

import { LogTimelineSection } from './_components/log-timeline-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// SSR. The worker caches `/log` under the short `timeSensitive` policy, not `cms`: it
// renders external RSS posts (no CMS purge reaches them) and flips `upcoming` as gigs
// pass. The chronicle is a single continuous page — no pagination.
export const dynamic = 'force-dynamic';

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
