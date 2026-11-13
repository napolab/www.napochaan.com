import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../../test-utils/island-parity';
import Twin from './boot-console.astro';
import { BootConsole } from './index';

describe('boot-console.astro', () => {
  it('renders the same markup as the BootConsole Server Component, hydrating only BootQuestion', async () => {
    const html = await renderComponent(Twin);
    expect(stripIslands(html)).toBe(renderReactMarkup(BootConsole, {}));
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual(['BootQuestionIsland']);
  });
});
