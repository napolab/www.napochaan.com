import { describe, expect, it, vi } from 'vitest';

import ColophonPage from '../colophon.astro';
import { colophon } from '../../features/colophon/content';
import { ORIGIN, renderPage } from './render-page';

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

  it('wraps every demo that carries an href in the no-action island', async () => {
    const html = await render();
    expect(html).toContain('href="/news/rss.xml"');
    const feedLinkCell = html.slice(html.indexOf('>FeedLink</h3>'), html.indexOf('>Calendar</h3>'));
    expect(feedLinkCell).toMatch(/<astro-island [^>]*component-export="NoAction"/);
  });

  it('loads the two gallery demos client-only, with the loading annotation as fallback', async () => {
    const html = await render();
    expect(html.match(/client="only"/g)).toHaveLength(2);
    // Astro writes the fallback once in place and once in its swap <template>.
    expect(html.match(/<template data-astro-template="fallback"><span slot="fallback"[^>]*>\s*loading gallery…/g)).toHaveLength(2);
  });
});
