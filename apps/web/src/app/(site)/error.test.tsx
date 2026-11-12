import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import ErrorPage from './error';

describe('error page', () => {
  it('renders the 500 code as the page h1', async () => {
    await render(<ErrorPage error={new Error('boom')} reset={vi.fn()} />);
    await expect.element(page.getByRole('heading', { level: 1, name: '500' })).toBeInTheDocument();
  });

  it('invokes reset when retry is pressed', async () => {
    const reset = vi.fn();
    await render(<ErrorPage error={new Error('boom')} reset={reset} />);
    await page.getByRole('button', { name: 'retry' }).click();
    expect(reset).toHaveBeenCalledOnce();
  });

  it('renders a home link pointing to root', async () => {
    await render(<ErrorPage error={new Error('boom')} reset={vi.fn()} />);
    await expect.element(page.getByRole('link', { name: '← / へ戻る' })).toHaveAttribute('href', '/');
  });
});
