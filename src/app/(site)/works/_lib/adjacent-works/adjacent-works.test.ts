import { describe, expect, it } from 'vitest';

import { adjacentWorks } from './index';

import type { WorkRow } from '../work-row';

const works: readonly WorkRow[] = [
  { id: '1', slug: 'work-a', no: '01', title: 'a', type: 'flyer', year: 2024 },
  { id: '2', slug: 'work-b', no: '02', title: 'b', type: 'graphic', year: 2026 },
  { id: '3', slug: 'work-c', no: '03', title: 'c', type: 'vj', year: 2025 },
];

describe('adjacentWorks', () => {
  it('returns the previous and next neighbours by array index', () => {
    const { prev, next } = adjacentWorks(works, '2');

    expect(prev?.id).toBe('1');
    expect(next?.id).toBe('3');
  });

  it('has no prev at the first item', () => {
    const { prev, next } = adjacentWorks(works, '1');

    expect(prev).toBeUndefined();
    expect(next?.id).toBe('2');
  });

  it('has no next at the last item', () => {
    const { prev, next } = adjacentWorks(works, '3');

    expect(prev?.id).toBe('2');
    expect(next).toBeUndefined();
  });

  it('returns both undefined when the id is absent', () => {
    const { prev, next } = adjacentWorks(works, '99');

    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });

  it('returns both undefined for an empty list', () => {
    const { prev, next } = adjacentWorks([], '1');

    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });
});
