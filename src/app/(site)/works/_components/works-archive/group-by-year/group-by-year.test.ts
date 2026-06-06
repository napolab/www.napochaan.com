import { describe, expect, it } from 'vitest';

import { groupByYear } from './index';

import type { WorkRow } from '../index';

const works: readonly WorkRow[] = [
  { id: '1', no: '01', title: 'a', type: 'flyer', year: 2024 },
  { id: '2', no: '02', title: 'b', type: 'graphic', year: 2026 },
  { id: '3', no: '03', title: 'c', type: 'vj', year: 2025 },
  { id: '4', no: '04', title: 'd', type: 'flyer', year: 2024 },
  { id: '5', no: '05', title: 'e', type: 'graphic', year: 2026 },
];

describe('groupByYear', () => {
  it('groups works by year', () => {
    const groups = groupByYear(works);
    const years = groups.map((group) => group.year);

    expect(years).toEqual([2026, 2025, 2024]);
  });

  it('orders years descending (newest first)', () => {
    const [first] = groupByYear(works);

    expect(first?.year).toBe(2026);
  });

  it('preserves item membership within each year', () => {
    const groups = groupByYear(works);
    const y2024 = groups.find((group) => group.year === 2024);
    const y2026 = groups.find((group) => group.year === 2026);

    expect(y2024?.items.map((item) => item.id)).toEqual(['1', '4']);
    expect(y2026?.items.map((item) => item.id)).toEqual(['2', '5']);
  });

  it('returns an empty array for no works', () => {
    expect(groupByYear([])).toEqual([]);
  });

  it('handles a single year', () => {
    const single: readonly WorkRow[] = [{ id: '1', no: '01', title: 'a', type: 'flyer', year: 2025 }];
    const groups = groupByYear(single);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.year).toBe(2025);
    expect(groups[0]?.items).toHaveLength(1);
  });
});
