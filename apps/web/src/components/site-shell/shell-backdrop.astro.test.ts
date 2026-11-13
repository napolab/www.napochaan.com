import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './shell-backdrop.astro';
import { ShellBackdrop } from './index';

const PERSIST = / data-astro-transition-persist="[^"]*"/g;

describe('shell-backdrop.astro', () => {
  it('renders the same markup as the ShellBackdrop Server Component', async () => {
    const html = await renderComponent(Twin);
    expect(stripIslands(html).replace(PERSIST, '')).toBe(renderReactMarkup(ShellBackdrop, {}));
  });

  it('hydrates only the client leaves', async () => {
    const html = await renderComponent(Twin);
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual(['ScrollRangeSyncIsland', 'TypographyBandIsland', 'GameOfLifeIsland']);
  });

  it('persists each backdrop piece once, without a wrapper element', async () => {
    const html = await renderComponent(Twin);
    expect([...html.matchAll(/data-astro-transition-persist="([^"]+)"/g)].map((match) => match[1])).toEqual(['safe-area-tint', 'typography-band', 'life-frame']);
  });
});
