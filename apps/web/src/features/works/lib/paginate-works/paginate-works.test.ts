import { describe, expect, it } from 'vitest';

import { PAGE_SIZE, paginateWorks, worksPageHref } from './index';

import type { WorkRow } from '../../work-row';

const work = (n: number, year: number): WorkRow => ({ id: `${n}`, slug: `work-${n}`, no: `${n}`, title: `work ${n}`, type: 'production', year });

// CMS order is kept as-is (never re-sorted).
const feed: readonly WorkRow[] = Array.from({ length: 53 }, (_, i) => work(i + 1, i % 2 === 0 ? 2024 : 2026));

describe('paginateWorks', () => {
  it('slices PAGE_SIZE works in the CMS order', () => {
    const first = paginateWorks(feed, 1);
    expect(first?.totalPages).toBe(2);
    expect(first?.works).toHaveLength(PAGE_SIZE);
    expect(first?.works.slice(0, 2).map((row) => row.slug)).toEqual(['work-1', 'work-2']);
    expect(paginateWorks(feed, 2)?.works.map((row) => row.slug)).toEqual(['work-51', 'work-52', 'work-53']);
  });

  it('returns undefined past the last page', () => {
    expect(paginateWorks(feed, 3)).toBeUndefined();
  });

  it('keeps page 1 for an empty archive', () => {
    expect(paginateWorks([], 1)).toEqual({ works: [], current: 1, totalPages: 1 });
  });
});

describe('worksPageHref', () => {
  it('keeps page 1 on the bare path', () => {
    expect(worksPageHref(1)).toBe('/works');
    expect(worksPageHref(2)).toBe('/works/page/2');
  });
});
