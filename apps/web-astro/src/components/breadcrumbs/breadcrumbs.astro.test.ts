import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import BreadcrumbsAstro from './breadcrumbs.astro';
import { Breadcrumbs } from './index';

const items = [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: 'night vol.13' }];

describe('breadcrumbs.astro', () => {
  it('renders the same markup as the Breadcrumbs Server Component', async () => {
    const html = await renderComponent(BreadcrumbsAstro, { props: { items } });
    expect(stripIslands(html)).toBe(renderReactMarkup(Breadcrumbs, { items }));
  });

  it('hydrates only the ScrambleText leaves', async () => {
    const html = await renderComponent(BreadcrumbsAstro, { props: { items } });
    const islands = [...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1]);
    expect(islands).toEqual(['ScrambleTextIsland', 'ScrambleTextIsland']);
  });
});
