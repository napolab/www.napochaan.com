import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LoadingOverlay } from './index';

describe('LoadingOverlay', () => {
  it('renders a decorative overlay marked aria-hidden', async () => {
    const screen = await render(<LoadingOverlay />);
    const root = screen.container.querySelector('[aria-hidden="true"]');
    expect(root).not.toBeNull();
  });

  it('shows the system-boot brand and no longer shows the old loading status text', async () => {
    const screen = await render(<LoadingOverlay />);
    const text = screen.container.textContent ?? '';
    expect(text).toContain('napochaan');
    expect(text).not.toContain('LOADING TYPEFACES');
  });

  it('exposes no interactive controls or headings to the accessibility tree', async () => {
    await render(<LoadingOverlay />);
    await expect.element(page.getByRole('link')).not.toBeInTheDocument();
    await expect.element(page.getByRole('button')).not.toBeInTheDocument();
    await expect.element(page.getByRole('heading')).not.toBeInTheDocument();
  });
});
