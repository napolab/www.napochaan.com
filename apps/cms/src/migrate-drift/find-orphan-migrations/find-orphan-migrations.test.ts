import { describe, expect, it } from 'vitest';

import { findOrphanMigrations } from './index';

describe('findOrphanMigrations', () => {
  it('returns nothing when every applied migration exists locally', () => {
    const applied = [
      { name: '20260101_000000_a', batch: 1 },
      { name: '20260102_000000_b', batch: 2 },
    ];

    expect(findOrphanMigrations(applied, ['20260101_000000_a', '20260102_000000_b', '20260103_000000_pending'])).toEqual([]);
  });

  it('returns applied migrations that are missing locally, in DB order', () => {
    const applied = [
      { name: '20260101_000000_a', batch: 1 },
      { name: '20260103_000000_reverted', batch: 3 },
      { name: '20260102_000000_also_gone', batch: 2 },
    ];

    expect(findOrphanMigrations(applied, ['20260101_000000_a'])).toEqual(['20260103_000000_reverted', '20260102_000000_also_gone']);
  });

  it('ignores dev-push entries (batch -1) even when they have no local file', () => {
    const applied = [
      { name: 'dev', batch: -1 },
      { name: '20260101_000000_a', batch: 1 },
    ];

    expect(findOrphanMigrations(applied, ['20260101_000000_a'])).toEqual([]);
  });

  it('skips rows without a name', () => {
    const applied = [
      { name: null, batch: 1 },
      { name: undefined, batch: 1 },
    ];

    expect(findOrphanMigrations(applied, [])).toEqual([]);
  });

  it('treats an unapplied / fresh database as no drift', () => {
    expect(findOrphanMigrations([], ['20260101_000000_a'])).toEqual([]);
  });

  it('reports every applied migration when there are no local files', () => {
    const applied = [{ name: '20260101_000000_a', batch: 1 }];

    expect(findOrphanMigrations(applied, [])).toEqual(['20260101_000000_a']);
  });
});
