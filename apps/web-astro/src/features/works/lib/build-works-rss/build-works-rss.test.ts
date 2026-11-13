import { toRfc822 } from '@utils/rss/rfc822-date';
import { describe, expect, it } from 'vitest';

import { buildWorksRSS } from './index';

import type { WorkRow } from '../../work-row';

const dated: WorkRow = { id: '1', slug: 'a.b', no: '01', title: 'T & U', type: 'production', year: 2026, date: '2026-05-10', description: 'desc' };
const yearOnly: WorkRow = { id: '2', slug: 'old', no: '02', title: 'old', type: 'talk', year: 2024, url: '/news' };
const external: WorkRow = { id: '3', slug: 'ext', no: '03', title: 'ext', type: 'support', year: 2025, url: 'https://example.com/x' };

describe('buildWorksRSS', () => {
  it('links works to their permalink, relative overrides under the origin and external urls as-is', () => {
    const xml = buildWorksRSS([dated, yearOnly, external], 'https://napochaan.com');
    expect(xml).toContain('<title>napochaan — works</title>');
    expect(xml).toContain('<link>https://napochaan.com/works/a.b</link>');
    expect(xml).toContain('<link>https://napochaan.com/news</link>');
    expect(xml).toContain('<link>https://example.com/x</link>');
    expect(xml).toContain('https://napochaan.com/works/old</guid>');
    expect(xml).toContain('https://napochaan.com/works/rss.xml');
    expect(xml).toContain('T &amp; U');
  });

  it('falls back to Jan 1 of the year for a year-only work', () => {
    const xml = buildWorksRSS([yearOnly], 'https://napochaan.com');
    expect(xml).toContain(`<pubDate>${toRfc822('2024-01-01')}</pubDate>`);
  });

  it('builds an empty channel', () => {
    expect(buildWorksRSS([], 'https://napochaan.com')).not.toContain('<item>');
  });
});
