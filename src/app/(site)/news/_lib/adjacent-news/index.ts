import type { NewsItem } from '../news-item';

export type Adjacent = {
  prev?: NewsItem;
  next?: NewsItem;
};

// Date descending — newest first. ISO date strings sort lexicographically in
// chronological order.
const byDateDesc = (a: NewsItem, b: NewsItem): number => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

// Neighbours of `id` within the full feed ordered newest-first: prev = the newer
// item (previous in the sorted list), next = the older item (next in the sorted
// list). Both are undefined at the ends, and both are undefined when the id is
// absent. Pure — sorts a copy without mutating the input.
export const adjacentNews = (items: readonly NewsItem[], id: string): Adjacent => {
  const sorted = [...items].sort(byDateDesc);
  const index = sorted.findIndex((item) => item.id === id);
  if (index === -1) return {};

  return { prev: sorted[index - 1], next: sorted[index + 1] };
};
