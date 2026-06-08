import { extractPlainText } from '../extract-plain-text';

import type { NewsItem } from '../../_lib/news-item';
import type { ItemData } from '@utils/rss/types';

export type ToItemDataInput = {
  item: NewsItem;
  origin: string;
};

const permalink = (origin: string, id: string): string => `${origin}/news/${id}`;

// RSS `<link>` MUST be absolute. An external `url` (http/https) is used as-is; an
// internal relative override (e.g. `/works`) is resolved against `origin`; an
// absent `url` falls back to the canonical permalink.
const resolveLink = (item: NewsItem, origin: string): string => {
  if (item.url === undefined) return permalink(origin, item.id);
  if (item.url.startsWith('/')) return `${origin}${item.url}`;

  return item.url;
};

// Adapts a news-specific NewsItem (lexical body, optional url override) to the
// generic ItemData consumed by createRssDocument. guid stays the internal
// permalink even when link points elsewhere.
export const toItemData = ({ item, origin }: ToItemDataInput): ItemData => ({
  title: item.title,
  link: resolveLink(item, origin),
  guid: permalink(origin, item.id),
  pubDate: item.date,
  category: item.category,
  description: extractPlainText(item.body),
});
