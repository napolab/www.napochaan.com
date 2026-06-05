import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Gallery } from './index';

const items = [
  { id: 'a', src: '/a.jpg', alt: 'flyer a', width: 400, height: 600, area: 'lead' as const, caption: 'flyer / 01' },
  { id: 'b', src: '/b.jpg', alt: 'photo b', width: 800, height: 450, area: 'wide' as const },
];

describe('Gallery', () => {
  it('renders all images', async () => {
    await render(<Gallery items={items} />);
    await expect.element(page.getByRole('img', { name: 'flyer a' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('img', { name: 'photo b' }).first()).toBeInTheDocument();
  });
  it('renders the corner caption label when provided', async () => {
    await render(<Gallery items={items} />);
    await expect.element(page.getByText('flyer / 01')).toBeInTheDocument();
  });
  it('opens a lightbox dialog when an item is activated', async () => {
    await render(<Gallery items={items} />);
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });
});
