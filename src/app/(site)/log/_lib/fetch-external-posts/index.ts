import { unstable_cache } from 'next/cache';

import { fetchFeed } from '@utils/rss/fetch-feed';

import { EXTERNAL_FEEDS } from '../external-feeds';

import type { ExternalPost } from '../external-feeds';

// Time-based cache: these feeds live outside the CMS, so they aren't tied to any
// revalidateTag. A 1h window keeps /log fresh without hammering the upstreams.
const loadExternalPosts = unstable_cache(
  async (): Promise<readonly ExternalPost[]> => {
    const perFeed = await Promise.all(
      EXTERNAL_FEEDS.map(async (feed) => {
        const items = await fetchFeed(feed.url);

        return items.map((it) => ({ id: `${feed.source}-${it.id}`, title: it.title, link: it.link, date: it.date, source: feed.source }));
      }),
    );

    return perFeed.flat();
  },
  ['external-posts'],
  { revalidate: 3600 },
);

// `next build` cannot reach the network reliably (and would cache a stale prerender),
// so the build phase returns []; ISR fills the real posts at runtime. fetchFeed
// already swallows per-feed failures, so a dead feed degrades to [] gracefully.
export const fetchExternalPosts = async (): Promise<readonly ExternalPost[]> => {
  if (process.env.NEXT_PHASE === 'phase-production-build') return [];

  return loadExternalPosts();
};
