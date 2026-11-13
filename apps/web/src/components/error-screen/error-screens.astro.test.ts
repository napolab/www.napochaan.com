import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { leafElementCountOf, renderReactMarkup, scrambleTextCountOf, stripIslands } from '../../test-utils/island-parity';
import NotFoundTwin from './not-found-screen.astro';
import ServerErrorTwin from './server-error-screen.astro';
import { NotFoundScreen, ServerErrorScreen } from './screens';

const islandsOf = (html: string) => [...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1]);

describe('not-found-screen.astro', () => {
  it('renders the same markup as NotFoundScreen, hydrating nothing (the label is a <scramble-text> element)', async () => {
    const html = await renderComponent(NotFoundTwin, { pathname: '/missing' });
    expect(stripIslands(html)).toBe(renderReactMarkup(NotFoundScreen, {}));
    expect(islandsOf(html)).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(1);
  });
});

describe('server-error-screen.astro', () => {
  it('renders the same markup as ServerErrorScreen, hydrating nothing (retry is a <retry-button> element)', async () => {
    const html = await renderComponent(ServerErrorTwin, { pathname: '/boom' });
    expect(stripIslands(html)).toBe(renderReactMarkup(ServerErrorScreen, {}));
    expect(islandsOf(html)).toEqual([]);
    expect(leafElementCountOf(html, 'retry-button')).toBe(1);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(1);
  });
});
