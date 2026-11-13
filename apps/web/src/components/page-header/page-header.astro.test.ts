import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './page-header.astro';
import { PageHeader } from './index';

const cases = [
  {
    title: 'colophon',
    breadcrumbs: [{ href: '/', label: 'home' }, { label: 'colophon' }],
    kicker: '// How to build',
    lead: 'Are you really seeing me?',
    leadReveal: 'scramble' as const,
    annotation: 'この世界だけに閉じている',
  },
  { title: 'news', breadcrumbs: [{ href: '/', label: 'home' }, { label: 'news' }], lead: 'お知らせ', titleTracking: 'tight' as const },
];

describe('page-header.astro', () => {
  it.each(cases)('renders the same markup as the PageHeader Server Component (%#)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(PageHeader, props));
  });

  it('hydrates only its client leaves', async () => {
    const [props] = cases;
    const html = await renderComponent(Twin, { props });
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual(['ScrambleTextIsland', 'ScrambleTextIsland']);
  });
});
