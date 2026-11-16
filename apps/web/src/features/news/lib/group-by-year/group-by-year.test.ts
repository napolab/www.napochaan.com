import { describe, expect, it } from 'vitest';

import { groupNewsByYear } from './index';

import type { NewsItem } from '../../news-item';

const news: readonly NewsItem[] = [
  { id: '1', slug: 'news-1', date: '2026-06-05', category: 'site', title: 'a' },
  { id: '2', slug: 'news-2', date: '2026-06-01', category: 'live', title: 'b' },
  { id: '3', slug: 'news-3', date: '2025-12-10', category: 'work', title: 'c' },
  { id: '4', slug: 'news-4', date: '2026-05-23', category: 'release', title: 'd' },
  { id: '5', slug: 'news-5', date: '2026-04-04', category: 'blog', title: 'e' },
];

describe('groupNewsByYear', () => {
  it('buckets items into one group per distinct year, merging months', () => {
    const groups = groupNewsByYear(news);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.key)).toEqual(['2026', '2025']);
  });

  it('labels each group with the bare year', () => {
    const groups = groupNewsByYear(news);

    expect(groups.map((group) => group.label)).toEqual(['2026', '2025']);
  });

  it('orders groups by year descending (newest first)', () => {
    const [first] = groupNewsByYear(news);

    expect(first?.key).toBe('2026');
  });

  it('orders items within a group by date descending', () => {
    const [first] = groupNewsByYear(news);

    expect(first?.items.map((item) => item.id)).toEqual(['1', '2', '4', '5']);
  });

  it('buckets by the Asia/Tokyo year, not the UTC year', () => {
    // 2025-12-31T16:00Z is 2026-01-01 01:00 in Asia/Tokyo.
    const groups = groupNewsByYear([{ id: '9', slug: 'news-9', date: '2025-12-31T16:00:00.000Z', category: 'site', title: 'new year' }]);

    expect(groups.map((group) => group.key)).toEqual(['2026']);
  });

  it('does not mutate the input array', () => {
    const input: readonly NewsItem[] = [...news];
    groupNewsByYear(input);

    expect(input.map((item) => item.id)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('returns an empty array for no items', () => {
    expect(groupNewsByYear([])).toEqual([]);
  });
});
