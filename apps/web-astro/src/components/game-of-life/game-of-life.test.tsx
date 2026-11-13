import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { GameOfLife } from './index';

describe('GameOfLife', () => {
  it('renders a decorative canvas', async () => {
    render(<GameOfLife />);
    const canvas = page.getByTestId('game-of-life');
    await expect.element(canvas).toBeInTheDocument();
    await expect.element(canvas).toHaveAttribute('aria-hidden', 'true');
  });
});
