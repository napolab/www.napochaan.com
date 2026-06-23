import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { AboutContent } from './index';

import type { Profile } from '../../_lib/profile';

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
  contacts: [{ label: 'Twitter(X)', handle: '@naporin24690', href: 'https://x.com/naporin24690' }],
} satisfies Profile;

vi.mock('@lib/payload/profile', () => ({
  findProfile: vi.fn(async () => fixture),
}));

describe('AboutContent', () => {
  it('renders the masthead name as the only h1', async () => {
    render(await AboutContent());
    const headings = page.getByRole('heading', { level: 1 }).elements();
    expect(headings).toHaveLength(1);
    await expect.element(page.getByRole('heading', { level: 1, name: /naporitan/ })).toBeVisible();
  });

  it('renders the whoami section heading', async () => {
    render(await AboutContent());
    await expect.element(page.getByRole('heading', { name: 'whoami' })).toBeVisible();
  });

  it('renders the contact list', async () => {
    render(await AboutContent());
    await expect.element(page.getByRole('link', { name: /Twitter/ })).toHaveAttribute('href', 'https://x.com/naporin24690');
  });

  it('does not render a main landmark or breadcrumbs (owned by the layout)', async () => {
    render(await AboutContent());
    expect(page.getByRole('main').elements()).toHaveLength(0);
    expect(page.getByRole('navigation', { name: 'パンくず' }).elements()).toHaveLength(0);
  });
});
