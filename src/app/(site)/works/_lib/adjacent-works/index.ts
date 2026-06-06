import type { WorkRow } from '../work-row';

export type Adjacent = {
  prev?: WorkRow;
  next?: WorkRow;
};

// Neighbours of `id` by array order: prev = the item before, next = the item
// after. Both are undefined at the ends, and both are undefined when the id is
// absent (index === -1). Pure — reads by index without mutating the input.
export const adjacentWorks = (works: readonly WorkRow[], id: string): Adjacent => {
  const index = works.findIndex((work) => work.id === id);
  if (index === -1) return {};

  return { prev: works[index - 1], next: works[index + 1] };
};
