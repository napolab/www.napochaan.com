import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, scrambleTextCountOf, stripIslands } from '../../test-utils/island-parity';
import { siteNavItems } from '@utils/nav-items';

import Twin from './site-footer.astro';
import { SiteFooter } from './index';

describe('site-footer.astro', () => {
  it.each([{}, { buildId: 'abc123' }])('renders the same markup as the SiteFooter Server Component (%o)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(SiteFooter, props));
  });

  it('hydrates nothing: FooterNav is static and every label is a <scramble-text> element', async () => {
    const html = await renderComponent(Twin);
    expect(html).not.toContain('<astro-island');
    // One per nav item plus the colophon / sitemap labels.
    expect(scrambleTextCountOf(html)).toBe(siteNavItems.length + 2);
  });

  it('is not persisted (it re-renders with each page)', async () => {
    expect(await renderComponent(Twin)).not.toContain('data-astro-transition-persist');
  });
});
