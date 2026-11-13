import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './back-to-index.astro';
import { BackToIndex } from './index';

const cases = [{ href: '/blog', label: 'blog 一覧へもどる' }];

describe('back-to-index.astro', () => {
  it.each(cases)('renders the same markup as the BackToIndex Server Component (%#)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(BackToIndex, props));
  });

  it('hydrates only its client leaves', async () => {
    const [props] = cases;
    const html = await renderComponent(Twin, { props });
    expect([...html.matchAll(/component-export="([^"]+)"/g)].map((match) => match[1])).toEqual(['ScrambleTextIsland']);
  });
});
