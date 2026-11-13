import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../../test-utils/astro-container';
import { renderReactMarkup, scrambleTextCountOf, stripIslands } from '../../../../test-utils/island-parity';
import Twin from './blog-nav.astro';
import { BlogNav } from './index';

const prev = { id: '1', slug: 'newer-post', title: 'newer' };
const next = { id: '3', slug: 'older-post', title: 'older' };
const cases = [{ prev, next }, { next }, { prev }];

describe('blog-nav.astro', () => {
  it.each(cases)('renders the same markup as the BlogNav Server Component (%#)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(BlogNav, props));
  });

  it('hydrates nothing; the ScrambleText labels are <scramble-text> elements', async () => {
    const html = await renderComponent(Twin, { props: { prev, next } });
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(3);
  });
});
