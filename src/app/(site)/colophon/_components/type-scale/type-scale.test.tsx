import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { TypeScale } from './index';

const rows = [
  { token: 'md', px: '16px', ratio: '1.00x', role: '本文' },
  { token: 'hero', px: '56→160px', ratio: 'clamp 15vw', role: 'ヒーロー' },
] as const;

describe('TypeScale', () => {
  it('renders each token, px, ratio and role', async () => {
    await render(<TypeScale rows={rows} />);

    await expect.element(page.getByText('md')).toBeInTheDocument();
    await expect.element(page.getByText('16px')).toBeInTheDocument();
    await expect.element(page.getByText('1.00x')).toBeInTheDocument();
    await expect.element(page.getByText('本文')).toBeInTheDocument();
    await expect.element(page.getByText('ヒーロー')).toBeInTheDocument();
  });

  it('renders one row per entry', async () => {
    const { container } = await render(<TypeScale rows={rows} />);

    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(container.querySelectorAll('dd')).toHaveLength(2);
  });

  it('tags each specimen with its size token', async () => {
    const { container } = await render(<TypeScale rows={rows} />);

    expect(container.querySelector('[data-token="md"]')).not.toBeNull();
    expect(container.querySelector('[data-token="hero"]')).not.toBeNull();
  });
});
