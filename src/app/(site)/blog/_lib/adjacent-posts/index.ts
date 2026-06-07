import type { Post } from '../post';

export type Adjacent = {
  prev?: Post;
  next?: Post;
};

// Date descending — newest first. ISO date strings sort lexicographically in
// chronological order.
const byDateDesc = (a: Post, b: Post): number => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

// Neighbours of `id` within the feed ordered newest-first: prev = the newer post
// (previous in the sorted list), next = the older post (next in the sorted list).
// Both are undefined at the ends, and both are undefined when the id is absent.
// Pure — sorts a copy without mutating the input.
export const adjacentPosts = (posts: readonly Post[], id: string): Adjacent => {
  const sorted = [...posts].sort(byDateDesc);
  const index = sorted.findIndex((post) => post.id === id);
  if (index === -1) return {};

  return { prev: sorted[index - 1], next: sorted[index + 1] };
};
