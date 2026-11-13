import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Heading } from './index';

describe('Heading', () => {
  it('renders an h2 by default', async () => {
    render(<Heading>見出し</Heading>);
    const h = page.getByRole('heading', { level: 2, name: '見出し' });
    await expect.element(h).toBeInTheDocument();
  });
  it('renders the requested level', async () => {
    render(<Heading level={4}>section</Heading>);
    await expect.element(page.getByRole('heading', { level: 4, name: 'section' })).toBeInTheDocument();
  });
  it('exposes data-level', async () => {
    render(<Heading level={3}>x</Heading>);
    await expect.element(page.getByRole('heading', { level: 3 })).toHaveAttribute('data-level', '3');
  });
});
