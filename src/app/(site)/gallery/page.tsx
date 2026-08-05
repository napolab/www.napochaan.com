import { Suspense } from 'react';

import { GalleryArchiveLoader } from './_components/gallery-archive-loader';

import { DecodingSkeleton } from '@components/decoding-skeleton';

import type { Metadata } from 'next';

// Fully static — no time-based revalidate. The gallery/media hooks bust `/gallery`
// on every change, so the cached HTML refreshes on-demand only.

export const metadata: Metadata = {
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/gallery/rss.xml', title: 'napochaan — gallery' }],
    },
  },
};

const GalleryPage = () => {
  return (
    <section aria-label="作品ギャラリー一覧">
      <Suspense fallback={<DecodingSkeleton rows={6} fill />}>
        <GalleryArchiveLoader />
      </Suspense>
    </section>
  );
};

export default GalleryPage;
