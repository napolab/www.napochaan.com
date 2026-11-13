import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../../test-utils/astro-container';
import { renderReactMarkup, scrambleTextCountOf, stripIslands } from '../../../../test-utils/island-parity';
import Twin from './news-nav.astro';
import { NewsNav } from './index';

const prev = { id: '1', slug: 'newer-news', title: 'newer' };
const next = { id: '3', slug: 'older-news', title: 'older' };
const cases = [{ prev, next }, { next }, { prev }];

describe('news-nav.astro', () => {
  it.each(cases)('renders the same markup as the NewsNav Server Component (%#)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(NewsNav, props));
  });

  it('hydrates nothing; the ScrambleText labels are <scramble-text> elements', async () => {
    const html = await renderComponent(Twin, { props: { prev, next } });
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(3);
  });
});
