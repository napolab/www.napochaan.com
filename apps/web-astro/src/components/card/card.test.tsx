import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Card } from './index';

describe('Card', () => {
  it('renders children inside an article by default', async () => {
    render(
      <Card>
        <h3>night vol.13</h3>
      </Card>,
    );
    await expect.element(page.getByRole('article')).toBeInTheDocument();
    await expect.element(page.getByRole('heading', { name: 'night vol.13' })).toBeInTheDocument();
  });
  it('can render as a different element', async () => {
    render(<Card as="div">x</Card>);
    await expect.element(page.getByText('x')).toBeInTheDocument();
  });
});
