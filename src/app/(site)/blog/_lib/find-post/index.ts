import type { Post } from '../post';

// Find a post by its id. Returns undefined when no post matches (or the feed is
// empty) — the caller decides whether that means a 404.
export const findPost = (posts: readonly Post[], id: string): Post | undefined => posts.find((post) => post.id === id);
