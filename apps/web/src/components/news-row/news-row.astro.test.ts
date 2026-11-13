import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, scrambleTextCountOf, stripIslands } from '../../test-utils/island-parity';
import Twin from './news-row.astro';
import { NewsRow } from './index';

const cases = [
  { date: '06.14', category: 'event', title: 'internal', href: '/news/1' },
  { date: '05.30', category: 'release', title: 'external', href: 'https://example.com' },
  { date: '05.02', category: 'info', title: 'plain' },
];

describe('news-row.astro', () => {
  it.each(cases)('renders the same markup as the NewsRow Server Component (%#)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(NewsRow, props));
  });

  it('hydrates nothing; the title is a <scramble-text> element', async () => {
    const [props] = cases;
    const html = await renderComponent(Twin, { props });
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(1);
  });
});
