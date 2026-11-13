import { describe, expect, it, vi } from 'vitest';

import ColophonPage from '../colophon.astro';
import { colophon } from '../../features/colophon/content';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf } from '../../test-utils/island-parity';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));

const render = async (): Promise<string> => (await renderPage(ColophonPage, '/colophon')).text();

describe('/colophon', () => {
  it('titles the page from the colophon content', async () => {
    const html = await render();
    expect(html).toContain('<title>colophon — napochaan</title>');
    expect(html).toContain('<meta name="description" content="Are you really seeing me?"');
    expect(html).toContain('<link rel="canonical" href="http://localhost:8788/colophon"');
  });

  it('renders the page header h1 as the only h1 inside main#main-content', async () => {
    const html = await render();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it('renders a catalog cell (h3) for every component in the content', async () => {
    const html = await render();
    for (const item of colophon.components.items) {
      expect(html).toContain(`>${item.name}</h3>`);
    }
  });

  it('renders the four numbered sections', async () => {
    const html = await render();
    for (const heading of ['concept', 'ui', 'stack', 'source']) {
      expect(html).toMatch(new RegExp(`<h2[^>]*>${heading}</h2>`));
    }
  });

  // Every demo that carries an href sits inside the <NoAction> island (colophon rule).
  const NO_ACTION_DEMOS = ['RichText', 'NewsRow', 'Link', 'Pagination', 'Breadcrumbs', 'FeedLink', 'ShareBar', 'BackToIndex', 'QuoteShare'];

  // The stage markup of one catalog cell.
  const stageOf = (html: string, name: string): string => {
    const start = html.indexOf(`>${name}</h3>`);
    return html.slice(start, html.indexOf('</article>', start));
  };

  it.each(NO_ACTION_DEMOS)('wraps the %s demo in the no-action island', async (name) => {
    const html = await render();
    expect(stageOf(html, name)).toMatch(/<div class="[^"]+"><astro-island [^>]*component-export="NoAction"/);
  });

  it('renders a non-empty stage for every catalog demo', async () => {
    const html = await render();
    for (const item of colophon.components.items) {
      expect(stageOf(html, item.name), item.name).toMatch(/<div class="[^"]*ov_clip[^"]*">\s*<[a-z]/);
    }
  });

  it('hydrates only client leaves inside main', async () => {
    const html = await render();
    expect(mainIslandsOf(html).filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
  });

  it('loads the two gallery demos client-only, with the loading annotation as fallback', async () => {
    const html = await render();
    expect(html.match(/client="only"/g)).toHaveLength(2);
    // Astro writes the fallback once in place and once in its swap <template>.
    expect(html.match(/<template data-astro-template="fallback"><span slot="fallback"[^>]*>\s*loading gallery…/g)).toHaveLength(2);
  });
});
