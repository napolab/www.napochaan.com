import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, scrambleTextCountOf, stripIslands } from '../../test-utils/island-parity';
import Twin from './contact-list.astro';
import { ContactList } from './index';

const cases = [
  {
    items: [
      { label: 'GitHub', handle: 'naporin0624', href: 'https://github.com/naporin0624' },
      { label: 'Email', handle: 'contact@napochaan.com', href: 'mailto:contact@napochaan.com' },
    ],
  },
];

describe('contact-list.astro', () => {
  it.each(cases)('renders the same markup as the ContactList Server Component (%#)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(ContactList, props));
  });

  it('hydrates nothing; the labels are <scramble-text> elements', async () => {
    const [props] = cases;
    const html = await renderComponent(Twin, { props });
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual([]);
    // ScrambleText ships as the <scramble-text> element, not an island.
    expect(scrambleTextCountOf(html)).toBe(2);
  });
});
