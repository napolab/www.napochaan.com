import { dayjs } from '@utils/dayjs';

import type { NewsItem } from '../../news-item';

export type NewsGroup = {
  key: string;
  label: string;
  items: NewsItem[];
};

// The Asia/Tokyo year bucket key for an item (e.g. '2026').
const groupKey = (item: NewsItem): string => dayjs(item.date).tz('Asia/Tokyo').format('YYYY');

// Date descending — newest first. Compared as ISO strings, which sort
// lexicographically in chronological order.
const byDateDesc = (a: NewsItem, b: NewsItem): number => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

// Group announcements by their Asia/Tokyo year. Groups are ordered by key
// descending (newest year first) and items within each group by date
// descending. The year key doubles as the heading label. Pure — neither the
// input array nor its items are mutated.
export const groupNewsByYear = (items: readonly NewsItem[]): NewsGroup[] => {
  const buckets = items.reduce<Map<string, NewsItem[]>>((acc, item) => {
    const key = groupKey(item);
    const existing = acc.get(key) ?? [];

    return acc.set(key, [...existing, item]);
  }, new Map());

  return [...buckets.keys()]
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((key) => ({
      key,
      label: key,
      items: [...(buckets.get(key) ?? [])].sort(byDateDesc),
    }));
};
