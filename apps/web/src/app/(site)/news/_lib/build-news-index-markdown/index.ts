import { isExternalNews } from '../is-external-news';

import type { NewsItem } from '../news-item';

// External items point straight at their off-site url (their detail route 404s);
// internal ones link to the `.md` detail. Mirrors the HTML index's link policy.
const entryLine = (item: NewsItem, baseUrl: string): string => {
  const href = isExternalNews(item) ? (item.url ?? '') : new URL(`/news/${item.slug}.md`, baseUrl).toString();

  return `- ${item.date} — [${item.title}](${href}) (${item.category})`;
};

/** The news index as markdown (`/news.md`). Pure. */
export const buildNewsIndexMarkdown = (items: readonly NewsItem[], baseUrl: string): string => {
  if (items.length === 0) return '# news\n\nNo entries yet.\n';

  return `${['# news', '', ...items.map((item) => entryLine(item, baseUrl))].join('\n')}\n`;
};
