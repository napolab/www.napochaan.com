import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../test-utils/astro-container';
import { islandExportsOf, leafElementsOf, renderReactMarkup, stripIslands } from '../../../test-utils/island-parity';
import Twin from './boot-console.astro';
import { BootConsole } from './index';

describe('boot-console.astro', () => {
  it('renders the same markup as the BootConsole Server Component, hydrating nothing (BootQuestion is the <boot-question> element)', async () => {
    const html = await renderComponent(Twin);
    expect(stripIslands(html)).toBe(renderReactMarkup(BootConsole, {}));
    expect(islandExportsOf(html)).toEqual([]);
    expect(leafElementsOf(html)).toEqual(['boot-question']);
  });
});
