import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { FeedLink } from './index';

describe('FeedLink', () => {
  it('renders a link with the given href', async () => {
    render(<FeedLink href="/x/rss.xml" label="x の RSS フィード" />);
    await expect.element(page.getByRole('link', { name: 'x の RSS フィード' })).toHaveAttribute('href', '/x/rss.xml');
  });

  it('renders a link with the given aria-label', async () => {
    render(<FeedLink href="/x/rss.xml" label="x の RSS フィード" />);
    await expect.element(page.getByRole('link', { name: 'x の RSS フィード' })).toBeInTheDocument();
  });
});
