import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './divider.astro';
import { Divider } from './index';

const cases = [{}, { variant: 'dashed' }, { orientation: 'vertical' }, { orientation: 'vertical', variant: 'dashed', className: 'extra' }] as const;

describe('divider.astro', () => {
  it.each(cases)('renders the same markup as the Divider component (%o)', async (props) => {
    const html = await renderComponent(Twin, { props });
    expect(stripIslands(html)).toBe(renderReactMarkup(Divider, props));
  });

  it('emits no island and no script', async () => {
    const html = await renderComponent(Twin);
    expect(html).not.toContain('<astro-island');
    expect(html).not.toContain('<script');
  });
});
