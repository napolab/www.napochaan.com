'use client';

import dynamic from 'next/dynamic';

// The skyline masonry is heavy (per-photo lightbox + the BlankDim client islands), so
// code-split it like the editorial Gallery — its JS only loads when the catalog reaches
// it, behind a Suspense fallback.
export const GalleryArchiveLazy = dynamic(() => import('@components/gallery-archive').then((m) => ({ default: m.GalleryArchive })), { ssr: false });
