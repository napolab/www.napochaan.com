import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Tag } from './index';

describe('Tag', () => {
  it('renders label text', async () => {
    render(<Tag>flyer</Tag>);
    await expect.element(page.getByText('flyer')).toBeInTheDocument();
  });
  it('applies the tone via data attribute', async () => {
    render(<Tag tone="blue">live</Tag>);
    await expect.element(page.getByText('live')).toHaveAttribute('data-tone', 'blue');
  });
});
