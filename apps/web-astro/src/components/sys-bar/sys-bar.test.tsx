import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SysBar } from './index';

describe('SysBar', () => {
  it('renders nav links and the live status', async () => {
    await render(<SysBar initialTime="12:34:56" />);
    await expect.element(page.getByRole('link', { name: 'index' })).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'gallery' })).toBeInTheDocument();
    await expect.element(page.getByText('● rec')).toBeInTheDocument();
    await expect.element(page.getByText(/gen/)).toBeInTheDocument();
  });
});
