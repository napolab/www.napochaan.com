import type { WorkRow } from '../work-row';

const entryLine = (work: WorkRow, baseUrl: string): string => {
  const url = new URL(`/works/${work.slug}.md`, baseUrl).toString();

  return `- [${work.title}](${url}) — ${work.type} · ${work.year}`;
};

/** The works index as markdown (`/works.md`). Pure. */
export const buildWorksIndexMarkdown = (works: readonly WorkRow[], baseUrl: string): string => {
  if (works.length === 0) return '# works\n\nNo entries yet.\n';

  return `${['# works', '', ...works.map((work) => entryLine(work, baseUrl))].join('\n')}\n`;
};
