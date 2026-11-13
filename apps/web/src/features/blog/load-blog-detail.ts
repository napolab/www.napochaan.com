import { extractHeadings } from '@components/rich-text/toc';
import { findBlogBySlug, findBlogList } from '@lib/cms/blog';

import { adjacentPosts } from './lib/adjacent-posts';
import { formatPostDate } from './lib/format-post-date';

import type { Adjacent } from './lib/adjacent-posts';
import type { Post } from './post';
import type { TocHeading } from '@components/rich-text/toc';

export type BlogDetail = {
  post: Post;
  adjacent: Adjacent;
  headings: readonly TocHeading[];
  formattedDate: string;
};

// The detail page's data: the post (undefined → the route's 404), its newest-first
// neighbours from the full published list, and the TOC entries. A publish purges every
// page at once, so the prev/next derived from the list never goes stale.
export const loadBlogDetail = async (slug: string): Promise<BlogDetail | undefined> => {
  const post = await findBlogBySlug(slug);
  if (post === undefined) return undefined;

  const posts = await findBlogList();

  return {
    post,
    adjacent: adjacentPosts(posts, slug),
    headings: extractHeadings(post.body ?? null),
    formattedDate: formatPostDate(post.date),
  };
};
