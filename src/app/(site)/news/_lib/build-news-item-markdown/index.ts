import { lexicalToMarkdown } from '@utils/lexical/to-markdown';
import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { NewsItem } from '../news-item';

/** One news item as a standalone markdown document (`/news/{slug}.md`). Pure. */
export const buildNewsItemMarkdown = (item: NewsItem, baseUrl: string): string => {
  const url = new URL(`/news/${item.slug}`, baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: item.title, date: item.date, category: item.category, url });
  const body = lexicalToMarkdown(item.body, { baseUrl });
  const sections = body === '' ? [frontmatter, `# ${item.title}`] : [frontmatter, `# ${item.title}`, body];

  return `${sections.join('\n\n')}\n`;
};
