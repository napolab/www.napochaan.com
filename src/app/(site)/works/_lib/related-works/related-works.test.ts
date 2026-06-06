import { describe, expect, it } from 'vitest';

import { relatedWorks } from './index';

import type { WorkRow } from '../work-row';

const works: readonly WorkRow[] = [
  { id: '1', no: '01', title: 'a', type: 'flyer', year: 2024 },
  { id: '2', no: '02', title: 'b', type: 'graphic', year: 2026 },
  { id: '3', no: '03', title: 'c', type: 'vj', year: 2025 },
  { id: '4', no: '04', title: 'd', type: 'graphic', year: 2023 },
  { id: '5', no: '05', title: 'e', type: 'graphic', year: 2022 },
  { id: '6', no: '06', title: 'f', type: 'graphic', year: 2021 },
];

describe('relatedWorks', () => {
  it('returns works of the same type, excluding the work itself', () => {
    const [target] = works.filter((work) => work.id === '2');
    const related = relatedWorks(works, target!);

    expect(related.map((work) => work.id)).toEqual(['4', '5', '6']);
  });

  it('caps the result at the limit (default 3)', () => {
    const [target] = works.filter((work) => work.id === '2');

    expect(relatedWorks(works, target!)).toHaveLength(3);
  });

  it('honours a custom limit', () => {
    const [target] = works.filter((work) => work.id === '2');

    expect(relatedWorks(works, target!, 2).map((work) => work.id)).toEqual(['4', '5']);
  });

  it('returns fewer than the limit when not enough match', () => {
    const [target] = works.filter((work) => work.id === '1');

    expect(relatedWorks(works, target!)).toEqual([]);
  });

  it('never includes the work itself', () => {
    const [target] = works.filter((work) => work.id === '4');
    const related = relatedWorks(works, target!);

    expect(related.some((work) => work.id === '4')).toBe(false);
  });
});
