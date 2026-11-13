import { withAppProviders } from '@components/app-providers';

import { GalleryArchive } from './index';

// `GalleryArchive` is a client leaf ('use client' in apps/web): the only kind of component
// a page may hydrate. Placed from `.astro`; see components/app-providers.
export const GalleryArchiveIsland = withAppProviders(GalleryArchive);
