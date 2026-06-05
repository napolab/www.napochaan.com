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
});
