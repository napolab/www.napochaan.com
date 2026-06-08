import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { GalleryArchive } from './index';

import type { GalleryPhoto } from './index';

const photos: GalleryPhoto[] = [
  { id: '1', src: '/a.jpg', width: 400, height: 600, alt: 'flyer a', caption: 'flyer / 01' },
  { id: '2', src: '/b.jpg', width: 1600, height: 900, alt: 'vrchat b', caption: 'VRChat' },
  { id: '3', src: '/c.jpg', width: 500, height: 500, alt: 'frame c' },
];

describe('GalleryArchive', () => {
  it('renders every photo', async () => {
    await render(<GalleryArchive photos={photos} />);
    await expect.element(page.getByRole('img', { name: 'flyer a' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('img', { name: 'vrchat b' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('img', { name: 'frame c' }).first()).toBeInTheDocument();
  });

  it('renders corner captions when provided', async () => {
    await render(<GalleryArchive photos={photos} />);
    await expect.element(page.getByText('flyer / 01')).toBeInTheDocument();
    await expect.element(page.getByText('VRChat')).toBeInTheDocument();
  });

  it('publishes the precomputed column-width layout (no measurement needed)', async () => {
    const { container } = await render(<GalleryArchive photos={photos} />);
    const root = container.querySelector('ul');
    const style = root?.getAttribute('style') ?? '';
    // The three column-count totals are emitted up front for CSS to scale.
    expect(style).toContain('--total-2');
    expect(style).toContain('--total-4');
  });

  it('opens a lightbox dialog when a photo is activated', async () => {
    await render(<GalleryArchive photos={photos} />);
    await page.getByRole('button', { name: /flyer a/ }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });

  // The spotlight-on-hover effect must key off a hovered *photo*, not the gallery as a
  // whole — otherwise hovering a decorative blank cell greys out every photo. Photo cells
  // carry data-photo so the CSS `:has([data-photo]:hover)` selector targets only them.
  it('marks photo cells with data-photo and leaves blank filler cells unmarked', async () => {
    const { container } = await render(<GalleryArchive photos={photos} />);
    const marked = container.querySelectorAll('li[data-photo]');
    expect(marked).toHaveLength(photos.length);
    for (const cell of marked) {
      expect(cell.querySelector('img')).not.toBeNull();
    }
    // Decorative blanks (aria-hidden filler) must not carry the spotlight hook.
    for (const blank of container.querySelectorAll('li[aria-hidden="true"]')) {
      expect(blank.hasAttribute('data-photo')).toBe(false);
    }
  });
});
