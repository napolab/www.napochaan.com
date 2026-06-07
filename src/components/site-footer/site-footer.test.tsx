import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SiteFooter } from './index';

describe('SiteFooter', () => {
  it('renders a contentinfo footer with copyright', async () => {
    await render(<SiteFooter />);
    await expect.element(page.getByRole('contentinfo')).toBeInTheDocument();
    await expect.element(page.getByText(/napochaan/)).toBeInTheDocument();
  });

  it('links to the colophon', async () => {
    await render(<SiteFooter />);
    await expect.element(page.getByRole('link', { name: 'colophon' })).toHaveAttribute('href', '/colophon');
  });
});
