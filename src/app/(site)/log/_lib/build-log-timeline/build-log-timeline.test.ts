import { describe, expect, it } from 'vitest';

import { buildLogTimeline } from './index';

import type { LogManualItem } from '../log-manual-item';
import type { ExternalPost } from '../external-feeds';
import type { WorkRow } from '../../../works/_lib/work-row';

const now = '2026-06-08T00:00:00.000Z';

const work = (overrides: Partial<WorkRow> & Pick<WorkRow, 'id' | 'year'>): WorkRow => ({
  no: '00',
  slug: `work-${overrides.id}`,
  title: `work ${overrides.id}`,
  type: 'graphic',
  ...overrides,
});

const post = (overrides: Partial<ExternalPost> & Pick<ExternalPost, 'id' | 'date' | 'source'>): ExternalPost => ({
  title: `post ${overrides.id}`,
  link: `https://example.com/${overrides.id}`,
  ...overrides,
});

describe('buildLogTimeline', () => {
  it('formats works date as an em dash when undated', () => {
    const works = [work({ id: '1', year: 2026 })];

    const [group] = buildLogTimeline(works, [], now);

    expect(group?.items[0]?.date).toBe('—');
  });

  it('sets upcoming false for all works', () => {
    const works = [work({ id: '1', year: 2026 })];

    const [group] = buildLogTimeline(works, [], now);

    expect(group?.items[0]?.upcoming).toBe(false);
  });

  it('links a work to its internal /works/{slug} page', () => {
    const works = [work({ id: '9', year: 2026, url: 'https://example.com/w' })];

    const [group] = buildLogTimeline(works, [], now);

    expect(group?.items[0]?.href).toBe('/works/work-9');
  });

  it('does not mutate the input arrays', () => {
    const works = [work({ id: '1', year: 2026 })];
    const posts = [post({ id: 'p', date: '2026-05-01T00:00:00.000Z', source: 'zenn' })];
    const worksSnapshot = [...works];
    const postsSnapshot = [...posts];

    buildLogTimeline(works, posts, now);

    expect(works).toEqual(worksSnapshot);
    expect(posts).toEqual(postsSnapshot);
  });

  it('merges an external post into the correct year group', () => {
    const posts = [post({ id: 'zenn-1', date: '2026-02-15T00:00:00.000Z', source: 'zenn' })];

    const groups = buildLogTimeline([], posts, now);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.year).toBe(2026);
    expect(groups[0]?.items[0]?.id).toBe('post-zenn-1');
  });

  it('carries the feed source as meta and the article url as href', () => {
    const posts = [post({ id: 'sizu-9', date: '2026-02-15T00:00:00.000Z', source: 'sizu', link: 'https://sizu.me/x/posts/9' })];

    const [group] = buildLogTimeline([], posts, now);

    expect(group?.items[0]?.meta).toBe('sizu');
    expect(group?.items[0]?.href).toBe('https://sizu.me/x/posts/9');
  });

  it('formats a post date as MM.DD (ddd) in JST and never marks it upcoming', () => {
    const posts = [post({ id: '1', date: '2026-04-09T00:00:00.000Z', source: 'zenn' })];

    const [group] = buildLogTimeline([], posts, now);

    expect(group?.items[0]?.date).toBe('04.09 (Thu)');
    expect(group?.items[0]?.upcoming).toBe(false);
  });

  it('orders years newest first and, within a year, dated posts (desc) before works', () => {
    const posts = [post({ id: 'early', date: '2026-01-05T00:00:00.000Z', source: 'zenn' }), post({ id: 'late', date: '2026-05-20T00:00:00.000Z', source: 'sizu' })];
    const works = [work({ id: 'w1', year: 2026 }), work({ id: 'w2', year: 2025 })];

    const groups = buildLogTimeline(works, posts, now);

    expect(groups.map((group) => group.year)).toEqual([2026, 2025]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['post-late', 'post-early', 'work-w1']);
    expect(groups[1]?.items.map((item) => item.id)).toEqual(['work-w2']);
  });
});

describe('buildLogTimeline work date precision', () => {
  it('shows MM.DD (ddd) for a work that has a date', () => {
    const works = [work({ id: 'dated', year: 2025, date: '2025-03-15' })];

    const [group] = buildLogTimeline(works, [], now);

    expect(group?.items[0]?.date).toBe('03.15 (Sat)');
  });

  it('shows em dash for a work without a date', () => {
    const works = [work({ id: 'undated', year: 2025 })];

    const [group] = buildLogTimeline(works, [], now);

    expect(group?.items[0]?.date).toBe('—');
  });

  it('sorts a dated work before an undated work within the same year', () => {
    const works = [work({ id: 'undated', year: 2025 }), work({ id: 'dated', year: 2025, date: '2025-06-01' })];

    const [group] = buildLogTimeline(works, [], now);
    const ids = group?.items.map((item) => item.id) ?? [];

    // dated work sorts first (has a non-empty sortDate)
    expect(ids.indexOf('work-dated')).toBeLessThan(ids.indexOf('work-undated'));
  });

  it('sorts two dated works in descending date order', () => {
    const works = [work({ id: 'early', year: 2025, date: '2025-01-10' }), work({ id: 'late', year: 2025, date: '2025-11-20' })];

    const [group] = buildLogTimeline(works, [], now);
    const ids = group?.items.map((item) => item.id) ?? [];

    expect(ids.indexOf('work-late')).toBeLessThan(ids.indexOf('work-early'));
  });
});

describe('buildLogTimeline manual entries', () => {
  it('merges manual log entries into the correct year, sorted by date desc', () => {
    const logs: LogManualItem[] = [{ id: '1', title: 'サイト公開', date: '2026-06-01', meta: 'milestone', url: 'https://napochaan.com' }];
    const groups = buildLogTimeline([], [], now, logs);
    const y2026 = groups.find((g) => g.year === 2026);
    expect(y2026).toBeDefined();
    const entry = y2026?.items.find((i) => i.id === 'log-1');
    expect(entry).toMatchObject({ title: 'サイト公開', date: '06.01 (Mon)', meta: 'milestone', upcoming: false, href: 'https://napochaan.com' });
  });

  it('keeps working when no manual entries are passed (default param)', () => {
    expect(() => buildLogTimeline([], [], now)).not.toThrow();
  });

  it('marks a future-dated gig as upcoming and a past one as not', () => {
    const logs: LogManualItem[] = [
      { id: 'future', title: 'VJ at fest', date: '2026-07-26', meta: 'VJ' },
      { id: 'past', title: 'DJ set', date: '2026-05-01', meta: 'DJ' },
    ];
    const items = buildLogTimeline([], [], now, logs).find((g) => g.year === 2026)?.items ?? [];

    expect(items.find((item) => item.id === 'log-future')?.upcoming).toBe(true);
    expect(items.find((item) => item.id === 'log-past')?.upcoming).toBe(false);
  });

  it('keeps a gig dated today upcoming until the day is over', () => {
    // now is 2026-06-08T00:00:00Z → 2026-06-08 09:00 Asia/Tokyo, so the event day is today.
    const logs: LogManualItem[] = [{ id: 'today', title: 'live today', date: '2026-06-08', meta: 'VJ' }];
    const items = buildLogTimeline([], [], now, logs).find((g) => g.year === 2026)?.items ?? [];

    expect(items.find((item) => item.id === 'log-today')?.upcoming).toBe(true);
  });
});
