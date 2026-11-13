import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { islandExportsOf, leafElementsOf, renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './cursor-presence.astro';
import { CursorPresence } from './index';

const PERSIST = / data-astro-transition-persist="[^"]*"/g;

// The site's cursor layer: the React CursorPresence with no children (the coordinate
// surface is the layout's stage, outside the layer).
const CursorLayerOnly = () => createElement(CursorPresence, { children: null });

describe('cursor-presence.astro', () => {
  // Hand-mirrored pair with the React CursorPresence (.claude/rules/cross-module-sync-test.md).
  it('renders the React CursorPresence overlay inside <cursor-presence>', async () => {
    const html = await renderComponent(Twin);
    expect(stripIslands(html).replace(PERSIST, '')).toBe(renderReactMarkup(CursorLayerOnly, {}));
  });

  it('persists the <cursor-presence> element itself and hydrates nothing', async () => {
    const html = await renderComponent(Twin);
    expect(html).toMatch(/^<cursor-presence class="[^"]+" data-astro-transition-persist="cursor-presence">/);
    expect(leafElementsOf(html)).toEqual(['cursor-presence']);
    expect(islandExportsOf(html)).toEqual([]);
    expect(html).toMatch(/<script type="module"[^>]*>/);
  });
});
