import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { islandExportsOf, leafElementsOf, renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './game-of-life.astro';
import { GameOfLife } from './index';

describe('game-of-life.astro', () => {
  // Hand-mirrored pair with the React GameOfLife (.claude/rules/cross-module-sync-test.md).
  it.each([{}, { engine: 'isolated' }])('renders the React GameOfLife canvas inside <game-of-life> (%o)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(GameOfLife, {}));
  });

  it('drives the canvas with the <game-of-life> element and hydrates nothing', async () => {
    const html = await renderComponent(Twin);
    expect(html).toMatch(/^<game-of-life class="[^"]+">/);
    expect(leafElementsOf(html)).toEqual(['game-of-life']);
    expect(islandExportsOf(html)).toEqual([]);
    expect(html).toMatch(/<script type="module"[^>]*>/);
  });

  it('asks for an isolated engine only when told to', async () => {
    expect(await renderComponent(Twin, { props: { engine: 'isolated' } })).toMatch(/^<game-of-life class="[^"]+" engine="isolated">/);
  });
});
