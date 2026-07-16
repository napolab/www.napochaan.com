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

describe('buildAboutMarkdown', () => {
  it('renders frontmatter, profile header lines, bio, and philosophy', () => {
    expect(buildAboutMarkdown(profile, BASE)).toBe(
      [
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
        '',
      ].join('\n'),
    );
  });

  it('reports unavailability when the profile is undefined', () => {
    expect(buildAboutMarkdown(undefined, BASE)).toBe('# about\n\nProfile is unavailable.\n');
  });
});
