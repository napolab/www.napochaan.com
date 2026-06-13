import type { WorkRow } from '../work-row';

export type Adjacent = {
  prev?: WorkRow;
  next?: WorkRow;
};

// Neighbours of `slug` by array order: prev = the item before, next = the item
// after. Both are undefined at the ends, and both are undefined when the slug is
// absent (index === -1). Pure — reads by index without mutating the input.
export const adjacentWorks = (works: readonly WorkRow[], slug: string): Adjacent => {
  const index = works.findIndex((work) => work.slug === slug);
  if (index === -1) return {};

  return { prev: works[index - 1], next: works[index + 1] };
};
