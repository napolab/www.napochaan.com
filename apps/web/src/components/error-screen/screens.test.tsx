import { navigate } from 'astro:transitions/client';
import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { NotFoundIsland, ServerErrorIsland } from './screens';

afterEach(() => {
  vi.mocked(navigate).mockClear();
});

describe('NotFoundIsland (port of (site)/not-found.tsx)', () => {
  it('renders the 404 code as the page h1', async () => {
    await render(<NotFoundIsland pathname="/missing" props={{}} />);

    await expect.element(page.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument();
    await expect.element(page.getByText('お探しのページは存在しないか、移動した可能性があります。')).toBeInTheDocument();
  });

  it('renders a home link pointing to root that navigates softly', async () => {
    await render(<NotFoundIsland pathname="/missing" props={{}} />);
    const link = page.getByRole('link', { name: '← / へ戻る' });

    await expect.element(link).toHaveAttribute('href', '/');
    await link.click();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});

describe('ServerErrorIsland (port of (site)/error.tsx)', () => {
  it('renders the 500 code as the page h1', async () => {
    await render(<ServerErrorIsland pathname="/boom" props={{ reload: vi.fn() }} />);

    await expect.element(page.getByRole('heading', { level: 1, name: '500' })).toBeInTheDocument();
  });

  it('reloads the page when retry is pressed', async () => {
    const reload = vi.fn();
    await render(<ServerErrorIsland pathname="/boom" props={{ reload }} />);

    await page.getByRole('button', { name: 'retry' }).click();

    expect(reload).toHaveBeenCalledOnce();
  });

  it('renders a home link pointing to root', async () => {
    await render(<ServerErrorIsland pathname="/boom" props={{ reload: vi.fn() }} />);

    await expect.element(page.getByRole('link', { name: '← / へ戻る' })).toHaveAttribute('href', '/');
  });
});
