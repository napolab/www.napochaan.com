import { describe, expect, it, vi } from 'vitest';

import * as aboutMarkdown from '../about.md';
import { buildAboutMarkdown } from '../../features/about/lib/build-about-markdown';
import { renderEndpoint } from '../../test-utils/astro-container';

import type { Profile } from '../../features/about/profile';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

const fixture = {
  name: 'naporitan',
  aka: 'napochaan',
  now: 'プログラマー',
  team: 'StudioGnu',
  tagline: 'おそろしき、なんでも屋。',
  love: ['dubstep'],
  skillGroups: [{ category: 'lang', items: ['TypeScript'] }],
  contacts: [{ label: 'GitHub', handle: 'naporin0624', href: 'https://github.com/naporin0624' }],
} satisfies Profile;

vi.mock('@lib/cms/profile', () => ({ findProfile: vi.fn(async () => fixture) }));

describe('/about.md', () => {
  it('serves buildAboutMarkdown as text/markdown', async () => {
    // vitest mirrors Vite's `BASE_URL` ('/') into process.env; the worker gets the
    // site origin from wrangler vars.
    vi.stubEnv('BASE_URL', 'https://napochaan.com');
    const res = await renderEndpoint(aboutMarkdown as unknown as AstroComponentFactory, '/about.md');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe(buildAboutMarkdown(fixture, 'https://napochaan.com'));
  });
});
