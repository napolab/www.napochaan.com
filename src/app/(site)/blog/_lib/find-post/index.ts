import type { Post } from '../post';

// Find a post by its slug. Returns undefined when no post matches (or the feed is
// empty) — the caller decides whether that means a 404.
export const findPost = (posts: readonly Post[], slug: string): Post | undefined => posts.find((post) => post.slug === slug);
