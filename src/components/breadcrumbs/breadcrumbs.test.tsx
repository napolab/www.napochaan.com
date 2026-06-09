import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Breadcrumbs } from './index';

describe('Breadcrumbs', () => {
  const items = [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: 'night vol.13' }];

  it('renders a navigation landmark', async () => {
    render(<Breadcrumbs items={items} />);
    await expect.element(page.getByRole('navigation', { name: 'パンくず' })).toBeInTheDocument();
  });

  it('renders links for non-current items', async () => {
    render(<Breadcrumbs items={items} />);
    await expect.element(page.getByRole('link', { name: 'home' })).toHaveAttribute('href', '/');
    await expect.element(page.getByRole('link', { name: 'works' })).toHaveAttribute('href', '/works');
  });

  it('marks the last item as current and not a link', async () => {
    render(<Breadcrumbs items={items} />);
    const current = page.getByText('night vol.13');
    await expect.element(current).toHaveAttribute('aria-current', 'page');
    expect(page.getByRole('link', { name: 'night vol.13' }).query()).toBeNull();
  });

  it('flags the last crumb so its title can stay on one line', async () => {
    render(<Breadcrumbs items={items} />);
    const current = page.getByText('night vol.13');
    await expect.element(current).toBeInTheDocument();
    expect(current.element().closest('li')).toHaveAttribute('data-last', 'true');
  });
});
