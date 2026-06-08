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
      sort: '-publishedAt',
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

const fetchNewsById = unstable_cache(
  async (id: string): Promise<NewsItem | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'news',
      where: { and: [{ id: { equals: id } }, publishedWhere] },
      limit: 1,
    });

    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return toNewsItem(doc);
  },
  ['news-by-id'],
  { tags: [CACHE_TAGS.news] },
);

export const findNewsById = async (id: string): Promise<NewsItem | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchNewsById(id);
};

const fetchLatestNews = unstable_cache(
  async (limit: number): Promise<readonly NewsItem[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'news',
      where: publishedWhere,
      sort: '-publishedAt',
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
