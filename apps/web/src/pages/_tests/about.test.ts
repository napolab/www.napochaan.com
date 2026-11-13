import { describe, expect, it, vi } from 'vitest';

import NotFoundPage from '../404.astro';
import AboutPage from '../about.astro';
import { ORIGIN, renderPage } from '../../test-utils/astro-container';
import { CLIENT_LEAF_ISLANDS, mainIslandsOf, mainLeafElementsOf, mainScrambleTextCountOf } from '../../test-utils/island-parity';

import type { Profile } from '../../features/about/profile';

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

const findProfile = vi.hoisted(() => vi.fn<() => Promise<Profile | undefined>>());

vi.mock('@utils/request-url', () => ({ getRequestOrigin: async () => ORIGIN }));
vi.mock('@lib/cms/profile', () => ({ findProfile }));

const render = async (): Promise<string> => {
  findProfile.mockResolvedValue(fixture);

  return (await renderPage(AboutPage, '/about')).text();
};

describe('/about', () => {
  it('titles the page and points at its markdown twin', async () => {
    const html = await render();
    expect(html).toContain('<title>about — napochaan</title>');
    expect(html).toContain('<meta name="description" content="おそろしき、なんでも屋。"');
    expect(html).toContain('<link rel="alternate" type="text/markdown" href="http://localhost:8788/about.md" title="about"');
  });

  it('renders the masthead name as the only h1 inside main#main-content', async () => {
    const html = await render();
    expect(html).toMatch(/<main id="main-content" class="[^"]+">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>[\s\S]*naporitan[\s\S]*?<\/h1>/);
  });

  it('renders breadcrumbs, the six sections and the contact link', async () => {
    const html = await render();
    expect(html).toContain('aria-label="パンくず"');
    for (const heading of ['whoami', 'bio', 'philosophy', 'love', 'skill', 'contact']) {
      expect(html).toMatch(new RegExp(`<h2[^>]*>${heading}</h2>`));
    }
    expect(html).toContain('href="https://x.com/naporin24690"');
  });

  it('hydrates only client leaves inside main (no breadcrumbs / masthead / contact list islands)', async () => {
    const html = await render();
    const islands = mainIslandsOf(html);
    expect(islands.filter((name) => !CLIENT_LEAF_ISLANDS.has(name))).toEqual([]);
    expect(islands).toEqual([]);
    // The masthead's EchoText / TypewriterText and ScrambleText ship as custom elements.
    expect(mainLeafElementsOf(html).filter((tag) => tag !== 'scramble-text')).toEqual(['echo-text', 'typewriter-text']);
    expect(mainScrambleTextCountOf(html)).toBe(2);
  });

  it('answers 404 with the not-found page when the profile is missing', async () => {
    findProfile.mockResolvedValue(undefined);
    const res = await renderPage(AboutPage, '/about', { '/404': NotFoundPage });
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain('お探しのページは存在しないか');
    expect(html).not.toContain('naporitan');
  });
});
