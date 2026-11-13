import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SystemAnnotation } from './index';

describe('SystemAnnotation', () => {
  it('renders mono system text', async () => {
    render(<SystemAnnotation>00:25AM</SystemAnnotation>);
    await expect.element(page.getByText('00:25AM')).toBeInTheDocument();
  });
  it('applies tone via data attribute', async () => {
    render(<SystemAnnotation tone="danger">not found</SystemAnnotation>);
    await expect.element(page.getByText('not found')).toHaveAttribute('data-tone', 'danger');
  });
});
