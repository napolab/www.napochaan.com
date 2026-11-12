import { fetchFeed } from '@utils/rss/fetch-feed';

import { EXTERNAL_FEEDS } from '../external-feeds';

import type { ExternalPost } from '../external-feeds';

// Fetched on every SSR render. The pages that show these posts (`/`, `/log`, `/log.md`,
// `/log/rss.xml`) are cached by Workers Cache under the short `timeSensitive` policy,
// which is what bounds both freshness and upstream load — a CMS purge never reaches
// these feeds. fetchFeed swallows per-feed failures, so a dead feed degrades to [].
export const fetchExternalPosts = async (): Promise<readonly ExternalPost[]> => {
  const perFeed = await Promise.all(
    EXTERNAL_FEEDS.map(async (feed) => {
      const items = await fetchFeed(feed.url);

      return items.map((it) => ({ id: `${feed.source}-${it.id}`, title: it.title, link: it.link, date: it.date, source: feed.source }));
    }),
  );

  return perFeed.flat();
};
