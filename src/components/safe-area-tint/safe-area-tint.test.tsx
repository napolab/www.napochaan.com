import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SafeAreaTint } from './index';

describe('SafeAreaTint', () => {
  it('renders an aria-hidden root containing the tint strip', async () => {
    await render(<SafeAreaTint />);
    const root = page.getByTestId('safe-area-tint');
    await expect.element(root).toHaveAttribute('aria-hidden', 'true');
    await expect.element(page.getByTestId('safe-area-tint-strip')).toBeInTheDocument();
  });

  it('publishes --scroll-range as a px value after mount', async () => {
    await render(<SafeAreaTint />);
    await expect.poll(() => document.documentElement.style.getPropertyValue('--scroll-range')).toMatch(/^-?\d+(\.\d+)?px$/);
  });
});
