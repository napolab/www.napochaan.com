import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { WorksSection } from './index';

const works = [{ id: '1', no: '01', title: 'night graphics vol.13', type: 'flyer', year: 2024 }];

describe('WorksSection', () => {
  it('renders works in a table under a heading', async () => {
    await render(<WorksSection works={works} />);
    await expect.element(page.getByRole('heading', { name: /works/ })).toBeInTheDocument();
    await expect.element(page.getByRole('table')).toBeInTheDocument();
    await expect.element(page.getByRole('cell', { name: 'night graphics vol.13' })).toBeInTheDocument();
  });
});
