import { describe, expect, it, vi } from 'vitest';

import { worksFeed } from './works-fixtures';
import NotFoundPage from '../404.astro';
import WorksIndexPage from '../works/index.astro';
import WorksPagedPage from '../works/page/[num].astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf } from '../../test-utils/island-parity';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/works', () => ({ findWorksList: vi.fn(async () => worksFeed), findWorkBySlug: vi.fn() }));

const renderIndex = async (): Promise<string> => (await renderPage(WorksIndexPage, '/works')).text();

const renderPaged = async (num: string): Promise<Response> => renderPage(WorksPagedPage, `/works/page/${num}`, { '/404': NotFoundPage }, { num });

describe('/works', () => {
  it('titles the page and links its feed and markdown twin', async () => {
    const html = await renderIndex();
    expect(html).toContain('<title>works — napochaan</title>');
    expect(html).toContain('<meta name="description" content="制作物のアーカイブ — 開発・VRChat・映像・グラフィック。"');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/works"');
    expect(html).toContain('<link rel="alternate" type="application/rss+xml" href="http://localhost:8788/works/rss.xml" title="napochaan — works"');
    expect(html).toContain('<link rel="alternate" type="text/markdown" href="http://localhost:8788/works.md"');
  });

  it('renders one h1, the feed link and the first 50 works in a static archive', async () => {
    const html = await renderIndex();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('href="/works/rss.xml"');
    expect(html).toMatch(/<section [^>]*aria-label="works archive"/);
    expect(mainIslandsOf(html)).not.toContain('WorksArchiveIsland');
    expect(html).toMatch(/<h2 id="year-2026-heading"/);
    expect(html).toContain('href="/works/a.b"');
    expect(html).toContain('href="/works/work-49"');
    expect(html).not.toContain('href="/works/work-50"');
    expect(html).toContain('href="/works/page/2"');
  });

  it('never renders a work body into the archive', async () => {
    expect(await renderIndex()).not.toContain('lead paragraph');
  });

  it('hydrates only client leaves inside main', async () => {
    const islands = mainIslandsOf(await renderIndex());
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
  });
});

describe('/works/page/[num]', () => {
  it('renders page 2 with its own title and canonical', async () => {
    const res = await renderPaged('2');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<title>works — page 2 — napochaan</title>');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/works/page/2"');
    expect(html).toContain('href="/works/work-52"');
    expect(html).toContain('aria-current="page"');
  });

  it('redirects page 1 to /works with 308', async () => {
    const res = await renderPaged('1');
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('/works');
  });

  it.each(['abc', '01', '3'])('answers 404 for /works/page/%s', async (num) => {
    const res = await renderPaged(num);
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('お探しのページは存在しないか');
  });
});
