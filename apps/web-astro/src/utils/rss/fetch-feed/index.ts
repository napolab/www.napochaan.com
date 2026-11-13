import { parseFeed } from '../parse-feed';

import type { FeedItem } from '../types';

// Fetches and parses an external RSS feed. Resilient by design: a non-OK response,
// a network failure, or malformed XML all resolve to [] so a dead feed never breaks
// the consuming page.
export const fetchFeed = async (url: string): Promise<readonly FeedItem[]> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    return parseFeed(await res.text());
  } catch {
    return [];
  }
};
