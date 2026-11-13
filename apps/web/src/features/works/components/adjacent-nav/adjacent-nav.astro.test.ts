import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../../test-utils/astro-container';
import { islandExportsOf, renderReactMarkup, stripIslands } from '../../../../test-utils/island-parity';
import Twin from './adjacent-nav.astro';
import { AdjacentNav } from './index';

const prev = { id: '1', slug: 'prev-work', title: 'prev work' };
const next = { id: '3', slug: 'next-work', title: 'next work' };
const cases = [{ prev, next }, { next }, { prev }, {}];

describe('adjacent-nav.astro', () => {
  it.each(cases)('renders the same markup as the AdjacentNav component (%#)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(AdjacentNav, props));
  });

  it('hydrates no island of its own (the prev / next titles scramble without React)', async () => {
    const html = await renderComponent(Twin, { props: { prev, next } });
    expect(islandExportsOf(html)).toEqual([]);
  });
});
