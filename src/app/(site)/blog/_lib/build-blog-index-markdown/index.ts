import type { Post } from '../post';

const entryLine = (post: Post, baseUrl: string): string => {
  const url = new URL(`/blog/${post.slug}.md`, baseUrl).toString();
  const excerpt = post.excerpt.replace(/\s*\r?\n\s*/g, ' ');

  return `- ${post.date} — [${post.title}](${url}) — ${excerpt}`;
};

/** The blog index as markdown (`/blog.md`): one linked line per published post. Pure. */
export const buildBlogIndexMarkdown = (posts: readonly Post[], baseUrl: string): string => {
  if (posts.length === 0) return '# blog\n\nNo entries yet.\n';

  return `${['# blog', '', ...posts.map((post) => entryLine(post, baseUrl))].join('\n')}\n`;
};
