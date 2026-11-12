import { isPopulatedMedia } from '../is-populated-media';

import type { MediaRefDTO } from '@napochaan/cms-api/services';
import type { Media } from '@payload-types';

// Coerces a wire upload field (NULL / unpopulated id / populated Media) to a
// `MediaRefDTO`, dropping it unless url and every dimension are present. Shared by
// the blog and works thumbnails. Pure.
export const toMediaRef = (value: number | Media | null | undefined): MediaRefDTO | undefined => {
  if (!isPopulatedMedia(value)) return undefined;
  if (value.url === null || value.url === undefined) return undefined;
  if (value.width === null || value.width === undefined) return undefined;
  if (value.height === null || value.height === undefined) return undefined;

  return { src: value.url, width: value.width, height: value.height };
};
