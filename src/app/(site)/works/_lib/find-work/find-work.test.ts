import { describe, expect, it } from 'vitest';

import { findWork } from './index';

import type { WorkRow } from '../work-row';

const works: readonly WorkRow[] = [
  { id: '1', no: '01', title: 'a', type: 'flyer', year: 2024 },
  { id: '2', no: '02', title: 'b', type: 'graphic', year: 2026 },
  { id: '3', no: '03', title: 'c', type: 'vj', year: 2025 },
];

describe('findWork', () => {
  it('returns the work matching the id', () => {
    expect(findWork(works, '2')?.title).toBe('b');
  });

  it('returns undefined when the id is absent', () => {
    expect(findWork(works, '99')).toBeUndefined();
  });

  it('returns undefined for an empty list', () => {
    expect(findWork([], '1')).toBeUndefined();
  });
});
