import { describe, expect, it, vi } from 'vitest';

import { blogFeed } from './blog-fixtures';
import NotFoundPage from '../404.astro';
import BlogDetailPage from '../blog/[slug].astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf, mainLeafElementsOf } from '../../test-utils/island-parity';
import { jsonLDOf } from '../../test-utils/json-ld';

import type { Post } from '../../features/blog/post';

const findBlogList = vi.hoisted(() => vi.fn<() => Promise<readonly Post[]>>(async () => []));
const findBlogBySlug = vi.hoisted(() => vi.fn<(slug: string) => Promise<Post | undefined>>());

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/blog', () => ({ findBlogList, findBlogBySlug }));

const render = async (slug: string): Promise<Response> => {
  vi.stubEnv('BASE_URL', 'https://napochaan.com');
  findBlogList.mockResolvedValue(blogFeed);
  findBlogBySlug.mockImplementation(async (wanted) => blogFeed.find((post) => post.slug === wanted));

  return renderPage(BlogDetailPage, `/blog/${slug}`, { '/404': NotFoundPage }, { slug });
};

describe('/blog/[slug]', () => {
  it('emits the detail metadata and the Next og:image path (type / size, twitter inherits)', async () => {
    const html = await (await render('a.b')).text();
    expect(html).toContain('<title>Dotted Post — napochaan</title>');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/blog/a.b"');
    expect(html).toContain('<link rel="alternate" type="text/markdown" href="http://localhost:8788/blog/a.b.md" title="Dotted Post"');
    expect(html).toContain('<meta property="og:image" content="http://localhost:8788/blog/a.b/opengraph-image-fx5gi7"');
    expect(html).toContain('<meta property="og:image:type" content="image/png"');
    expect(html).toContain('<meta property="og:image:width" content="1200"');
    expect(html).toContain('<meta property="og:image:height" content="630"');
    expect(html).toContain('<meta name="twitter:image" content="http://localhost:8788/blog/a.b/opengraph-image-fx5gi7"');
    expect(html).not.toContain('/og-default.png');
  });

  it('renders the header, hero, TOC, body and nav inside one main with one h1', async () => {
    const html = await (await render('a.b')).text();
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*data-tracking="tight"[^>]*>Dotted Post<\/h1>/);
    expect(html).toContain('// 3 min · 2026.01.20');
    expect(html).toContain('blog / 2026.01.20');
    expect(html).toMatch(/<nav [^>]*aria-label="目次"/);
    expect(html).toContain('href="#first-section"');
    expect(html).toContain('href="#sub-section"');
    expect(html).toContain('data-toc-scope');
    expect(html).toMatch(/<h2 id="first-section"/);
    expect(html).toMatch(/<nav [^>]*aria-label="blog pagination"/);
    // a.b is the newest: no prev, next is the next-newest (post-11).
    expect(html).toContain('href="/blog/post-11"');
    expect(html).toContain('href="/blog"');
  });

  it('highlights the code block (shiki tokens, not an empty or [object Promise] block)', async () => {
    const html = await (await render('a.b')).text();
    expect(html).not.toContain('[object Promise]');
    expect(html).toMatch(/<pre class="[^"]+"><code>/);
    expect(html).toContain('color:var(--code-keyword)');
    expect(html).toContain('42');
  });

  it('keeps the TOC body headings as direct children of the rich-text container', async () => {
    const html = await (await render('a.b')).text();
    const body = html.slice(html.indexOf('data-toc-body'));
    expect(body).toMatch(/<astro-slot>\s*<div class="[^"]+">\s*<p/);
  });

  it('hydrates only client leaves (QuoteShare wraps the body, ShareBar, scramble / copy-hash leaves)', async () => {
    const islands = mainIslandsOf(await (await render('a.b')).text());
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
    expect(islands).toContain('QuoteShareIsland');
    // ShareBar and the heading copy-anchors ship as custom elements, not islands.
    const html = await (await render('a.b')).text();
    const elements = mainLeafElementsOf(html);
    expect(elements.filter((tag) => tag === 'share-bar')).toHaveLength(1);
    expect(elements.filter((tag) => tag === 'copy-hash-button')).toHaveLength(2);
  });

  it('answers 404 with the not-found page for an unknown slug', async () => {
    const res = await render('x');
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('お探しのページは存在しないか');
  });

  it('sends the markdown twin as a Link alternate, plus llms.txt and the sitemap', async () => {
    const response = await render('a.b');
    expect(response.headers.get('link')).toBe(
      '</blog/a.b.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"; type="application/xml"',
    );
  });

  it('describes the page as BlogPosting JSON-LD', async () => {
    const [node] = jsonLDOf(await (await render('a.b')).text());
    expect(node).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Dotted Post',
      datePublished: '2026-01-20',
      inLanguage: 'ja',
      url: 'http://localhost:8788/blog/a.b',
      image: 'http://localhost:8788/blog/a.b/opengraph-image-fx5gi7',
      author: { '@type': 'Person', name: 'napochaan', url: 'http://localhost:8788' },
    });
  });
});
