import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LogSection } from './index';

const entries = [{ id: '1', date: '06/14', title: 'next gig @ club', meta: 'Tokyo', upcoming: true }];

describe('LogSection', () => {
  it('renders entries in a timeline under the log heading', async () => {
    await render(<LogSection entries={entries} />);
    await expect.element(page.getByRole('heading', { name: /log/ })).toBeInTheDocument();
    await expect.element(page.getByText('next gig @ club')).toBeInTheDocument();
  });
});
