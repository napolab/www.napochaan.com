import { toRfc822 } from '@utils/rss/rfc822-date';
import { describe, expect, it } from 'vitest';

import { buildLogRSS } from './index';

import type { LogYearGroup } from '../build-log-timeline';

const ORIGIN = 'https://napochaan.com';

const groups: readonly LogYearGroup[] = [
  {
    year: 2026,
    items: [
      { id: 'log-1', year: 2026, date: '07.04', meta: 'gig', title: 'night & day', upcoming: true },
      { id: 'work-1', year: 2026, date: '03.01', meta: 'software', title: 'VJ tools', upcoming: false, href: '/works/vj-tools' },
    ],
  },
  {
    year: 2025,
    items: [{ id: 'post-1', year: 2025, date: '—', meta: 'zenn', title: 'article', upcoming: false, href: 'https://zenn.dev/x' }],
  },
];

describe('buildLogRSS', () => {
  it('describes the log channel', () => {
    const xml = buildLogRSS([], ORIGIN);
    expect(xml).toContain('<title>napochaan — log</title>');
    expect(xml).toContain('<link>https://napochaan.com/log</link>');
    expect(xml).toContain('napochaan の活動年表 — gig・release・work・milestone。');
    expect(xml).toContain('https://napochaan.com/log/rss.xml');
    expect(xml).not.toContain('<item>');
  });

  it('links an entry to the log, its absolutized internal page, or its external url', () => {
    const xml = buildLogRSS(groups, ORIGIN);
    expect(xml).toContain('<link>https://napochaan.com/log</link>');
    expect(xml).toContain('<link>https://napochaan.com/works/vj-tools</link>');
    expect(xml).toContain('<link>https://zenn.dev/x</link>');
    expect(xml).toContain('https://napochaan.com/log#log-1</guid>');
    expect(xml).toContain('night &amp; day');
    expect(xml).toContain('<category>software</category>');
  });

  it('rebuilds pubDate from the year and display date, Jan 1 when the day is unknown', () => {
    const xml = buildLogRSS(groups, ORIGIN);
    expect(xml).toContain(`<pubDate>${toRfc822('2026-03-01')}</pubDate>`);
    expect(xml).toContain(`<pubDate>${toRfc822('2025-01-01')}</pubDate>`);
  });

  it('stamps lastBuildDate from the first entry', () => {
    expect(buildLogRSS(groups, ORIGIN)).toContain(`<lastBuildDate>${toRfc822('2026-07-04')}</lastBuildDate>`);
  });
});
