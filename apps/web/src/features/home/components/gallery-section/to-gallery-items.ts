import type { GalleryArea, GalleryItem } from '@components/gallery';
import type { GalleryPhoto } from '@components/gallery-archive';

// The home teaser keeps the original fixed-template grid (not the /gallery masonry).
// Assign the first six CMS photos to the named grid areas in this order.
const AREAS: readonly GalleryArea[] = ['lead', 'wide', 'square', 'inset', 'sub', 'column'];

/** The first six photos, each placed in its grid area. Pure. */
export const toGalleryItems = (photos: readonly GalleryPhoto[]): GalleryItem[] =>
  photos.slice(0, AREAS.length).map((photo, index) => ({
    id: photo.id,
    src: photo.src,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    caption: photo.caption,
    area: AREAS[index] ?? 'square',
  }));
