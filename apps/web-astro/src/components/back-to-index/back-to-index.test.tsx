import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { BackToIndex } from './index';

describe('BackToIndex', () => {
  it('renders a link to the given href, named by its label', async () => {
    render(<BackToIndex href="/blog" label="blog 一覧へもどる" />);
    await expect.element(page.getByRole('link', { name: 'blog 一覧へもどる' })).toHaveAttribute('href', '/blog');
  });

  it('shows the decorative arrow without leaking it into the accessible name', async () => {
    render(<BackToIndex href="/works" label="works 一覧へもどる" />);
    // The arrow glyph is aria-hidden, so the accessible name is the label alone…
    const link = page.getByRole('link', { name: 'works 一覧へもどる' });
    await expect.element(link).toBeInTheDocument();
    // …but the glyph is still painted in the DOM.
    expect(link.element().textContent).toContain('←');
  });
});
