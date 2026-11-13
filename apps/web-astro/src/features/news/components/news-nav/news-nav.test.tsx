import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { NewsNav } from './index';

describe('NewsNav', () => {
  it('renders prev and next links with /news/{slug} hrefs', async () => {
    await render(<NewsNav prev={{ id: '1', slug: 'newer-news', title: 'newer' }} next={{ id: '3', slug: 'older-news', title: 'older' }} />);

    const prev = page.getByRole('link', { name: /newer/ });
    const next = page.getByRole('link', { name: /older/ });

    await expect.element(prev).toHaveAttribute('href', '/news/newer-news');
    await expect.element(next).toHaveAttribute('href', '/news/older-news');
  });

  it('renders a back link to /news', async () => {
    await render(<NewsNav prev={{ id: '1', slug: 'newer-news', title: 'newer' }} next={{ id: '3', slug: 'older-news', title: 'older' }} />);

    const back = page.getByRole('link', { name: /news 一覧/ });
    await expect.element(back).toHaveAttribute('href', '/news');
  });

  it('renders only the present side when a neighbour is absent', async () => {
    await render(<NewsNav next={{ id: '3', slug: 'older-news', title: 'older' }} />);

    await expect.element(page.getByRole('link', { name: /older/ })).toHaveAttribute('href', '/news/older-news');
  });
});
