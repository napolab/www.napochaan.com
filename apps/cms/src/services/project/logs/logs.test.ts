import { describe, expect, it } from 'vitest';

import { projectLogManualItem } from './index';

import type { Log } from '@payload-types';

const base = { id: 2, title: 'サイト公開', date: '2026-06-01T00:00:00.000Z', meta: 'milestone', updatedAt: '', createdAt: '' } as unknown as Log;

describe('projectLogManualItem', () => {
  it('maps fields, stringifies id, formats date YYYY-MM-DD', () => {
    expect(projectLogManualItem(base)).toStrictEqual({ id: '2', title: 'サイト公開', date: '2026-06-01', meta: 'milestone' });
  });

  it('omits a NULL url', () => {
    expect(projectLogManualItem({ ...base, url: null } as unknown as Log)).not.toHaveProperty('url');
  });

  it('keeps a present url', () => {
    expect(projectLogManualItem({ ...base, url: 'https://example.com' } as unknown as Log).url).toBe('https://example.com');
  });
});
