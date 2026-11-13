import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { islandExportsOf, renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './typography-band.astro';
import { TypographyBand } from './index';

const PERSIST = / data-astro-transition-persist="[^"]*"/g;

describe('typography-band.astro', () => {
  // Hand-mirrored pair with the React TypographyBand (.claude/rules/cross-module-sync-test.md).
  it.each([{}, { text: 'NAPOCHAAN · DJ × VJ · ' }])('renders the React TypographyBand markup (%o)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html).replace(PERSIST, '')).toBe(renderReactMarkup(TypographyBand, props));
  });

  it('persists the <typography-band> element itself and hydrates nothing', async () => {
    const html = await renderComponent(Twin);
    expect(html).toMatch(/^<typography-band class="[^"]+" data-astro-transition-persist="typography-band">/);
    expect(islandExportsOf(html)).toEqual([]);
    expect(html).toMatch(/<script type="module"[^>]*>/);
  });
});
