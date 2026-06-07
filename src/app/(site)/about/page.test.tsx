import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import AboutPage from './page';

describe('AboutPage', () => {
  it('renders the breadcrumb navigation landmark', async () => {
    render(<AboutPage />);
    await expect.element(page.getByRole('navigation', { name: 'パンくず' })).toBeVisible();
  });

  it('links home and marks about as the current page', async () => {
    render(<AboutPage />);
    await expect.element(page.getByRole('link', { name: 'home' })).toHaveAttribute('href', '/');
    await expect.element(page.getByText('about')).toHaveAttribute('aria-current', 'page');
  });
});
