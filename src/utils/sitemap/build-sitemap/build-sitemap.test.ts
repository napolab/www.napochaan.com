import { describe, expect, it } from 'vitest';

import { buildSitemap } from './index';

import type { Post } from '../../../app/(site)/blog/_lib/post';
import type { NewsItem } from '../../../app/(site)/news/_lib/news-item';
import type { WorkRow } from '../../../app/(site)/works/_lib/work-row';

const baseUrl = 'https://www.napochaan.com';

const news: readonly NewsItem[] = [{ id: 'n1', slug: 'news-one', date: '2026-06-01', category: 'release', title: 'News One' }];
const blog: readonly Post[] = [{ id: 'b1', slug: 'blog-one', index: '01', title: 'Blog One', readMin: 3, date: '2026-05-01', excerpt: 'x' }];
const works: readonly WorkRow[] = [
  { id: 'w1', slug: 'work-one', no: '01', title: 'Work One', type: 'DJ', year: 2026, date: '2026-04-01' },
  { id: 'w2', slug: 'work-two', no: '02', title: 'Work Two', type: 'VJ', year: 2025 },
];

describe('buildSitemap', () => {
  it('includes the home url with the highest priority', () => {
    const entries = buildSitemap({ baseUrl, news, blog, works });
    const home = entries.find((entry) => entry.url === baseUrl);
    expect(home).toBeDefined();
    expect(home?.priority).toBe(1);
  });

  it('includes all the static content pages', () => {
    const entries = buildSitemap({ baseUrl, news, blog, works });
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${baseUrl}/about`);
    expect(urls).toContain(`${baseUrl}/works`);
    expect(urls).toContain(`${baseUrl}/news`);
    expect(urls).toContain(`${baseUrl}/blog`);
    expect(urls).toContain(`${baseUrl}/log`);
    expect(urls).toContain(`${baseUrl}/gallery`);
    expect(urls).toContain(`${baseUrl}/contact`);
    expect(urls).toContain(`${baseUrl}/colophon`);
  });

  it('includes dynamic detail pages for news, blog, and works', () => {
    const entries = buildSitemap({ baseUrl, news, blog, works });
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${baseUrl}/news/news-one`);
    expect(urls).toContain(`${baseUrl}/blog/blog-one`);
    expect(urls).toContain(`${baseUrl}/works/work-one`);
    expect(urls).toContain(`${baseUrl}/works/work-two`);
  });

  it('excludes external-link news (items with a url) from detail entries', () => {
    const newsWithExternal: readonly NewsItem[] = [
      { id: 'n1', slug: 'news-one', date: '2026-06-01', category: 'release', title: 'News One' },
      { id: 'n2', slug: 'news-ext', date: '2026-06-02', category: 'release', title: 'News Ext', url: 'https://example.com' },
    ];
    const urls = buildSitemap({ baseUrl, news: newsWithExternal, blog, works }).map((entry) => entry.url);
    expect(urls).toContain(`${baseUrl}/news/news-one`);
    expect(urls).not.toContain(`${baseUrl}/news/news-ext`);
  });

  it('never emits preview, admin, or api urls', () => {
    const entries = buildSitemap({ baseUrl, news, blog, works });
    const urls = entries.map((entry) => entry.url);
    for (const url of urls) {
      expect(url).not.toContain('/preview');
      expect(url).not.toContain('/admin');
      expect(url).not.toContain('/api');
      expect(url).not.toContain('rss.xml');
    }
  });

  it('sets lastModified from the item date', () => {
    const entries = buildSitemap({ baseUrl, news, blog, works });
    const detail = entries.find((entry) => entry.url === `${baseUrl}/news/news-one`);
    expect(detail?.lastModified).toBe('2026-06-01');
  });

  it('omits lastModified for a work without a date', () => {
    const entries = buildSitemap({ baseUrl, news, blog, works });
    const detail = entries.find((entry) => entry.url === `${baseUrl}/works/work-two`);
    expect(detail?.lastModified).toBeUndefined();
  });

  it('emits only the static pages when data is empty', () => {
    const entries = buildSitemap({ baseUrl, news: [], blog: [], works: [] });
    expect(entries).toHaveLength(9);
    expect(entries.map((entry) => entry.url)).toContain(baseUrl);
  });
});
