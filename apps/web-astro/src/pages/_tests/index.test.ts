import { describe, expect, it, vi } from 'vitest';

import HomePage from '../index.astro';
import { ORIGIN, renderPage } from './render-page';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/news', () => ({
  findLatestNews: vi.fn(async () => [
    { id: 'n1', slug: 'internal-news', date: '2026.06.01', category: 'event', title: 'internal news title' },
    { id: 'n2', slug: 'external-news', date: '2026.05.01', category: 'info', title: 'external news title', url: 'https://example.com/ext' },
  ]),
}));
vi.mock('@lib/cms/works', () => ({
  findWorksList: vi.fn(async () =>
    ['a', 'b', 'c', 'd'].map((slug, index) => ({ id: slug, slug: `work-${slug}`, no: `0${index + 1}`, title: `work title ${slug}`, type: 'flyer', year: 2024, date: '2024-03-15' })),
  ),
}));
vi.mock('@lib/cms/logs', () => ({ findLogList: vi.fn(async () => [{ id: 'l1', title: 'log entry title', date: '2025-01-10', meta: 'Tokyo' }]) }));
vi.mock('@lib/cms/gallery', () => ({ findGalleryList: vi.fn(async () => [{ id: 'g1', src: '/media/g1.jpg', width: 800, height: 600, alt: 'gallery photo one', caption: 'flyer' }]) }));
vi.mock('@lib/cms/blog', () => ({
  findBlogList: vi.fn(async () =>
    ['1', '2', '3', '4'].map((id) => ({ id, slug: `post-${id}`, index: `0${id}`, title: `post title ${id}`, readMin: 3, date: '2026-01-0' + id, excerpt: `excerpt ${id}` })),
  ),
}));
vi.mock('../../features/log/lib/fetch-external-posts', () => ({ fetchExternalPosts: vi.fn(async () => []) }));

const render = async (): Promise<string> => (await renderPage(HomePage, '/')).text();

describe('/ (home)', () => {
  it('uses the root default title and the home description', async () => {
    const html = await render();
    expect(html).toContain('<title>napochaan</title>');
    expect(html).toContain('<meta name="description" content="DJ・VJ・グラフィック・デジタル制作。napochaan の個人サイト。"');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788"');
  });

  it('renders one main#main-content with the visually hidden h1 as the only h1', async () => {
    const html = await render();
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<main id="main-content" class="[^"]+">\s*<h1 class="[^"]+">napochaan — DJ・VJ・グラフィック・デジタル<\/h1>/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it('renders every home section in Next order', async () => {
    const html = await render();
    const order = ['5470009', 'id="about"', 'internal news title', 'id="works"', 'id="log"', 'id="gallery"', 'id="blog"'].map((needle) => html.indexOf(needle));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('links news to the external url when set, else the detail page', async () => {
    const html = await render();
    expect(html).toContain('href="/news/internal-news"');
    expect(html).toContain('href="https://example.com/ext"');
  });

  it('teases the first three works and posts', async () => {
    const html = await render();
    // Works also feed the log timeline, so scope to the works table's rendered links.
    const works = html.slice(html.indexOf('id="works"'), html.indexOf('id="log"'));
    expect(works).toContain('href="/works/work-c"');
    expect(works).not.toContain('href="/works/work-d"');
    expect(html).toContain('href="/blog/post-3"');
    expect(html).not.toContain('href="/blog/post-4"');
  });

  it('hydrates the sections as islands (Next client leaves), never the main landmark itself', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(main.match(/<astro-island /g)?.length).toBe(7);
    expect(html).not.toMatch(/<astro-island [^>]*>\s*<main/);
  });
});
