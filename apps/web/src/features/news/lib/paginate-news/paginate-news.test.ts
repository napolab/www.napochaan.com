import { describe, expect, it } from 'vitest';

import { newsPageHref, PAGE_SIZE, paginateNews } from './index';

import type { NewsItem } from '../../news-item';

const item = (n: number, date: string): NewsItem => ({ id: `${n}`, slug: `news-${n}`, date, category: 'work', title: `news ${n}` });

// CMS order: a pinned (older) item first, then newest first — the list is never re-sorted.
const feed: readonly NewsItem[] = [item(0, '2026-01-05'), ...Array.from({ length: 12 }, (_, i) => item(i + 1, `2026-06-${`${20 - i}`.padStart(2, '0')}`))];

describe('paginateNews', () => {
  it('slices PAGE_SIZE items in the CMS order (pinned first) and groups them by year-month', () => {
    const first = paginateNews(feed, 1);
    expect(first?.totalPages).toBe(2);
    expect(first?.current).toBe(1);
    expect(first?.groups.map((group) => group.key)).toEqual(['2026-06', '2026-01']);
    expect(first?.groups.flatMap((group) => group.items).length).toBe(PAGE_SIZE);
    expect(first?.groups.at(-1)?.items.map((news) => news.slug)).toEqual(['news-0']);
  });

  it('serves the rest on page 2', () => {
    expect(paginateNews(feed, 2)?.groups.flatMap((group) => group.items.map((news) => news.slug))).toEqual(['news-10', 'news-11', 'news-12']);
  });

  it('returns undefined past the last page', () => {
    expect(paginateNews(feed, 3)).toBeUndefined();
  });

  it('keeps page 1 for an empty feed', () => {
    expect(paginateNews([], 1)).toEqual({ groups: [], current: 1, totalPages: 1 });
  });
});

describe('newsPageHref', () => {
  it('keeps page 1 on the bare path', () => {
    expect(newsPageHref(1)).toBe('/news');
    expect(newsPageHref(2)).toBe('/news/page/2');
  });
});
