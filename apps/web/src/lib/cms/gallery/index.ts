import { isBuildPhase } from '../build-phase';
import { getCMSClient } from '@lib/cms/client';
import { fromGalleryPhotoDTO } from '../from-dto/gallery-photo';
import { assertOK } from '../response-error';

import type { GalleryPhoto } from '@components/gallery-archive';

// Published photos in admin order (the cms drops rows without usable media).
// Non-2xx throws.
export const findGalleryList = async (): Promise<readonly GalleryPhoto[]> => {
  if (isBuildPhase()) return [];

  const cms = await getCMSClient();
  const res = await cms.gallery.$get();
  assertOK('GET /gallery', res);

  return (await res.json()).map(fromGalleryPhotoDTO);
};

// Every photo at its latest draft, gated by the preview secret on the cms side.
// Only reachable from the draft-mode preview route. 403 (wrong secret) → [].
export const findGalleryDraftList = async (previewSecret: string): Promise<readonly GalleryPhoto[]> => {
  if (isBuildPhase()) return [];

  const cms = await getCMSClient();
  const res = await cms.drafts.gallery.$get({ header: { 'x-preview-secret': previewSecret } });
  if (res.status === 403) return [];
  assertOK('GET /drafts/gallery', res);

  return (await res.json()).map(fromGalleryPhotoDTO);
};
