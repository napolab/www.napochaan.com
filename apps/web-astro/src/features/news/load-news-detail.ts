import { findNewsBySlug, findNewsList } from '@lib/cms/news';

import { adjacentNews } from './lib/adjacent-news';
import { isExternalNews } from './lib/is-external-news';

import type { Adjacent } from './lib/adjacent-news';
import type { NewsItem } from './news-item';

export type NewsDetail = {
  item: NewsItem;
  adjacent: Adjacent;
};

// The detail page's data: the item and its neighbours in the full published list.
// `undefined` → the route's 404: a missing item, or an external-link item, which exists
// in the CMS but points off-site (`item.url`) and has no internal detail page. The
// neighbours come from the unfiltered list, as in Next, so one can be external.
export const loadNewsDetail = async (slug: string): Promise<NewsDetail | undefined> => {
  const item = await findNewsBySlug(slug);
  if (item === undefined || isExternalNews(item)) return undefined;

  return { item, adjacent: adjacentNews(await findNewsList(), slug) };
};
