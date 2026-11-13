import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './site-footer.astro';
import { SiteFooter } from './index';

describe('site-footer.astro', () => {
  it.each([{}, { buildId: 'abc123' }])('renders the same markup as the SiteFooter Server Component (%o)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(SiteFooter, props));
  });

  it('hydrates only the FooterNav and ScrambleText leaves, on visibility', async () => {
    const html = await renderComponent(Twin);
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual(['FooterNavIsland', 'ScrambleTextIsland', 'ScrambleTextIsland']);
    expect([...html.matchAll(/<astro-island [^>]*client="([^"]+)"/g)].map((match) => match[1])).toEqual(['visible', 'visible', 'visible']);
  });

  it('is not persisted (it re-renders with each page)', async () => {
    expect(await renderComponent(Twin)).not.toContain('data-astro-transition-persist');
  });
});
