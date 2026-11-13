import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Divider } from './index';

describe('Divider', () => {
  it('renders a separator', async () => {
    render(<Divider />);
    await expect.element(page.getByRole('separator')).toBeInTheDocument();
  });
  it('exposes orientation and variant data attributes', async () => {
    render(<Divider orientation="vertical" variant="dashed" />);
    const sep = page.getByRole('separator');
    await expect.element(sep).toHaveAttribute('data-orientation', 'vertical');
    await expect.element(sep).toHaveAttribute('data-variant', 'dashed');
  });
});
