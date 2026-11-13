import { toRfc822 } from '@utils/rss/rfc822-date';
import { describe, expect, it } from 'vitest';

import { buildNewsRSS } from './index';

import type { NewsItem } from '../../news-item';

const internal: NewsItem = { id: '1', slug: 'a.b', date: '2026-06-10', category: 'notification', title: 'T & U' };
const external: NewsItem = { id: '2', slug: 'ext', date: '2026-09-18', category: 'vj', title: 'ext', url: 'https://x.com/status/1' };

describe('buildNewsRSS', () => {
  it('links internal items to their permalink and external items off-site', () => {
    const xml = buildNewsRSS([internal, external], 'https://napochaan.com');
    expect(xml).toContain('<title>napochaan — news</title>');
    expect(xml).toContain('<link>https://napochaan.com/news/a.b</link>');
    expect(xml).toContain('<link>https://x.com/status/1</link>');
    expect(xml).toContain('https://napochaan.com/news/ext</guid>');
    expect(xml).toContain('https://napochaan.com/news/rss.xml');
    expect(xml).toContain('T &amp; U');
  });

  // Next took the first (pinned) item's date, not the newest.
  it('stamps lastBuildDate from the first item', () => {
    const xml = buildNewsRSS([internal, external], 'https://napochaan.com');
    expect(xml).toContain(`<lastBuildDate>${toRfc822('2026-06-10')}</lastBuildDate>`);
  });

  it('builds an empty channel', () => {
    expect(buildNewsRSS([], 'https://napochaan.com')).not.toContain('<item>');
  });
});
