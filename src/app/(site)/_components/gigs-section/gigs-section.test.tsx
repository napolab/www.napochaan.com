import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { GigsSection } from './index';

const gigs = [{ id: '1', date: '06/14', event: 'next gig @ club', venue: 'Tokyo', upcoming: true }];

describe('GigsSection', () => {
  it('renders gigs in a timeline under a heading', async () => {
    await render(<GigsSection gigs={gigs} />);
    await expect.element(page.getByRole('heading', { name: /timeline/ })).toBeInTheDocument();
    await expect.element(page.getByText('next gig @ club')).toBeInTheDocument();
  });
});
