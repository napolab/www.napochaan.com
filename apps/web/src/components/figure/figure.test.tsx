import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Figure } from './index';

describe('Figure', () => {
  it('renders an image with alt text', async () => {
    render(<Figure src="/x.jpg" alt="flyer" width={200} height={300} />);
    await expect.element(page.getByRole('img', { name: 'flyer' })).toBeInTheDocument();
  });

  it('renders a caption when provided', async () => {
    render(<Figure src="/x.jpg" alt="flyer" width={200} height={300} caption="night vol.13" />);
    await expect.element(page.getByText('night vol.13')).toBeInTheDocument();
  });

  it('renders a blurred backdrop and corner tag in the cover variant', async () => {
    const { container } = await render(<Figure src="/x.jpg" alt="flyer" width={200} height={200} variant="cover" caption="graphic / 2024" />);

    expect(container.querySelector('figure[data-variant="cover"]')).not.toBeNull();
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeNull();
    await expect.element(page.getByText('graphic / 2024')).toBeInTheDocument();
  });

  it('omits the backdrop in the plain variant', async () => {
    const { container } = await render(<Figure src="/x.jpg" alt="flyer" width={200} height={300} />);

    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('marks the figure data-fit="intrinsic" and sets --figure-width to the width prop when fit is intrinsic', async () => {
    const { container } = await render(<Figure src="/x.jpg" alt="flyer" width={480} height={250} variant="cover" fit="intrinsic" />);

    const figure = container.querySelector('figure[data-variant="cover"][data-fit="intrinsic"]');
    expect(figure).not.toBeNull();
    expect((figure as HTMLElement).style.getPropertyValue('--figure-width')).toBe('480px');
  });

  it('defaults to data-fit="fill" and omits --figure-width when fit is not specified', async () => {
    const { container } = await render(<Figure src="/x.jpg" alt="flyer" width={200} height={300} variant="cover" />);

    const figure = container.querySelector('figure[data-fit="fill"]');
    expect(figure).not.toBeNull();
    expect((figure as HTMLElement).style.getPropertyValue('--figure-width')).toBe('');
  });

  it('does not wrap the image in a button by default', async () => {
    render(<Figure src="/a.jpg" alt="a" width={1200} height={800} variant="cover" fit="intrinsic" />);
    const locator = page.getByRole('img', { name: 'a' });
    await expect.element(locator).toBeInTheDocument();
    expect(locator.element().closest('button')).toBeNull();
  });

  it('opens a lightbox overlay when a zoomable image is tapped', async () => {
    render(<Figure src="/a.jpg" alt="a" width={1200} height={800} variant="cover" fit="intrinsic" zoomable />);
    const locator = page.getByRole('img', { name: 'a' });
    await expect.element(locator).toBeInTheDocument();
    expect(locator.element().closest('button')).not.toBeNull();
    await page.getByRole('button', { name: 'a' }).click();
    await expect.element(page.getByRole('dialog')).toBeInTheDocument();
  });

  it('passes a content-column sizes attribute by default', async () => {
    const screen = await render(<Figure src="/a.jpg" alt="a" width={1600} height={900} />);
    const img = screen.container.querySelector('[data-testid="next-image"]');
    expect(img?.getAttribute('data-sizes')).toBe('(min-width: 1180px) 1180px, 100vw');
  });

  it('caps sizes at the intrinsic width for fit="intrinsic" when narrower than the 85% column cap', async () => {
    const screen = await render(<Figure src="/a.jpg" alt="a" width={400} height={300} variant="cover" fit="intrinsic" />);
    const img = screen.container.querySelector('[data-testid="next-image"]');
    expect(img?.getAttribute('data-sizes')).toBe('(min-width: 1180px) 400px, min(400px, 85vw)');
  });

  // The intrinsic frame renders at `min(var(--figure-width), 85%)` of the content
  // column (styles.css.ts), so a source wider than 1180 * 0.85 ≈ 1003px never
  // actually renders at its own width — the sizes attribute must cap there too.
  it('caps sizes at the 85% column cap for fit="intrinsic" when the source is wider than the cap', async () => {
    const screen = await render(<Figure src="/a.jpg" alt="a" width={2400} height={1600} variant="cover" fit="intrinsic" />);
    const img = screen.container.querySelector('[data-testid="next-image"]');
    expect(img?.getAttribute('data-sizes')).toBe('(min-width: 1180px) 1003px, min(2400px, 85vw)');
  });

  it('lets a caller override sizes', async () => {
    const screen = await render(<Figure src="/a.jpg" alt="a" width={1600} height={900} sizes="50vw" />);
    const img = screen.container.querySelector('[data-testid="next-image"]');
    expect(img?.getAttribute('data-sizes')).toBe('50vw');
  });
});
