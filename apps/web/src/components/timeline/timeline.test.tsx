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
  it('renders the label as a link with the given href when set', async () => {
    await render(<Timeline items={[{ id: '1', date: '06/14', label: 'detail entry', href: '/news/2' }]} />);
    await expect.element(page.getByRole('link', { name: 'detail entry' })).toHaveAttribute('href', '/news/2');
  });
  it('opens an external href in a new tab with a safe rel', async () => {
    await render(<Timeline items={[{ id: '1', date: '06/14', label: 'external entry', href: 'https://example.com/x' }]} />);
    const link = page.getByRole('link', { name: 'external entry' });
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
  it('does not render a link when href is undefined', async () => {
    await render(<Timeline items={[{ id: '1', date: '06/14', label: 'plain entry' }]} />);
    expect(page.getByRole('link', { name: 'plain entry' }).query()).toBeNull();
    await expect.element(page.getByText('plain entry')).toBeInTheDocument();
  });
});
