import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toNewsItem } from './to-news-item';

import type { NewsItem } from '../../../app/(site)/news/_lib/news-item';

// `next build` hands Payload inert stub D1 bindings (see payload.config.ts), so
// any query at build time throws. Marketing pages prerender with empty data and
// fill in at runtime via ISR + the collection's afterChange revalidateTag hooks.
const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

// Local Payload API bypasses access control (overrideAccess defaults to true),
// so the public-site queries below MUST filter `_status: published` explicitly.
const publishedWhere = { _status: { equals: 'published' } } as const;

// Cached reads are tagged with CACHE_TAGS.news; the news collection's
// afterChange/afterDelete hooks call `revalidateTag('news')` to bust them.
// The build-phase guard stays OUTSIDE the cache so a build never poisons the
// cache with an empty `[]`.
const fetchNewsList = unstable_cache(
  async (): Promise<readonly NewsItem[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'news',
      where: publishedWhere,
      // Pinned items first (the `pinned` checkbox), then newest by date. Among
      // pinned items, newest date still wins.
      sort: ['-pinned', '-publishedAt'],
      limit: 0,
    });

    return result.docs.map(toNewsItem);
  },
  ['news-list'],
  { tags: [CACHE_TAGS.news] },
);

export const findNewsList = async (): Promise<readonly NewsItem[]> => {
  if (isBuildPhase()) return [];

  return fetchNewsList();
};

const fetchNewsBySlug = unstable_cache(
  async (slug: string): Promise<NewsItem | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'news',
      where: { and: [{ slug: { equals: slug } }, publishedWhere] },
      limit: 1,
    });

    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return toNewsItem(doc);
  },
  ['news-by-slug'],
  { tags: [CACHE_TAGS.news] },
);

export const findNewsBySlug = async (slug: string): Promise<NewsItem | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchNewsBySlug(slug);
};

// The draft path is intentionally uncached (never wrapped in `unstable_cache`)
// and bypasses the published filter via `draft: true`, so it always returns the
// latest draft regardless of `_status`. Only reachable from the secret-gated
// preview route (`/news/preview/{id}`), so it never leaks drafts to the public site.
export const findNewsDraftById = async (id: string): Promise<NewsItem | undefined> => {
  if (isBuildPhase()) return undefined;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'news',
    where: { id: { equals: id } },
    draft: true,
    overrideAccess: true,
    limit: 1,
  });

  const [doc] = result.docs;
  if (doc === undefined) return undefined;

  return toNewsItem(doc);
};

const fetchLatestNews = unstable_cache(
  async (limit: number): Promise<readonly NewsItem[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'news',
      where: publishedWhere,
      // Pinned items first, then newest by date. The home teaser shows the top
      // `limit` of this order, so a pinned item is always featured.
      sort: ['-pinned', '-publishedAt'],
      limit,
    });

    return result.docs.map(toNewsItem);
  },
  ['news-latest'],
  { tags: [CACHE_TAGS.news] },
);

export const findLatestNews = async (limit: number): Promise<readonly NewsItem[]> => {
  if (isBuildPhase()) return [];

  return fetchLatestNews(limit);
};
