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
  it('renders the grid image with a formatBlurURL blur placeholder', async () => {
    await render(<Gallery items={items} />);
    const img = page.getByRole('img', { name: 'flyer a' }).first().element();
    const style = img.getAttribute('style') ?? '';
    expect(style).toContain('blur=20');
    // Placeholder source is kept tiny (small width), not the default 32.
    expect(style).toContain('w=16');
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
  it('closes the lightbox when the overlay backdrop is clicked', async () => {
    await render(<Gallery items={items} />);
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();

    // Press the backdrop corner (outside the centered modal) with a full pointer
    // sequence so react-aria's interact-outside dismissal fires.
    const overlay = page.getByTestId('gallery-overlay').element();
    const fire = (type: string) => overlay.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: 4, clientY: 4, pointerId: 1, isPrimary: true, button: 0 }));
    fire('pointerdown');
    fire('pointerup');
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 4, clientY: 4 }));

    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });
});
