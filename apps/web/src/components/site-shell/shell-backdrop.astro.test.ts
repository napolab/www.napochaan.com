import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { islandExportsOf, leafElementsOf, renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './shell-backdrop.astro';
import { ShellBackdrop } from './index';

const PERSIST = / data-astro-transition-persist="[^"]*"/g;

describe('shell-backdrop.astro', () => {
  it('renders the same markup as the ShellBackdrop Server Component', async () => {
    const html = await renderComponent(Twin);
    expect(stripIslands(html).replace(PERSIST, '')).toBe(renderReactMarkup(ShellBackdrop, {}));
  });

  it('hydrates nothing; ScrollRangeSync, TypographyBand and GameOfLife are custom elements', async () => {
    const html = await renderComponent(Twin);
    expect(islandExportsOf(html)).toEqual([]);
    expect(leafElementsOf(html)).toEqual(['scroll-range-sync', 'typography-band', 'game-of-life']);
  });

  it('persists each backdrop piece once, without a wrapper element', async () => {
    const html = await renderComponent(Twin);
    expect([...html.matchAll(/data-astro-transition-persist="([^"]+)"/g)].map((match) => match[1])).toEqual(['safe-area-tint', 'typography-band', 'life-frame']);
  });

  // The shared engine (the SysBar's gen count), never the colophon demo's isolated one.
  it('drives the persisted life frame with the shared-engine <game-of-life> element', async () => {
    const html = await renderComponent(Twin);
    expect(html).toMatch(/<div data-astro-transition-persist="life-frame" class="[^"]+"><game-of-life class="[^"]+"><canvas /);
  });
});
