import { navigate } from 'astro:transitions/client';
import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { AppProviders } from '@components/app-providers';

import { RetryButtonIsland } from './retry-button/island';
import { NotFoundScreen, ServerErrorScreen } from './screens';

afterEach(() => {
  vi.mocked(navigate).mockClear();
});

describe('NotFoundScreen (port of (site)/not-found.tsx)', () => {
  it('renders the 404 code as the page h1', async () => {
    await render(<NotFoundScreen />);

    await expect.element(page.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument();
    await expect.element(page.getByText('お探しのページは存在しないか、移動した可能性があります。')).toBeInTheDocument();
  });

  it('renders a home link pointing to root that navigates softly', async () => {
    await render(
      <AppProviders pathname="/missing">
        <NotFoundScreen />
      </AppProviders>,
    );
    const link = page.getByRole('link', { name: '← / へ戻る' });

    await expect.element(link).toHaveAttribute('href', '/');
    await link.click();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});

describe('ServerErrorScreen (port of (site)/error.tsx)', () => {
  it('renders the 500 code as the page h1', async () => {
    await render(<ServerErrorScreen reload={vi.fn()} />);

    await expect.element(page.getByRole('heading', { level: 1, name: '500' })).toBeInTheDocument();
  });

  it('reloads the page when retry is pressed', async () => {
    const reload = vi.fn();
    await render(<ServerErrorScreen reload={reload} />);

    await page.getByRole('button', { name: 'retry' }).click();

    expect(reload).toHaveBeenCalledOnce();
  });

  it('renders a home link pointing to root', async () => {
    await render(<ServerErrorScreen reload={vi.fn()} />);

    await expect.element(page.getByRole('link', { name: '← / へ戻る' })).toHaveAttribute('href', '/');
  });
});

describe('RetryButtonIsland', () => {
  it('reloads through the injected handler', async () => {
    const reload = vi.fn();
    await render(<RetryButtonIsland pathname="/boom" props={{ reload }} />);

    await page.getByRole('button', { name: 'retry' }).click();

    expect(reload).toHaveBeenCalledOnce();
  });
});
