import { describe, expect, it, vi } from 'vitest';

import NotFoundPage from '../404.astro';
import ServerErrorPage from '../500.astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { mainIslandsOf } from '../../test-utils/island-parity';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));

describe('/404', () => {
  it('renders the 404 screen as the single h1, noindexed', async () => {
    const html = await (await renderPage(NotFoundPage, '/nope/missing')).text();
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>404<\/h1>/);
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
  });

  // The error screen itself is a server tree; only the home link's label hydrates.
  it('hydrates only the ScrambleText leaf inside main', async () => {
    const html = await (await renderPage(NotFoundPage, '/nope/missing')).text();
    expect(mainIslandsOf(html)).toEqual(['ScrambleTextIsland']);
  });
});

describe('/500', () => {
  it('renders the 500 screen as the single h1 with a retry button', async () => {
    const html = await (await renderPage(ServerErrorPage, '/boom')).text();
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>500<\/h1>/);
    expect(html).toMatch(/<button[^>]*>retry<\/button>/);
  });

  it('hydrates only the retry button and the ScrambleText leaf inside main', async () => {
    const html = await (await renderPage(ServerErrorPage, '/boom')).text();
    expect(mainIslandsOf(html)).toEqual(['RetryButtonIsland', 'ScrambleTextIsland']);
  });
});
