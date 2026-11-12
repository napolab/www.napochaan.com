import { describe, expect, it } from 'vitest';

import { fromProfileDTO } from './index';

import type { ProfileDTO } from '@napochaan/cms-api/services';

const base: ProfileDTO = {
  name: 'naporitan',
  aka: 'napochaan',
  now: 'x',
  team: 't',
  tagline: 'tg',
  love: ['dubstep'],
  skillGroups: [{ category: 'lang', items: ['TypeScript'] }],
  contacts: [{ label: 'X', handle: '@n', href: 'https://x.com/n' }],
};

describe('fromProfileDTO', () => {
  it('parses bioJSON and philosophyJSON into editor states', () => {
    const json = JSON.stringify({ root: { type: 'root', children: [] } });
    const profile = fromProfileDTO({ ...base, bioJSON: json, philosophyJSON: json });
    expect(profile.bio).toHaveProperty('root');
    expect(profile.philosophy).toHaveProperty('root');
    expect(profile).not.toHaveProperty('bioJSON');
    expect(profile).not.toHaveProperty('philosophyJSON');
  });

  it('omits bio and philosophy keys when absent', () => {
    const profile = fromProfileDTO(base);
    expect(profile).not.toHaveProperty('bio');
    expect(profile).not.toHaveProperty('philosophy');
    expect(profile).toEqual(base);
  });
});
