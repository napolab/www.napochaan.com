import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Badge } from './index';

describe('Badge', () => {
  it('renders label and a status dot', async () => {
    render(<Badge>now playing</Badge>);
    await expect.element(page.getByText('now playing')).toBeInTheDocument();
    await expect.element(page.getByTestId('badge-dot')).toBeInTheDocument();
  });
  it('applies tone via data attribute', async () => {
    render(<Badge tone="danger">rec</Badge>);
    await expect.element(page.getByText('rec')).toHaveAttribute('data-tone', 'danger');
  });
});
