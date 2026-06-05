import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Timeline } from './index';

const items = [
  { id: '1', date: '06/14', label: 'next gig @ club', meta: 'Tokyo', upcoming: true },
  { id: '2', date: '04/02', label: 'techno set @ venue', meta: 'DJ' },
];

describe('Timeline', () => {
  it('renders a list of events', async () => {
    await render(<Timeline items={items} />);
    await expect.element(page.getByText('next gig @ club')).toBeInTheDocument();
    await expect.element(page.getByText('techno set @ venue')).toBeInTheDocument();
  });
  it('marks upcoming items via data attribute', async () => {
    await render(<Timeline items={items} />);
    await expect.element(page.getByTestId('timeline-item-1')).toHaveAttribute('data-upcoming', 'true');
  });
});
