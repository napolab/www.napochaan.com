import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { BlogIndex } from './index';

const posts = [{ id: '1', slug: 'shizuka-internet', index: '01', title: '静かなインターネットの話', readMin: 5, date: '2026.05.20', excerpt: '個人サイトを…', href: '/blog/1' }];

describe('BlogIndex', () => {
  it('renders posts with index, title and meta', async () => {
    await render(<BlogIndex posts={posts} />);
    await expect.element(page.getByRole('heading', { name: /blog/ })).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: /静かなインターネットの話/ })).toBeInTheDocument();
    await expect.element(page.getByText('5 min')).toBeInTheDocument();
  });
});
