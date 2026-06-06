import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Hero } from './index';

describe('Hero', () => {
  it('renders the wordmark and lead', async () => {
    await render(<Hero />);
    await expect.element(page.getByText('napochaan').first()).toBeInTheDocument();
    await expect.element(page.getByText(/相互作用/)).toBeInTheDocument();
  });
});
