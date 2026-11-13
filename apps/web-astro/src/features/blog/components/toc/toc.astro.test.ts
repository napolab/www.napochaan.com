import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../../../test-utils/island-parity';
import { Toc } from './index';
import Twin from './toc.astro';

const headings = [
  { level: 2, text: 'First', slug: 'first' },
  { level: 3, text: 'Sub', slug: 'sub' },
];

describe('toc.astro', () => {
  it('renders the same markup as the Toc Server Component', async () => {
    const html = await renderComponent(Twin, { props: { headings } });
    expect(stripIslands(html)).toBe(renderReactMarkup(Toc, { headings }));
  });

  it('keeps each link the direct child of its list item (reading-progress selector)', async () => {
    const html = await renderComponent(Twin, { props: { headings } });
    // A fragment render inlines Astro's island bootstrap in the first item; on a page the
    // layout's earlier islands carry it.
    expect(stripIslands(html).match(/<li [^>]*><a /g)).toHaveLength(2);
  });

  it('hydrates only the ScrambleText leaves', async () => {
    const html = await renderComponent(Twin, { props: { headings } });
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual(['ScrambleTextIsland', 'ScrambleTextIsland']);
  });

  it('renders nothing without headings', async () => {
    expect((await renderComponent(Twin, { props: { headings: [] } })).trim()).toBe('');
  });
});
