import { describe, expect, it } from 'vitest';

import { buildAboutMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Profile } from '../profile';

const BASE = 'https://example.com';
const rich = (value: string) => ({ root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: value, format: 0 }] }] } }) as unknown as SerializedEditorState;

const profile: Profile = {
  name: 'naporitan',
  aka: 'napochaan',
  now: 'エンジニア · DJ · VJ',
  team: 'StudioGnu',
  tagline: 'おそろしき、なんでも屋。',
  bio: rich('自己紹介'),
  philosophy: rich('哲学'),
  love: [],
  skillGroups: [],
  contacts: [],
};

const HEADER_LINES = [
  '---',
  'title: "naporitan"',
  'url: "https://example.com/about"',
  '---',
  '',
  '# naporitan',
  '',
  '**naporitan** (napochaan)',
  '',
  '> おそろしき、なんでも屋。',
  '',
  'Now: エンジニア · DJ · VJ / Team: StudioGnu',
  '',
  '自己紹介',
  '',
  '哲学',
];

describe('buildAboutMarkdown', () => {
  it('renders frontmatter, profile header lines, bio, and philosophy when love/skillGroups/contacts are empty', () => {
    expect(buildAboutMarkdown(profile, BASE)).toBe([...HEADER_LINES, ''].join('\n'));
  });

  it('renders love/skill/contact sections when present', () => {
    const withSections: Profile = {
      ...profile,
      love: ['DJ', 'VJ'],
      skillGroups: [{ category: 'frontend', items: ['react', 'panda css'] }],
      contacts: [{ label: 'X', handle: '@naporin24690', href: 'https://x.com/naporin24690' }],
    };

    expect(buildAboutMarkdown(withSections, BASE)).toBe(
      [...HEADER_LINES, '', '## love', '', '- DJ', '- VJ', '', '## skill', '', '- frontend: react, panda css', '', '## contact', '', '- X: [@naporin24690](https://x.com/naporin24690)', ''].join('\n'),
    );
  });

  it('reports unavailability when the profile is undefined', () => {
    expect(buildAboutMarkdown(undefined, BASE)).toBe('# about\n\nProfile is unavailable.\n');
  });
});
