import { describe, expect, it } from 'vitest';

import { withAppProviders } from '../app-providers';
import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './footer-nav.astro';
import { FooterNav } from './footer-nav';

// The React FooterNav reads the path from PathnameProvider.
const FooterNavAt = withAppProviders(FooterNav);

describe('footer-nav.astro', () => {
  it.each(['/', '/blog/post', '/works', '/colophon'])('renders the same markup as the FooterNav component at %s', async (pathname) => {
    const html = await renderComponent(Twin, { pathname });
    expect(stripIslands(html)).toBe(renderReactMarkup(FooterNavAt, { pathname, props: {} }));
  });

  it('marks the active section from the request pathname', async () => {
    const html = await renderComponent(Twin, { pathname: '/blog/post' });
    expect(html).toMatch(/<a [^>]*href="\/blog"[^>]*data-active="true"|<a [^>]*data-active="true"[^>]*href="\/blog"/);
  });

  it('emits no island', async () => {
    expect(await renderComponent(Twin)).not.toContain('<astro-island');
  });
});
