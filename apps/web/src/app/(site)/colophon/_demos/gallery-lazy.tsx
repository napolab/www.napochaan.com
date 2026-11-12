'use client';

import dynamic from 'next/dynamic';

// The Gallery is the heaviest demo (client lightbox + six images). Code-split it
// so its JS only loads when the catalog reaches it, behind a Suspense fallback.
export const GalleryLazy = dynamic(() => import('@components/gallery').then((m) => ({ default: m.Gallery })), { ssr: false });
