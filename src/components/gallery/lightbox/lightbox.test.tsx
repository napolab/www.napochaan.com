import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Lightbox } from './index';

describe('Lightbox', () => {
  it('renders the trigger thumbnail (children) with an accessible name', async () => {
    await render(
      <Lightbox src="/a.jpg" alt="flyer a" width={400} height={600} triggerClassName="t">
        <img src="/a.jpg" alt="flyer a" />
      </Lightbox>,
    );
    await expect.element(page.getByRole('button', { name: /flyer a/ })).toBeInTheDocument();
  });

  it('opens a dialog showing the full image when activated', async () => {
    await render(
      <Lightbox src="/a.jpg" alt="flyer a" width={400} height={600} triggerClassName="t">
        <img src="/a.jpg" alt="flyer a" />
      </Lightbox>,
    );
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes when the overlay backdrop is clicked', async () => {
    await render(
      <Lightbox src="/a.jpg" alt="flyer a" width={400} height={600} triggerClassName="t">
        <img src="/a.jpg" alt="flyer a" />
      </Lightbox>,
    );
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();

    const overlay = page.getByTestId('gallery-overlay').element();
    const fire = (type: string) => overlay.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: 4, clientY: 4, pointerId: 1, isPrimary: true, button: 0 }));
    fire('pointerdown');
    fire('pointerup');
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 4, clientY: 4 }));

    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('reserves the dialog image box via an --ar aspect-ratio variable (prevents CLS)', async () => {
    await render(
      <Lightbox src="/a.jpg" alt="flyer a" width={400} height={600} triggerClassName="t">
        <img src="/a.jpg" alt="flyer a" />
      </Lightbox>,
    );
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
    const overlay = page.getByTestId('gallery-overlay').element();
    const img = overlay.querySelector('img');
    expect(img).not.toBeNull();
    expect((img as HTMLImageElement).style.getPropertyValue('--ar').replace(/\s+/g, '')).toBe('400/600');
  });
});
