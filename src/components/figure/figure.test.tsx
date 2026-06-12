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
});
