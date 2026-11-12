import { describe, expect, it } from 'vitest';

import { collectLogDates } from './index';

import type { ExternalPost } from '../external-feeds';
import type { LogManualItem } from '../log-manual-item';
import type { WorkRow } from '../../../works/_lib/work-row';

const NOW = '2026-07-02T12:00:00+09:00';

const makeWork = (over: Partial<WorkRow>): WorkRow => ({
  id: 'w1',
  slug: 'sample-work',
  no: '001',
  title: 'work',
  type: 'web',
  year: 2026,
  ...over,
});

const makePost = (over: Partial<ExternalPost>): ExternalPost => ({
  id: 'p1',
  title: 'post',
  link: 'https://example.com/post',
  date: '2026-01-10T00:00:00+09:00',
  source: 'zenn',
  ...over,
});

const makeLog = (over: Partial<LogManualItem>): LogManualItem => ({
  id: 'l1',
  title: 'gig',
  date: '2026-07-15',
  meta: 'DJ',
  ...over,
});

describe('collectLogDates', () => {
  it('3 ソースを日付昇順の marks に集約する', () => {
    const result = collectLogDates([makeWork({ date: '2026-03-01' })], [makePost({ date: '2026-01-10T00:00:00+09:00' })], [makeLog({ date: '2026-07-15' })], NOW);
    expect(result.marks.map((m) => m.date)).toEqual(['2026-01-10', '2026-03-01', '2026-07-15']);
  });

  it('日付なしの work は除外する', () => {
    const result = collectLogDates([makeWork({ date: undefined })], [], [], NOW);
    expect(result.marks).toEqual([]);
  });

  it('同日の複数エントリは 1 mark に畳み、upcoming を優先する', () => {
    const result = collectLogDates([], [makePost({ date: '2026-07-15T09:00:00+09:00' })], [makeLog({ date: '2026-07-15' })], NOW);
    expect(result.marks).toEqual([{ date: '2026-07-15', upcoming: true }]);
  });

  it('manual log は当日いっぱいまで upcoming（前日は past）', () => {
    const result = collectLogDates([], [], [makeLog({ id: 'a', date: '2026-07-01' }), makeLog({ id: 'b', date: '2026-07-02' }), makeLog({ id: 'c', date: '2026-07-03' })], NOW);
    expect(result.marks).toEqual([
      { date: '2026-07-01', upcoming: false },
      { date: '2026-07-02', upcoming: true },
      { date: '2026-07-03', upcoming: true },
    ]);
  });

  it('post / work は未来日でも upcoming にならない', () => {
    const result = collectLogDates([makeWork({ date: '2026-12-01' })], [makePost({ date: '2026-12-24T00:00:00+09:00' })], [], NOW);
    expect(result.marks.every((m) => !m.upcoming)).toBe(true);
  });

  it('minDate は最古エントリの月初、maxDate は最新エントリの月末', () => {
    const result = collectLogDates([], [makePost({ date: '2026-01-10T00:00:00+09:00' })], [makeLog({ date: '2026-07-15' })], NOW);
    expect(result.minDate).toBe('2026-01-01');
    expect(result.maxDate).toBe('2026-07-31');
  });

  it('空入力なら marks は空で min/max は undefined', () => {
    const result = collectLogDates([], [], [], NOW);
    expect(result.marks).toEqual([]);
    expect(result.minDate).toBeUndefined();
    expect(result.maxDate).toBeUndefined();
  });
});
