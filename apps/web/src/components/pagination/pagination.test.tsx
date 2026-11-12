import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Pagination } from './index';

// Default consumer: page 1 → bare path, deeper pages → ?page=N.
const href = (target: number): string => (target <= 1 ? '/works' : `/works?page=${target}`);

// An alternative consumer proving the href shape is fully injected.
const blogHref = (target: number): string => `/blog?p=${target}`;

describe('Pagination', () => {
  it('renders a navigation landmark', async () => {
    render(<Pagination currentPage={1} totalPages={5} href={href} />);
    await expect.element(page.getByRole('navigation', { name: 'ページネーション' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current', async () => {
    render(<Pagination currentPage={3} totalPages={5} href={href} />);
    await expect.element(page.getByRole('link', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  it('disables prev on the first page and keeps next as a link', async () => {
    render(<Pagination currentPage={1} totalPages={5} href={href} />);
    const prev = page.getByLabelText('前のページ');
    await expect.element(prev).toHaveAttribute('aria-disabled', 'true');
    expect(page.getByRole('link', { name: '前のページ' }).query()).toBeNull();
    await expect.element(page.getByRole('link', { name: '次のページ' })).toBeInTheDocument();
  });

  it('disables next on the last page', async () => {
    render(<Pagination currentPage={5} totalPages={5} href={href} />);
    const next = page.getByLabelText('次のページ');
    await expect.element(next).toHaveAttribute('aria-disabled', 'true');
    expect(page.getByRole('link', { name: '次のページ' }).query()).toBeNull();
  });

  it('renders an ellipsis when there are many pages', async () => {
    render(<Pagination currentPage={5} totalPages={20} href={href} />);
    await expect.element(page.getByText('…').first()).toBeInTheDocument();
  });

  it('lets the consumer build the href (page 1 bare, page 2 query)', async () => {
    render(<Pagination currentPage={3} totalPages={5} href={href} />);
    await expect.element(page.getByRole('link', { name: '1' })).toHaveAttribute('href', '/works');
    await expect.element(page.getByRole('link', { name: '2' })).toHaveAttribute('href', '/works?page=2');
  });

  it('supports an entirely different injected href shape', async () => {
    render(<Pagination currentPage={1} totalPages={5} href={blogHref} />);
    await expect.element(page.getByRole('link', { name: '2' })).toHaveAttribute('href', '/blog?p=2');
  });
});
