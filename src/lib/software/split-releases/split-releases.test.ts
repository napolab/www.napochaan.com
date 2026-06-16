import { describe, expect, it } from 'vitest';

import { splitReleases } from './index';

import type { SoftwareRelease } from '@lib/payload/software';

const rel = (id: string, releasedAt: string, version: string): SoftwareRelease => ({ id, version, releasedAt, filename: `${id}.zip` });

describe('splitReleases', () => {
  it('returns undefined for an empty list', () => {
    expect(splitReleases([])).toBeUndefined();
  });

  it('picks the newest releasedAt as latest, rest as history (newest-first)', () => {
    const result = splitReleases([rel('1', '2026-01-01', '1.0.0'), rel('3', '2026-03-01', '1.2.0'), rel('2', '2026-02-01', '1.1.0')]);
    expect(result?.latest.id).toBe('3');
    expect(result?.history.map((r) => r.id)).toEqual(['2', '1']);
  });

  it('single release has empty history', () => {
    const result = splitReleases([rel('1', '2026-01-01', '1.0.0')]);
    expect(result?.latest.id).toBe('1');
    expect(result?.history).toEqual([]);
  });
});
