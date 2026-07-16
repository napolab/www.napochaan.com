import { lexicalToMarkdown } from '@utils/lexical/to-markdown';
import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { WorkRow } from '../work-row';

/** One work as a standalone markdown document (`/works/{slug}.md`). Pure. */
export const buildWorkMarkdown = (work: WorkRow, baseUrl: string): string => {
  const url = new URL(`/works/${work.slug}`, baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: work.title, type: work.type, year: work.year, date: work.date, url });
  const body = lexicalToMarkdown(work.body, { baseUrl });
  const sections = [frontmatter, `# ${work.title}`, work.description, body === '' ? undefined : body].filter((section): section is string => section !== undefined && section !== '');

  return `${sections.join('\n\n')}\n`;
};
