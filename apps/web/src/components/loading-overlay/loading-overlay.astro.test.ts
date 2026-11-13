import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { islandExportsOf, leafElementsOf, renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './loading-overlay.astro';
import { LoadingOverlay } from './index';

const PERSIST = / data-astro-transition-persist="[^"]*"/g;

describe('loading-overlay.astro', () => {
  it('renders the same markup as the LoadingOverlay Server Component, hydrating nothing (BootQuestion is the <boot-question> element)', async () => {
    const html = await renderComponent(Twin);
    expect(stripIslands(html).replace(PERSIST, '')).toBe(renderReactMarkup(LoadingOverlay, {}));
    expect(islandExportsOf(html)).toEqual([]);
    expect(leafElementsOf(html)).toEqual(['boot-question']);
  });

  it('persists the overlay root across navigations (the boot sequence never replays)', async () => {
    const html = await renderComponent(Twin);
    expect(html).toMatch(/^<div [^>]*data-astro-transition-persist="boot-overlay"/);
  });
});
