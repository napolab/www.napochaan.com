import { describe, expect, it, vi } from 'vitest';

import { newsFeed } from './news-fixtures';
import NotFoundPage from '../404.astro';
import NewsIndexPage from '../news/index.astro';
import NewsPagedPage from '../news/page/[num].astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf } from '../../test-utils/island-parity';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/news', () => ({ findNewsList: vi.fn(async () => newsFeed), findNewsBySlug: vi.fn() }));

const renderIndex = async (): Promise<string> => (await renderPage(NewsIndexPage, '/news')).text();

const renderPaged = async (num: string): Promise<Response> => renderPage(NewsPagedPage, `/news/page/${num}`, { '/404': NotFoundPage }, { num });

describe('/news', () => {
  it('titles the page and links its feed and markdown twin', async () => {
    const html = await renderIndex();
    expect(html).toContain('<title>news — napochaan</title>');
    expect(html).toContain('<meta name="description" content="お知らせ — 制作・出演・公開のアナウンス。"');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/news"');
    expect(html).toContain('<link rel="alternate" type="application/rss+xml" href="http://localhost:8788/news/rss.xml" title="napochaan — news"');
    expect(html).toContain('<link rel="alternate" type="text/markdown" href="http://localhost:8788/news.md"');
  });

  it('renders one h1 in main#main-content, the feed link and the first 10 items grouped by month', async () => {
    const html = await renderIndex();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('近況すぎ〜↑');
    expect(html).toContain('href="/news/rss.xml"');
    expect(html).toMatch(/<h2 id="news-2026-06" class="[^"]+">2026 \/ 06<\/h2>/);
    expect(html).toMatch(/<h2 id="news-2026-04" class="[^"]+">2026 \/ 04<\/h2>/);
    expect(html).toContain('href="/news/a.b"');
    expect(html).toContain('06.18');
    expect(html).toContain('href="/news/page/2"');
    expect(html).not.toContain('href="/news/news-12"');
  });

  it('links an external item off-site in a new tab, never to its detail page', async () => {
    const html = await renderIndex();
    expect(html).toContain('href="https://x.com/naporin24690/status/1" target="_blank" rel="noopener noreferrer"');
    expect(html).not.toContain('href="/news/ext-item"');
  });

  it('hydrates only client leaves inside main', async () => {
    const islands = mainIslandsOf(await renderIndex());
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
  });
});

describe('/news/page/[num]', () => {
  it('renders page 2 with its own title and canonical', async () => {
    const res = await renderPaged('2');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<title>news — page 2 — napochaan</title>');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/news/page/2"');
    expect(html).not.toContain('type="text/markdown"');
    expect(html).toContain('href="/news/news-10"');
    expect(html).toContain('aria-current="page"');
  });

  it('redirects page 1 to /news with 308', async () => {
    const res = await renderPaged('1');
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('/news');
  });

  it.each(['abc', '01', '3'])('answers 404 for /news/page/%s', async (num) => {
    const res = await renderPaged(num);
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('お探しのページは存在しないか');
  });
});
