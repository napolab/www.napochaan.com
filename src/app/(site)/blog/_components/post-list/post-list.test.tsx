import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { PostList } from './index';

const posts = [
  { id: '7', slug: 'first-post', index: '07', title: 'first post', readMin: 8, date: '2026-05-10', excerpt: 'an excerpt line' },
  { id: '8', slug: 'second-post', index: '08', title: 'second post', readMin: 3, date: '2026-04-01', excerpt: 'another excerpt' },
];

describe('PostList', () => {
  it('links each title to /blog/{slug}', async () => {
    await render(<PostList posts={posts} />);

    await expect.element(page.getByRole('link', { name: 'first post' })).toHaveAttribute('href', '/blog/first-post');
    await expect.element(page.getByRole('link', { name: 'second post' })).toHaveAttribute('href', '/blog/second-post');
  });

  it('renders the read time, formatted date, and excerpt', async () => {
    await render(<PostList posts={posts} />);

    await expect.element(page.getByText('8 min')).toBeInTheDocument();
    await expect.element(page.getByText('2026.05.10')).toBeInTheDocument();
    await expect.element(page.getByText('an excerpt line')).toBeInTheDocument();
  });
});
