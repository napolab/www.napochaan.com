import { detailBody } from './blog-fixtures';

import type { NewsItem } from '../../features/news/news-item';

const item = (n: number, overrides: Partial<NewsItem> = {}): NewsItem => ({
  id: `${n}`,
  slug: `news-${n}`,
  date: `2026-05-${`${n}`.padStart(2, '0')}`,
  category: 'work',
  title: `news ${n}`,
  ...overrides,
});

// 13 items in CMS order → 2 pages of 10. The pinned `a.b` (dotted slug, internal, with a
// body) comes first although it is older than the external `ext-item` behind it; the
// list is never re-sorted.
export const newsFeed: readonly NewsItem[] = [
  item(30, { slug: 'a.b', date: '2026-04-10', category: 'notification', title: 'Dotted News', body: detailBody }),
  item(31, { slug: 'ext-item', date: '2026-06-18', category: 'vj', title: 'External News', url: 'https://x.com/naporin24690/status/1' }),
  ...Array.from({ length: 11 }, (_, i) => item(20 - i)),
];

export const findNewsFixture = async (slug: string): Promise<NewsItem | undefined> => newsFeed.find((news) => news.slug === slug);
