import { describe, expect, it } from 'vitest';

import { renderComponent } from '../../test-utils/astro-container';
import { renderReactMarkup, stripIslands } from '../../test-utils/island-parity';
import Twin from './link-button.astro';
import { Button } from './index';

const cases = [
  { href: '/about', label: 'enter →' },
  { href: '/works', label: 'works', variant: 'outline' },
  { href: '/contact', label: 'contact →', variant: 'danger', size: 'sm' },
] as const;

describe('link-button.astro', () => {
  it.each(cases)('renders the same markup as the link variant of Button (%o)', async ({ label, ...props }) => {
    const html = await renderComponent(Twin, { props, slots: { default: label } });
    expect(stripIslands(html)).toBe(renderReactMarkup(Button, { type: 'link', ...props, children: label }));
  });

  it('emits no island', async () => {
    const html = await renderComponent(Twin, { props: { href: '/about' }, slots: { default: 'enter' } });
    expect(html).not.toContain('<astro-island');
  });
});
