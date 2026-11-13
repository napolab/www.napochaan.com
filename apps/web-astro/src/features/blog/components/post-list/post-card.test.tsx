import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { PostCard } from './post-card';

const post = { slug: 'first-post', index: '07', title: 'first post', readMin: 8, excerpt: 'an excerpt line' };

describe('PostCard', () => {
  it('links the card to /blog/{slug} under the title', async () => {
    await render(<PostCard post={post} formattedDate="2026.05.10" />);

    await expect.element(page.getByRole('link', { name: 'first post' })).toHaveAttribute('href', '/blog/first-post');
  });

  it('renders the read time, the given date, and the excerpt', async () => {
    await render(<PostCard post={post} formattedDate="2026.05.10" />);

    await expect.element(page.getByText('8 min')).toBeInTheDocument();
    await expect.element(page.getByText('2026.05.10')).toBeInTheDocument();
    await expect.element(page.getByText('an excerpt line')).toBeInTheDocument();
  });
});
