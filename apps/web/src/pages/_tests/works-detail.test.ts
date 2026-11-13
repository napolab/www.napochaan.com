import { describe, expect, it, vi } from 'vitest';

import { findWorkFixture, worksFeed } from './works-fixtures';
import NotFoundPage from '../404.astro';
import WorkDetailPage from '../works/[slug].astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf, mainLeafElementsOf } from '../../test-utils/island-parity';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/works', () => ({ findWorksList: vi.fn(async () => worksFeed), findWorkBySlug: vi.fn(findWorkFixture) }));

const render = async (slug: string): Promise<Response> => {
  vi.stubEnv('BASE_URL', 'https://napochaan.com');

  return renderPage(WorkDetailPage, `/works/${slug}`, { '/404': NotFoundPage }, { slug });
};

describe('/works/[slug]', () => {
  it('emits the detail metadata and the Next og:image path (type / size, twitter inherits)', async () => {
    const html = await (await render('a.b')).text();
    expect(html).toContain('<title>Dotted Work — napochaan</title>');
    expect(html).toContain('<meta name="description" content="a dotted work"');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/works/a.b"');
    expect(html).toContain('<link rel="alternate" type="text/markdown" href="http://localhost:8788/works/a.b.md" title="Dotted Work"');
    expect(html).toContain('<meta property="og:image" content="http://localhost:8788/works/a.b/opengraph-image-apsyht"');
    expect(html).toContain('<meta property="og:image:type" content="image/png"');
    expect(html).toContain('<meta name="twitter:image" content="http://localhost:8788/works/a.b/opengraph-image-apsyht"');
    expect(html).not.toContain('/og-default.png');
  });

  it('renders the header, the work body, related works, share bar and nav inside one main', async () => {
    const html = await (await render('a.b')).text();
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*data-tracking="tight"[^>]*>Dotted Work<\/h1>/);
    expect(html).toMatch(/<section class="[^"]+" aria-label="work detail">/);
    expect(html).toContain('production / 2026');
    expect(html).toContain('production · 2026');
    expect(html).toMatch(/<h2 id="first-section"/);
    expect(html).toMatch(/<hr class="[^"]+"/);
    expect(html).toContain('related / 関連');
    expect(html).toContain('href="/works/work-2"');
    expect(html).toMatch(/<nav [^>]*aria-label="works pagination"/);
    expect(html).toContain('href="/works/work-1"');
  });

  it('hydrates only client leaves (QuoteShare; ShareBar is the <share-bar> element); RelatedWorks and AdjacentNav are static', async () => {
    const html = await (await render('a.b')).text();
    const islands = mainIslandsOf(html);
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
    expect(islands).toContain('QuoteShareIsland');
    expect(mainLeafElementsOf(html).filter((tag) => tag === 'share-bar')).toHaveLength(1);
    expect(islands).not.toContain('RelatedWorksIsland');
    expect(islands).not.toContain('AdjacentNavIsland');
  });

  it('omits the related rail when no other work shares the type', async () => {
    const html = await (await render('work-52')).text();
    expect(html).toContain('support · 2025');
    expect(html).not.toContain('related / 関連');
    expect(html).not.toContain('aria-labelledby="related-heading"');
  });

  it('answers 404 with the not-found page for an unknown slug', async () => {
    const res = await render('x');
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('お探しのページは存在しないか');
  });
});
