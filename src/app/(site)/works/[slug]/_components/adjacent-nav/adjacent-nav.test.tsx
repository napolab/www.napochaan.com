import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { AdjacentNav } from './index';

const prev = { id: '1', title: 'prev work' };
const next = { id: '3', title: 'next work' };

describe('AdjacentNav', () => {
  it('renders a prev link to /works/{id}', async () => {
    await render(<AdjacentNav prev={prev} next={next} />);

    const link = page.getByRole('link', { name: /prev work/ });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute('href', '/works/1');
  });

  it('renders a next link to /works/{id}', async () => {
    await render(<AdjacentNav prev={prev} next={next} />);

    const link = page.getByRole('link', { name: /next work/ });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute('href', '/works/3');
  });

  it('renders no prev link at the first item', async () => {
    await render(<AdjacentNav next={next} />);

    await expect.element(page.getByRole('link', { name: /prev work/ })).not.toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: /next work/ })).toBeInTheDocument();
  });

  it('renders no next link at the last item', async () => {
    await render(<AdjacentNav prev={prev} />);

    await expect.element(page.getByRole('link', { name: /next work/ })).not.toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: /prev work/ })).toBeInTheDocument();
  });

  it('renders a back link to /works', async () => {
    await render(<AdjacentNav prev={prev} next={next} />);

    await expect.element(page.getByRole('link', { name: /works 一覧/ })).toHaveAttribute('href', '/works');
  });
});
