import { describe, expect, it } from 'vitest';

import { buildWhoamiRows } from './index';

describe('buildWhoamiRows', () => {
  it('lists name, aka, now and team in order', () => {
    const rows = buildWhoamiRows({ name: 'n', aka: 'a', now: 'w', team: 't', tagline: '', love: [], skillGroups: [], contacts: [] });
    expect(rows).toEqual([
      { term: 'name', description: 'n' },
      { term: 'aka', description: 'a' },
      { term: 'now', description: 'w' },
      { term: 'team', description: 't' },
    ]);
  });
});
