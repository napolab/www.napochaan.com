import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './safe-area-tint.astro';
import { SafeAreaTint } from './index';

const PERSIST = / data-astro-transition-persist="[^"]*"/g;

describe('safe-area-tint.astro', () => {
  it('renders the same markup as the SafeAreaTint Server Component, hydrating only ScrollRangeSync', async () => {
    const html = await renderComponent(Twin);
    expect(stripIslands(html).replace(PERSIST, '')).toBe(renderReactMarkup(SafeAreaTint, {}));
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual(['ScrollRangeSyncIsland']);
  });

  it('persists the tint root across navigations', async () => {
    const html = await renderComponent(Twin);
    expect(html).toMatch(/^<div [^>]*data-astro-transition-persist="safe-area-tint"/);
  });
});
