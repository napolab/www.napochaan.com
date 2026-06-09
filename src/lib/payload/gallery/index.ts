import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toGalleryPhoto } from './to-gallery-photo';

import type { GalleryPhoto } from '@components/gallery-archive';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

// Local Payload API bypasses access control (overrideAccess defaults to true),
// so the public-site queries below MUST filter `_status: published` explicitly.
const publishedWhere = { _status: { equals: 'published' } } as const;

// Cached reads are tagged with CACHE_TAGS.gallery; the gallery collection's
// afterChange/afterDelete hooks call `revalidateTag('gallery')` to bust them.
// The build-phase guard stays OUTSIDE the cache so a build never poisons the
// cache with an empty `[]`.
const fetchGalleryList = unstable_cache(
  async (): Promise<readonly GalleryPhoto[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'gallery',
      where: publishedWhere,
      sort: '_order',
      depth: 1,
      limit: 0,
    });

    return result.docs.map(toGalleryPhoto).filter((photo): photo is GalleryPhoto => photo !== undefined);
  },
  ['gallery-list'],
  { tags: [CACHE_TAGS.gallery] },
);

export const findGalleryList = async (): Promise<readonly GalleryPhoto[]> => {
  if (isBuildPhase()) return [];

  return fetchGalleryList();
};

// The draft path is intentionally uncached (never wrapped in `unstable_cache`)
// and drops the published filter via `draft: true`, so each photo resolves to
// its latest draft regardless of `_status`. Only reachable from the secret-gated
// preview route (`/gallery/preview`), so it never leaks drafts to the public site.
export const findGalleryDraftList = async (): Promise<readonly GalleryPhoto[]> => {
  if (isBuildPhase()) return [];

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'gallery',
    draft: true,
    overrideAccess: true,
    sort: '_order',
    depth: 1,
    limit: 0,
  });

  return result.docs.map(toGalleryPhoto).filter((photo): photo is GalleryPhoto => photo !== undefined);
};
