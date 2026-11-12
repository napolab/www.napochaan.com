import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '@lib/payload/client';

import { toWorkItem } from './to-work-item';

import type { WorkRow } from '../../../app/(site)/works/_lib/work-row';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

// Local Payload API bypasses access control (overrideAccess defaults to true),
// so the public-site queries below MUST filter `_status: published` explicitly.
const publishedWhere = { _status: { equals: 'published' } } as const;

// Two-digit display ordinal from a zero-based index: 0 -> '01'.
const ordinal = (index: number): string => `${index + 1}`.padStart(2, '0');

// Cached reads are tagged with CACHE_TAGS.works; the works collection's
// afterChange/afterDelete hooks call `revalidateTag('works')` to bust them.
// The build-phase guard stays OUTSIDE the cache so a build never poisons the
// cache with an empty `[]`.
const fetchWorksList = unstable_cache(
  async (): Promise<readonly WorkRow[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'works',
      where: publishedWhere,
      sort: '-date',
      depth: 1,
      limit: 0,
    });

    return result.docs.map((doc, index) => toWorkItem(doc, ordinal(index)));
  },
  ['works-list'],
  { tags: [CACHE_TAGS.works] },
);

export const findWorksList = async (): Promise<readonly WorkRow[]> => {
  if (isBuildPhase()) return [];

  return fetchWorksList();
};

const fetchWorkBySlug = unstable_cache(
  async (slug: string): Promise<WorkRow | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'works',
      where: { and: [{ slug: { equals: slug } }, publishedWhere] },
      depth: 1,
      limit: 1,
    });

    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return toWorkItem(doc, '01');
  },
  ['works-by-slug'],
  { tags: [CACHE_TAGS.works] },
);

export const findWorkBySlug = async (slug: string): Promise<WorkRow | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchWorkBySlug(slug);
};

// The draft path is intentionally uncached (never wrapped in `unstable_cache`)
// and bypasses the published filter via `draft: true`, so it always returns the
// latest draft regardless of `_status`. Only reachable from the secret-gated
// preview route (`/works/preview/{id}`), so it never leaks drafts to the public site.
export const findWorkDraftById = async (id: string): Promise<WorkRow | undefined> => {
  if (isBuildPhase()) return undefined;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'works',
    where: { id: { equals: id } },
    draft: true,
    overrideAccess: true,
    depth: 1,
    limit: 1,
  });

  const [doc] = result.docs;
  if (doc === undefined) return undefined;

  return toWorkItem(doc, '01');
};
