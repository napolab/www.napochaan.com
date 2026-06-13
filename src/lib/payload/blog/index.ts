import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toBlogPost } from './to-blog-post';

import type { Post } from '../../../app/(site)/blog/_lib/post';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

// Local Payload API bypasses access control (overrideAccess defaults to true),
// so the public-site queries below MUST filter `_status: published` explicitly.
const publishedWhere = { _status: { equals: 'published' } } as const;

// Two-digit display ordinal from a zero-based index: 0 -> '01'.
const ordinal = (index: number): string => `${index + 1}`.padStart(2, '0');

// Cached reads are tagged with CACHE_TAGS.blog; the blog collection's
// afterChange/afterDelete hooks call `revalidateTag('blog')` to bust them.
// The build-phase guard stays OUTSIDE the cache so a build never poisons the
// cache with an empty `[]`.
const fetchBlogList = unstable_cache(
  async (): Promise<readonly Post[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'blog',
      where: publishedWhere,
      sort: '-publishedAt',
      limit: 0,
    });

    return result.docs.map((doc, index) => toBlogPost(doc, ordinal(index)));
  },
  ['blog-list'],
  { tags: [CACHE_TAGS.blog] },
);

export const findBlogList = async (): Promise<readonly Post[]> => {
  if (isBuildPhase()) return [];

  return fetchBlogList();
};

const fetchBlogById = unstable_cache(
  async (id: string): Promise<Post | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'blog',
      where: { and: [{ id: { equals: id } }, publishedWhere] },
      limit: 1,
    });

    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return toBlogPost(doc, '01');
  },
  ['blog-by-id'],
  { tags: [CACHE_TAGS.blog] },
);

export const findBlogById = async (id: string): Promise<Post | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchBlogById(id);
};

const fetchBlogBySlug = unstable_cache(
  async (slug: string): Promise<Post | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'blog',
      where: { and: [{ slug: { equals: slug } }, publishedWhere] },
      limit: 1,
    });

    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return toBlogPost(doc, '01');
  },
  ['blog-by-slug'],
  { tags: [CACHE_TAGS.blog] },
);

export const findBlogBySlug = async (slug: string): Promise<Post | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchBlogBySlug(slug);
};

// The draft path is intentionally uncached (never wrapped in `unstable_cache`)
// and bypasses the published filter via `draft: true`, so it always returns the
// latest draft regardless of `_status`. Only reachable from the secret-gated
// preview route (`/blog/preview/{id}`), so it never leaks drafts to the public site.
export const findBlogDraftById = async (id: string): Promise<Post | undefined> => {
  if (isBuildPhase()) return undefined;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'blog',
    where: { id: { equals: id } },
    draft: true,
    overrideAccess: true,
    limit: 1,
  });

  const [doc] = result.docs;
  if (doc === undefined) return undefined;

  return toBlogPost(doc, '01');
};
