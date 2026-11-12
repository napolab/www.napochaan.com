import { describe, expect, it } from 'vitest';

import { projectProfile } from './index';

import type { Profile as ProfileGlobal } from '@payload-types';

const global = {
  name: 'naporitan',
  aka: 'napochaan',
  now: 'programmer',
  team: 'StudioGnu',
  tagline: 'おそろしき、なんでも屋。',
  love: [
    { id: 'a', value: 'dubstep' },
    { id: 'b', value: 'riddim' },
  ],
  skillGroups: [
    {
      id: 'g',
      category: 'lang',
      items: [
        { id: '1', value: 'TypeScript' },
        { id: '2', value: 'Rust' },
      ],
    },
  ],
  contacts: [{ id: 'c', label: 'x', handle: '@naporin24690', href: 'https://x.com/naporin24690' }],
} as unknown as ProfileGlobal;

describe('projectProfile', () => {
  it('flattens array value/items into plain string arrays', () => {
    const profile = projectProfile(global);
    expect(profile.name).toBe('naporitan');
    expect(profile.tagline).toBe('おそろしき、なんでも屋。');
    expect(profile.love).toEqual(['dubstep', 'riddim']);
    expect(profile.skillGroups).toEqual([{ category: 'lang', items: ['TypeScript', 'Rust'] }]);
    expect(profile.contacts).toEqual([{ label: 'x', handle: '@naporin24690', href: 'https://x.com/naporin24690' }]);
  });

  it('coerces missing optional text fields to empty string and omits absent rich text', () => {
    const sparse = { name: 'n', love: null, skillGroups: null, contacts: null } as unknown as ProfileGlobal;
    const profile = projectProfile(sparse);
    expect(profile.aka).toBe('');
    expect(profile).not.toHaveProperty('bioJSON');
    expect(profile).not.toHaveProperty('philosophyJSON');
    expect(profile.love).toEqual([]);
  });

  it('carries bio / philosophy as JSON strings', () => {
    const bio = { root: { type: 'root', children: [] } };
    const profile = projectProfile({ ...global, bio, philosophy: bio } as unknown as ProfileGlobal);
    expect(JSON.parse(profile.bioJSON ?? '')).toEqual(bio);
    expect(JSON.parse(profile.philosophyJSON ?? '')).toEqual(bio);
  });
});
