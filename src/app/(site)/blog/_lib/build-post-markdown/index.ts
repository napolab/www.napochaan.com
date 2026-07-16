import { lexicalToMarkdown } from '@utils/lexical/to-markdown';
import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { Post } from '../post';

/** One blog post as a standalone markdown document (`/blog/{slug}.md`). Pure. */
export const buildPostMarkdown = (post: Post, baseUrl: string): string => {
  const url = new URL(`/blog/${post.slug}`, baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: post.title, date: post.date, url, excerpt: post.excerpt, readMin: post.readMin });
  const body = lexicalToMarkdown(post.body, { baseUrl });
  const content = body === '' ? post.excerpt : body;

  return `${[frontmatter, `# ${post.title}`, content].join('\n\n')}\n`;
};
