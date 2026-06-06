import type { WorkRow } from '../index';

export type YearGroup = {
  year: number;
  items: WorkRow[];
};

// Group works by their `year`, ordered newest-first. Pure: builds a fresh map
// then folds it into an array sorted by year descending. `Object.groupBy`
// coerces the numeric year into a string property key, so map each key back to a
// number via parseInt and sort numerically. Membership order within a year
// follows the input order.
export const groupByYear = (works: readonly WorkRow[]): YearGroup[] => {
  const byYear = Object.groupBy(works, (work) => work.year);

  return Object.entries(byYear)
    .map(([key, items]) => ({ year: parseInt(key, 10), items: items ?? [] }))
    .sort((a, b) => b.year - a.year);
};
