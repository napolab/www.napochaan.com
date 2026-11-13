import type { LogEntry, LogYearGroup } from '../build-log-timeline';

const resolveHref = (href: string | undefined, baseUrl: string): string | undefined => {
  if (href === undefined) return undefined;

  return href.startsWith('/') ? new URL(href, baseUrl).toString() : href;
};

const entryLine = (entry: LogEntry, baseUrl: string): string => {
  const href = resolveHref(entry.href, baseUrl);
  const title = href === undefined ? entry.title : `[${entry.title}](${href})`;

  return `- ${entry.date} — ${title} (${entry.meta})`;
};

const yearSection = (group: LogYearGroup, baseUrl: string): string => [`## ${group.year}`, '', ...group.items.map((entry) => entryLine(entry, baseUrl))].join('\n');

/** The activity chronicle as markdown (`/log.md`). Pure. */
export const buildLogMarkdown = (groups: readonly LogYearGroup[], baseUrl: string): string => {
  if (groups.length === 0) return '# log\n\nNo entries yet.\n';

  return `${['# log', '', groups.map((group) => yearSection(group, baseUrl)).join('\n\n')].join('\n')}\n`;
};
