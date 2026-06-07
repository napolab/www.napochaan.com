import { describe, expect, it } from 'vitest';

import { groupNewsByYearMonth } from './index';

import type { NewsItem } from '../news-item';

const news: readonly NewsItem[] = [
  { id: '1', date: '2026-06-05', category: 'site', title: 'a' },
  { id: '2', date: '2026-06-01', category: 'live', title: 'b' },
  { id: '3', date: '2026-05-23', category: 'release', title: 'c' },
  { id: '4', date: '2026-04-04', category: 'blog', title: 'd' },
];

describe('groupNewsByYearMonth', () => {
  it('buckets items into one group per distinct year-month', () => {
    const groups = groupNewsByYearMonth(news);

    expect(groups).toHaveLength(3);
    expect(groups.map((group) => group.key)).toEqual(['2026-06', '2026-05', '2026-04']);
  });

  it('formats the label as `YYYY / MM`', () => {
    const groups = groupNewsByYearMonth(news);

    expect(groups.map((group) => group.label)).toEqual(['2026 / 06', '2026 / 05', '2026 / 04']);
  });

  it('orders groups by key descending (newest first)', () => {
    const [first] = groupNewsByYearMonth(news);

    expect(first?.key).toBe('2026-06');
  });

  it('orders items within a group by date descending', () => {
    const [first] = groupNewsByYearMonth(news);

    expect(first?.items.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('does not mutate the input array', () => {
    const input: readonly NewsItem[] = [...news];
    groupNewsByYearMonth(input);

    expect(input.map((item) => item.id)).toEqual(['1', '2', '3', '4']);
  });

  it('returns an empty array for no items', () => {
    expect(groupNewsByYearMonth([])).toEqual([]);
  });
});
