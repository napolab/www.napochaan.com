import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { BlogNav } from './index';

describe('BlogNav', () => {
  it('renders prev and next links with /blog/{slug} hrefs', async () => {
    await render(<BlogNav prev={{ id: '1', slug: 'newer-post', title: 'newer' }} next={{ id: '3', slug: 'older-post', title: 'older' }} />);

    await expect.element(page.getByRole('link', { name: /newer/ })).toHaveAttribute('href', '/blog/newer-post');
    await expect.element(page.getByRole('link', { name: /older/ })).toHaveAttribute('href', '/blog/older-post');
  });

  it('renders a back link to /blog', async () => {
    await render(<BlogNav prev={{ id: '1', slug: 'newer-post', title: 'newer' }} next={{ id: '3', slug: 'older-post', title: 'older' }} />);

    await expect.element(page.getByRole('link', { name: /blog 一覧/ })).toHaveAttribute('href', '/blog');
  });

  it('renders only the present side when a neighbour is absent', async () => {
    await render(<BlogNav next={{ id: '3', slug: 'older-post', title: 'older' }} />);

    await expect.element(page.getByRole('link', { name: /older/ })).toHaveAttribute('href', '/blog/older-post');
  });
});
