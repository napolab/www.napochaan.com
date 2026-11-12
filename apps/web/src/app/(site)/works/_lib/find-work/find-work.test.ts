import { describe, expect, it } from 'vitest';

import { findWork } from './index';

import type { WorkRow } from '../work-row';

const works: readonly WorkRow[] = [
  { id: '1', slug: 'work-a', no: '01', title: 'a', type: 'flyer', year: 2024 },
  { id: '2', slug: 'work-b', no: '02', title: 'b', type: 'graphic', year: 2026 },
  { id: '3', slug: 'work-c', no: '03', title: 'c', type: 'vj', year: 2025 },
];

describe('findWork', () => {
  it('returns the work matching the slug', () => {
    expect(findWork(works, 'work-b')?.title).toBe('b');
  });

  it('returns undefined when the slug is absent', () => {
    expect(findWork(works, 'work-z')).toBeUndefined();
  });

  it('returns undefined for an empty list', () => {
    expect(findWork([], 'work-a')).toBeUndefined();
  });
});
