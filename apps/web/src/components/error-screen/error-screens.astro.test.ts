import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import NotFoundTwin from './not-found-screen.astro';
import ServerErrorTwin from './server-error-screen.astro';
import { NotFoundScreen, ServerErrorScreen } from './screens';

const islandsOf = (html: string) => [...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1]);

describe('not-found-screen.astro', () => {
  it('renders the same markup as NotFoundScreen, hydrating only the ScrambleText label', async () => {
    const html = await renderComponent(NotFoundTwin, { pathname: '/missing' });
    expect(stripIslands(html)).toBe(renderReactMarkup(NotFoundScreen, {}));
    expect(islandsOf(html)).toEqual(['ScrambleTextIsland']);
  });
});

describe('server-error-screen.astro', () => {
  it('renders the same markup as ServerErrorScreen, hydrating only the retry button and the label', async () => {
    const html = await renderComponent(ServerErrorTwin, { pathname: '/boom' });
    expect(stripIslands(html)).toBe(renderReactMarkup(ServerErrorScreen, {}));
    expect(islandsOf(html)).toEqual(['RetryButtonIsland', 'ScrambleTextIsland']);
  });
});
