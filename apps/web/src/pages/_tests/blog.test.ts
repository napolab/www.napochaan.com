import { describe, expect, it, vi } from 'vitest';

import { blogFeed } from './blog-fixtures';
import NotFoundPage from '../404.astro';
import BlogIndexPage from '../blog/index.astro';
import BlogPagedPage from '../blog/page/[num].astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf } from '../../test-utils/island-parity';

import type { Post } from '../../features/blog/post';

const findBlogList = vi.hoisted(() => vi.fn<() => Promise<readonly Post[]>>());

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/blog', () => ({ findBlogList, findBlogBySlug: vi.fn() }));

const renderIndex = async (): Promise<string> => {
  findBlogList.mockResolvedValue(blogFeed);

  return (await renderPage(BlogIndexPage, '/blog')).text();
};

const renderPaged = async (num: string): Promise<Response> => {
  findBlogList.mockResolvedValue(blogFeed);

  return renderPage(BlogPagedPage, `/blog/page/${num}`, { '/404': NotFoundPage }, { num });
};

describe('/blog', () => {
  it('titles the page and links its feed and markdown twin', async () => {
    const html = await renderIndex();
    expect(html).toContain('<title>blog — napochaan</title>');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/blog"');
    expect(html).toContain('<link rel="alternate" type="application/rss+xml" href="http://localhost:8788/blog/rss.xml" title="napochaan — blog"');
    expect(html).toContain('<link rel="alternate" type="text/markdown" href="http://localhost:8788/blog.md"');
  });

  it('renders one h1 in main#main-content, the feed link and the newest 10 posts', async () => {
    const html = await renderIndex();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('href="/blog/rss.xml"');
    expect(html.match(/component-export="PostCardIsland"/g)).toHaveLength(10);
    expect(html).toContain('href="/blog/a.b"');
    expect(html).toContain('2026.01.20');
    expect(html).toContain('href="/blog/page/2"');
  });

  it('hydrates only client leaves inside main', async () => {
    const islands = mainIslandsOf(await renderIndex());
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
  });
});

describe('/blog/page/[num]', () => {
  it('renders page 2 with its own title and canonical', async () => {
    const res = await renderPaged('2');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<title>blog — page 2 — napochaan</title>');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/blog/page/2"');
    expect(html.match(/component-export="PostCardIsland"/g)).toHaveLength(2);
    expect(html).toContain('aria-current="page"');
  });

  it('redirects page 1 to /blog with 308', async () => {
    const res = await renderPaged('1');
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('/blog');
  });

  it.each(['abc', '01', '3'])('answers 404 for /blog/page/%s', async (num) => {
    const res = await renderPaged(num);
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('お探しのページは存在しないか');
  });
});
