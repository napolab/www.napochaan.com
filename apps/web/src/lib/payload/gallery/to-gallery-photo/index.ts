import type { GalleryPhoto } from '@components/gallery-archive';
import type { Gallery, Media } from '@payload-types';

const isPopulatedMedia = (value: unknown): value is Media => typeof value === 'object' && value !== null && 'url' in value;

// Maps a Payload `gallery` document to a `GalleryPhoto`. Returns undefined when
// the image upload is unpopulated or lacks usable dimensions, so the caller can
// drop incomplete rows. alt prefers the per-entry override, then the media alt.
export const toGalleryPhoto = (doc: Gallery): GalleryPhoto | undefined => {
  if (!isPopulatedMedia(doc.image)) return undefined;
  const { url, width, height, alt } = doc.image;
  if (url === null || url === undefined) return undefined;
  if (width === null || width === undefined) return undefined;
  if (height === null || height === undefined) return undefined;

  return {
    id: `${doc.id}`,
    src: url,
    width,
    height,
    alt: doc.alt ?? alt ?? '',
    caption: doc.caption ?? '',
  };
};
