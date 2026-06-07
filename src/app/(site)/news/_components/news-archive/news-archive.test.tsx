import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { NewsArchive } from './index';

const groups = [
  {
    key: '2026-06',
    label: '2026 / 06',
    items: [
      { id: '1', date: '2026-06-05', category: 'site', title: 'サイトを全面リニューアル' },
      { id: '2', date: '2026-06-01', category: 'live', title: 'Booth²Booth 出演決定' },
    ],
  },
  {
    key: '2026-05',
    label: '2026 / 05',
    items: [{ id: '3', date: '2026-05-23', category: 'release', title: 'works ページ公開' }],
  },
];

describe('NewsArchive', () => {
  it('renders an h2 per distinct year-month label', async () => {
    await render(<NewsArchive groups={groups} />);

    await expect.element(page.getByRole('heading', { level: 2, name: '2026 / 06' })).toBeInTheDocument();
    await expect.element(page.getByRole('heading', { level: 2, name: '2026 / 05' })).toBeInTheDocument();
  });

  it('renders each item as a link to /news/{id} containing the title', async () => {
    await render(<NewsArchive groups={groups} />);

    const link = page.getByRole('link', { name: /Booth²Booth 出演決定/ });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute('href', '/news/2');
  });

  it('renders the category tag and the MM.DD date', async () => {
    await render(<NewsArchive groups={groups} />);

    await expect.element(page.getByText('release', { exact: true })).toBeInTheDocument();
    await expect.element(page.getByText('05.23', { exact: true })).toBeInTheDocument();
  });
});
