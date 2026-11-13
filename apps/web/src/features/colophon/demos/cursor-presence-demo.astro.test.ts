import { describe, expect, it } from 'vitest';

import { canvas as cursorCanvas, element as wrapper } from '../../../components/cursor-presence/styles.css';
import { renderComponent } from '../../../test-utils/astro-container';
import { islandExportsOf, leafElementsOf, stripIslands } from '../../../test-utils/island-parity';
import Demo from './cursor-presence-demo.astro';
import { frame } from './cursor-presence-demo.css';

describe('cursor-presence-demo.astro', () => {
  // The markup the React CursorPresenceDemo island rendered: the cell + the cursor canvas.
  it('renders the sized cell around the cursor canvas', async () => {
    const html = await renderComponent(Demo);
    expect(stripIslands(html)).toBe(`<div class="${frame}"><canvas class="${cursorCanvas}" aria-hidden="true"></canvas></div>`);
  });

  it('drives it with the <cursor-presence-demo> element and hydrates nothing', async () => {
    const html = await renderComponent(Demo);
    expect(html).toMatch(new RegExp(`^<cursor-presence-demo class="${wrapper}">`));
    expect(leafElementsOf(html)).toEqual(['cursor-presence-demo']);
    expect(islandExportsOf(html)).toEqual([]);
  });
});
