import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import NotFound from './not-found';

describe('not-found page', () => {
  it('renders the 404 code as the page h1', async () => {
    await render(<NotFound />);
    await expect.element(page.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument();
  });

  it('renders a home link pointing to root', async () => {
    await render(<NotFound />);
    await expect.element(page.getByRole('link', { name: '← / へ戻る' })).toHaveAttribute('href', '/');
  });
});
