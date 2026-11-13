import { extractHeadings } from '@components/rich-text/toc';
import { findBlogDraftById, findBlogList } from '@lib/cms/blog';

import { adjacentPosts } from './lib/adjacent-posts';
import { formatPostDate } from './lib/format-post-date';

import type { BlogDetail } from './load-blog-detail';

// The draft preview's data (port of blog/preview/[id]/page.tsx): the latest draft by
// id (undefined → 404), framed by the published list's neighbours of its slug.
export const loadBlogPreview = async (id: string, previewSecret: string): Promise<BlogDetail | undefined> => {
  const post = await findBlogDraftById(id, previewSecret);
  if (post === undefined) return undefined;

  const posts = await findBlogList();

  return {
    post,
    adjacent: adjacentPosts(posts, post.slug),
    headings: extractHeadings(post.body ?? null),
    formattedDate: formatPostDate(post.date),
  };
};
