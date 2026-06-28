import { Suspense } from 'react';

import { GalleryArchiveLoader } from './_components/gallery-archive-loader';

import { DecodingSkeleton } from '@components/decoding-skeleton';

import type { Metadata } from 'next';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

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
