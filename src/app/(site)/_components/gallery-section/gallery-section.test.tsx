import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { GallerySection } from './index';

const items = [{ id: '1', src: '/a.jpg', alt: 'flyer a', width: 400, height: 600, area: 'lead' as const }];

describe('GallerySection', () => {
  it('renders the gallery under a heading', async () => {
    await render(<GallerySection items={items} />);
    await expect.element(page.getByRole('heading', { name: /gallery/ })).toBeInTheDocument();
    await expect.element(page.getByRole('img', { name: 'flyer a' }).first()).toBeInTheDocument();
  });
});
