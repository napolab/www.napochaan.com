import { describe, expect, it, vi } from 'vitest';

import { findNewsFixture, newsFeed } from './news-fixtures';
import NotFoundPage from '../404.astro';
import NewsDetailPage from '../news/[slug].astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf, mainLeafElementsOf } from '../../test-utils/island-parity';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/news', () => ({ findNewsList: vi.fn(async () => newsFeed), findNewsBySlug: vi.fn(findNewsFixture) }));

const render = async (slug: string): Promise<Response> => {
  vi.stubEnv('BASE_URL', 'https://napochaan.com');

  return renderPage(NewsDetailPage, `/news/${slug}`, { '/404': NotFoundPage }, { slug });
};

describe('/news/[slug]', () => {
  it('emits the detail metadata and the Next og:image path (type / size, twitter inherits)', async () => {
    const html = await (await render('a.b')).text();
    expect(html).toContain('<title>Dotted News — napochaan</title>');
    expect(html).toContain('<meta name="description" content="lead paragraph');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/news/a.b"');
    expect(html).toContain('<link rel="alternate" type="text/markdown" href="http://localhost:8788/news/a.b.md" title="Dotted News"');
    expect(html).toContain('<meta property="og:image" content="http://localhost:8788/news/a.b/opengraph-image-5nvrt4"');
    expect(html).toContain('<meta property="og:image:type" content="image/png"');
    expect(html).toContain('<meta property="og:image:width" content="1200"');
    expect(html).toContain('<meta name="twitter:image" content="http://localhost:8788/news/a.b/opengraph-image-5nvrt4"');
    expect(html).not.toContain('/og-default.png');
  });

  it('renders the header, body, share bar and nav inside one main with one h1', async () => {
    const html = await (await render('a.b')).text();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*data-tracking="tight"[^>]*>Dotted News<\/h1>/);
    expect(html).toContain('// 2026.04.10 · notification');
    expect(html).toMatch(/<h2 id="first-section"/);
    expect(html).toMatch(/<nav [^>]*aria-label="news pagination"/);
    // Neighbours are by date (newest first): a.b is the oldest, so prev is news-10.
    expect(html).toContain('href="/news/news-10"');
    expect(html).toContain('href="/news"');
  });

  // As in Next, the neighbours come from the unfiltered list: an external item is linked
  // as `/news/<slug>` although that page 404s.
  it('keeps an external neighbour in prev / next', async () => {
    const html = await (await render('news-20')).text();
    expect(html).toContain('href="/news/ext-item"');
  });

  it('hydrates only client leaves (QuoteShare wraps the body, ShareBar, scramble / copy-hash leaves)', async () => {
    const islands = mainIslandsOf(await (await render('a.b')).text());
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
    expect(islands).toContain('QuoteShareIsland');
    // ShareBar ships as the <share-bar> element, not an island.
    expect(mainLeafElementsOf(await (await render('a.b')).text()).filter((tag) => tag === 'share-bar')).toHaveLength(1);
  });

  it.each(['x', 'ext-item'])('answers 404 with the not-found page for %s (unknown / external)', async (slug) => {
    const res = await render(slug);
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('お探しのページは存在しないか');
  });
});
