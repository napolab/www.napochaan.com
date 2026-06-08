import { describe, expect, it } from 'vitest';

import { buildLogTimeline } from './index';

import type { LogManualItem } from '../log-manual-item';
import type { ExternalPost } from '../external-feeds';
import type { NewsItem } from '../../../news/_lib/news-item';
import type { WorkRow } from '../../../works/_lib/work-row';

const now = '2026-06-08T00:00:00.000Z';

const work = (overrides: Partial<WorkRow> & Pick<WorkRow, 'id' | 'year'>): WorkRow => ({
  no: '00',
  title: `work ${overrides.id}`,
  type: 'graphic',
  ...overrides,
});

const newsItem = (overrides: Partial<NewsItem> & Pick<NewsItem, 'id' | 'date' | 'category'>): NewsItem => ({
  title: `news ${overrides.id}`,
  ...overrides,
});

const post = (overrides: Partial<ExternalPost> & Pick<ExternalPost, 'id' | 'date' | 'source'>): ExternalPost => ({
  title: `post ${overrides.id}`,
  link: `https://example.com/${overrides.id}`,
  ...overrides,
});

describe('buildLogTimeline', () => {
  it('keeps live/release news and drops site/blog news', () => {
    const news = [
      newsItem({ id: '1', date: '2026-05-01', category: 'live' }),
      newsItem({ id: '2', date: '2026-05-02', category: 'release' }),
      newsItem({ id: '3', date: '2026-05-03', category: 'site' }),
      newsItem({ id: '4', date: '2026-05-04', category: 'blog' }),
    ];

    const [group] = buildLogTimeline(news, [], [], now);
    const ids = group?.items.map((item) => item.id) ?? [];

    expect(ids).toContain('news-1');
    expect(ids).toContain('news-2');
    expect(ids).not.toContain('news-3');
    expect(ids).not.toContain('news-4');
  });

  it('merges news and works into the same year group', () => {
    const news = [newsItem({ id: '1', date: '2026-05-01', category: 'live' })];
    const works = [work({ id: '1', year: 2026 })];

    const groups = buildLogTimeline(news, works, [], now);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.year).toBe(2026);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['news-1', 'work-1']);
  });

  it('orders years newest first and, within a year, dated news (desc) before works', () => {
    const news = [
      newsItem({ id: 'a', date: '2025-03-01', category: 'live' }),
      newsItem({ id: 'b', date: '2026-01-10', category: 'release' }),
      newsItem({ id: 'c', date: '2026-04-20', category: 'live' }),
    ];
    const works = [work({ id: 'w1', year: 2026 }), work({ id: 'w2', year: 2025 })];

    const groups = buildLogTimeline(news, works, [], now);

    expect(groups.map((group) => group.year)).toEqual([2026, 2025]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['news-c', 'news-b', 'work-w1']);
    expect(groups[1]?.items.map((item) => item.id)).toEqual(['news-a', 'work-w2']);
  });

  it('formats news date as MM.DD and works date as an em dash', () => {
    const news = [newsItem({ id: '1', date: '2026-04-09', category: 'live' })];
    const works = [work({ id: '1', year: 2026 })];

    const [group] = buildLogTimeline(news, works, [], now);

    expect(group?.items[0]?.date).toBe('04.09');
    expect(group?.items[1]?.date).toBe('—');
  });

  it('marks a news entry upcoming only when its date is strictly after now', () => {
    const news = [
      newsItem({ id: 'past', date: '2026-06-01', category: 'live' }),
      newsItem({ id: 'today', date: '2026-06-08', category: 'live' }),
      newsItem({ id: 'future', date: '2026-06-20', category: 'live' }),
    ];

    const [group] = buildLogTimeline(news, [], [], now);
    const byId = new Map(group?.items.map((item) => [item.id, item.upcoming]));

    expect(byId.get('news-past')).toBe(false);
    expect(byId.get('news-today')).toBe(false);
    expect(byId.get('news-future')).toBe(true);
  });

  it('sets upcoming false for all works', () => {
    const works = [work({ id: '1', year: 2026 })];

    const [group] = buildLogTimeline([], works, [], now);

    expect(group?.items[0]?.upcoming).toBe(false);
  });

  it('leaves a news entry without an href when the source has no url', () => {
    const news = [newsItem({ id: '7', date: '2026-05-01', category: 'live' })];

    const [group] = buildLogTimeline(news, [], [], now);

    expect(group?.items[0]?.href).toBeUndefined();
  });

  it('passes an internal news url through as the href', () => {
    const news = [newsItem({ id: '7', date: '2026-05-01', category: 'live', url: '/news/7' })];

    const [group] = buildLogTimeline(news, [], [], now);

    expect(group?.items[0]?.href).toBe('/news/7');
  });

  it('passes an external news url through as the href', () => {
    const news = [newsItem({ id: '7', date: '2026-05-01', category: 'live', url: 'https://example.com/x' })];

    const [group] = buildLogTimeline(news, [], [], now);

    expect(group?.items[0]?.href).toBe('https://example.com/x');
  });

  it('leaves a work entry without an href when the source has no url', () => {
    const works = [work({ id: '9', year: 2026 })];

    const [group] = buildLogTimeline([], works, [], now);

    expect(group?.items[0]?.href).toBeUndefined();
  });

  it('passes a work url through as the href', () => {
    const works = [work({ id: '9', year: 2026, url: 'https://example.com/w' })];

    const [group] = buildLogTimeline([], works, [], now);

    expect(group?.items[0]?.href).toBe('https://example.com/w');
  });

  it('does not mutate the input arrays', () => {
    const news = [newsItem({ id: '1', date: '2026-05-01', category: 'live' })];
    const works = [work({ id: '1', year: 2026 })];
    const newsSnapshot = [...news];
    const worksSnapshot = [...works];

    buildLogTimeline(news, works, [], now);

    expect(news).toEqual(newsSnapshot);
    expect(works).toEqual(worksSnapshot);
  });

  it('merges an external post into the correct year group', () => {
    const posts = [post({ id: 'zenn-1', date: '2026-02-15T00:00:00.000Z', source: 'zenn' })];

    const groups = buildLogTimeline([], [], posts, now);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.year).toBe(2026);
    expect(groups[0]?.items[0]?.id).toBe('post-zenn-1');
  });

  it('carries the feed source as meta and the article url as href', () => {
    const posts = [post({ id: 'sizu-9', date: '2026-02-15T00:00:00.000Z', source: 'sizu', link: 'https://sizu.me/x/posts/9' })];

    const [group] = buildLogTimeline([], [], posts, now);

    expect(group?.items[0]?.meta).toBe('sizu');
    expect(group?.items[0]?.href).toBe('https://sizu.me/x/posts/9');
  });

  it('formats a post date as MM.DD and never marks it upcoming', () => {
    const posts = [post({ id: '1', date: '2026-04-09T00:00:00.000Z', source: 'zenn' })];

    const [group] = buildLogTimeline([], [], posts, now);

    expect(group?.items[0]?.date).toBe('04.09');
    expect(group?.items[0]?.upcoming).toBe(false);
  });

  it('sorts posts and news together by date (desc) within a year', () => {
    const news = [newsItem({ id: 'n', date: '2026-03-10', category: 'release' })];
    const posts = [post({ id: 'early', date: '2026-01-05T00:00:00.000Z', source: 'zenn' }), post({ id: 'late', date: '2026-05-20T00:00:00.000Z', source: 'sizu' })];

    const [group] = buildLogTimeline(news, [], posts, now);

    expect(group?.items.map((entry) => entry.id)).toEqual(['post-late', 'news-n', 'post-early']);
  });
});

describe('buildLogTimeline manual entries', () => {
  it('merges manual log entries into the correct year, sorted by date desc', () => {
    const logs: LogManualItem[] = [{ id: '1', title: 'サイト公開', date: '2026-06-01', meta: 'milestone', url: 'https://napochaan.com' }];
    const groups = buildLogTimeline([], [], [], now, logs);
    const y2026 = groups.find((g) => g.year === 2026);
    expect(y2026).toBeDefined();
    const entry = y2026?.items.find((i) => i.id === 'log-1');
    expect(entry).toMatchObject({ title: 'サイト公開', date: '06.01', meta: 'milestone', upcoming: false, href: 'https://napochaan.com' });
  });

  it('keeps working when no manual entries are passed (default param)', () => {
    expect(() => buildLogTimeline([], [], [], now)).not.toThrow();
  });
});
