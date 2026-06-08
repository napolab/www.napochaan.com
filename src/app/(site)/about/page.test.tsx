import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { AboutView } from './_components/about-view';

import type { Profile } from './_lib/profile';

const fixture = {
  name: 'naporitan',
  aka: 'napochaan',
  now: 'プログラマー',
  team: 'StudioGnu',
  tagline: 'おそろしき、なんでも屋。',
  bio: undefined,
  philosophy: undefined,
  love: ['dubstep', 'brostep'],
  skillGroups: [{ category: 'lang', items: ['TypeScript', 'Rust'] }],
  contacts: [{ label: 'x', handle: '@naporin24690', href: 'https://x.com/naporin24690' }],
} satisfies Profile;

describe('AboutPage', () => {
  it('renders the breadcrumb navigation landmark', async () => {
    render(<AboutView profile={fixture} />);
    await expect.element(page.getByRole('navigation', { name: 'パンくず' })).toBeVisible();
  });

  it('links home and marks about as the current page', async () => {
    render(<AboutView profile={fixture} />);
    await expect.element(page.getByRole('link', { name: 'home' })).toHaveAttribute('href', '/');
    await expect.element(page.getByText('about')).toHaveAttribute('aria-current', 'page');
  });
});
