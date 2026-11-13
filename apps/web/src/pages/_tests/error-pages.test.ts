import { describe, expect, it, vi } from 'vitest';

import NotFoundPage from '../404.astro';
import ServerErrorPage from '../500.astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { mainIslandsOf, mainLeafElementsOf, mainScrambleTextCountOf } from '../../test-utils/island-parity';

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));

describe('/404', () => {
  it('renders the 404 screen as the single h1, noindexed', async () => {
    const html = await (await renderPage(NotFoundPage, '/nope/missing')).text();
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>404<\/h1>/);
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
  });

  // The error screen itself is a server tree; the home link's label is a <scramble-text> element (no island).
  it('hydrates nothing inside main (the label is a <scramble-text> element)', async () => {
    const html = await (await renderPage(NotFoundPage, '/nope/missing')).text();
    expect(mainIslandsOf(html)).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(mainScrambleTextCountOf(html)).toBe(1);
  });
});

describe('/500', () => {
  it('renders the 500 screen as the single h1 with a retry button', async () => {
    const html = await (await renderPage(ServerErrorPage, '/boom')).text();
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>500<\/h1>/);
    expect(html).toMatch(/<button[^>]*>retry<\/button>/);
  });

  it('hydrates nothing inside main (the retry button is the <retry-button> element)', async () => {
    const html = await (await renderPage(ServerErrorPage, '/boom')).text();
    expect(mainIslandsOf(html)).toEqual([]);
    expect(mainLeafElementsOf(html).filter((tag) => tag !== 'scramble-text')).toEqual(['retry-button']);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(mainScrambleTextCountOf(html)).toBe(1);
  });
});
