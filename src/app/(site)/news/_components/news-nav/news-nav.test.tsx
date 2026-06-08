import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { NewsNav } from './index';

describe('NewsNav', () => {
  it('renders prev and next links with /news/{id} hrefs', async () => {
    await render(<NewsNav prev={{ id: '1', title: 'newer' }} next={{ id: '3', title: 'older' }} />);

    const prev = page.getByRole('link', { name: /newer/ });
    const next = page.getByRole('link', { name: /older/ });

    await expect.element(prev).toHaveAttribute('href', '/news/1');
    await expect.element(next).toHaveAttribute('href', '/news/3');
  });

  it('renders a back link to /news', async () => {
    await render(<NewsNav prev={{ id: '1', title: 'newer' }} next={{ id: '3', title: 'older' }} />);

    const back = page.getByRole('link', { name: /news 一覧/ });
    await expect.element(back).toHaveAttribute('href', '/news');
  });

  it('renders only the present side when a neighbour is absent', async () => {
    await render(<NewsNav next={{ id: '3', title: 'older' }} />);

    await expect.element(page.getByRole('link', { name: /older/ })).toHaveAttribute('href', '/news/3');
  });
});
