import { describe, expect, it } from 'vitest';

import { toLogManualItem } from './index';

import type { Log } from '@payload-types';

const base = { id: 2, title: 'サイト公開', date: '2026-06-01T00:00:00.000Z', meta: 'milestone', updatedAt: '', createdAt: '' } as unknown as Log;

describe('toLogManualItem', () => {
  it('maps fields, stringifies id, formats date YYYY-MM-DD', () => {
    const item = toLogManualItem(base);
    expect(item).toEqual({ id: '2', title: 'サイト公開', date: '2026-06-01', meta: 'milestone', url: undefined });
  });

  it('coerces NULL url to undefined', () => {
    expect(toLogManualItem({ ...base, url: null } as unknown as Log).url).toBeUndefined();
  });
});
