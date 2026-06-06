import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { WorksArchive } from './index';

import type { WorkRow } from './index';

const works: readonly WorkRow[] = [
  { id: '1', no: '01', title: 'night graphics vol.13', type: 'flyer', year: 2024 },
  { id: '2', no: '02', title: 'key visual', type: 'graphic', year: 2026 },
  { id: '3', no: '03', title: 'stage VJ set', type: 'vj', year: 2025 },
];

describe('WorksArchive', () => {
  it('renders an h2 per distinct year with the year text', async () => {
    await render(<WorksArchive works={works} />);

    await expect.element(page.getByRole('heading', { level: 2, name: '2026' })).toBeInTheDocument();
    await expect.element(page.getByRole('heading', { level: 2, name: '2025' })).toBeInTheDocument();
    await expect.element(page.getByRole('heading', { level: 2, name: '2024' })).toBeInTheDocument();
  });

  it('renders each work as a link to /works/{id} containing the title', async () => {
    await render(<WorksArchive works={works} />);

    const link = page.getByRole('link', { name: /key visual/ });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute('href', '/works/2');
  });

  it('renders the work type', async () => {
    await render(<WorksArchive works={works} />);

    await expect.element(page.getByText('graphic', { exact: true })).toBeInTheDocument();
  });

  it('labels the thumbnail with the work title', async () => {
    const withThumb: readonly WorkRow[] = [{ id: '9', no: '09', title: 'thumbed', type: 'flyer', year: 2026, thumbnail: { src: '/x.jpg', width: 80, height: 80 } }];
    const { container } = await render(<WorksArchive works={withThumb} />);

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('thumbed');
  });
});
