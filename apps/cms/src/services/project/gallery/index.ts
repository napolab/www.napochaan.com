import { toMediaRef } from '../to-media-ref';

import type { GalleryPhotoDTO } from '@napochaan/cms-api/services';
import type { Gallery } from '@payload-types';

// The alt text a photo carries: the per-entry override, then the media alt, else ''.
const resolveAlt = (doc: Gallery): string => {
  if (doc.alt !== null && doc.alt !== undefined) return doc.alt;
  if (typeof doc.image === 'object') return doc.image.alt ?? '';

  return '';
};

// Maps a Payload `gallery` document to `GalleryPhotoDTO`. Returns undefined when the
// image upload is unpopulated or lacks usable dimensions, so the caller can drop
// incomplete rows. An absent caption is left out of the object. Pure.
export const projectGalleryPhoto = (doc: Gallery): GalleryPhotoDTO | undefined => {
  const media = toMediaRef(doc.image);
  if (media === undefined) return undefined;
  const caption = doc.caption ?? undefined;

  return {
    id: `${doc.id}`,
    ...media,
    alt: resolveAlt(doc),
    ...(caption !== undefined && { caption }),
  };
};
