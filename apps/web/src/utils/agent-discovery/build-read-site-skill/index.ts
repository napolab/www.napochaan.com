// The one Agent Skill this site publishes: how an agent should read napochaan.com. Served
// at `/.well-known/agent-skills/read-napochaan-com/SKILL.md`; the discovery index carries
// the SHA-256 of these exact bytes. agentskills.io frontmatter (`name`, `description`).
//
// The lists mirror the routes under src/pages (`*.md.ts` twins, `*/rss.xml.ts` feeds);
// build-read-site-skill.test.ts fails when a route is added or removed without them.

import { DISCOVERY_PATHS, MCP_ENDPOINT } from '@utils/agent-discovery/facts';

type BuildReadSiteSkillArgs = { baseUrl: string };

// Plain YAML scalars: the description must not contain `: ` or start with a quote.
export const READ_SITE_SKILL = {
  name: 'read-napochaan-com',
  description:
    'Read napochaan.com as an agent through llms.txt, Markdown representations of its pages, the sitemap and RSS feeds. Use when you need the blog posts, news, works, log entries or profile of napochaan.',
} as const;

export const MARKDOWN_TWINS = ['/about.md', '/blog.md', '/blog/<slug>.md', '/news.md', '/news/<slug>.md', '/works.md', '/works/<slug>.md', '/log.md', '/privacy.md'] as const;

export const FEEDS = ['blog', 'news', 'works', 'gallery', 'log'] as const;

const frontmatter = (): string[] => ['---', `name: ${READ_SITE_SKILL.name}`, `description: ${READ_SITE_SKILL.description}`, '---'];

const overview = (): string[] => [
  '# Reading napochaan.com',
  '',
  'napochaan.com is the portfolio of napochaan: works, blog posts, news, an activity log and a gallery. Most content is in Japanese. Everything described here is public and needs no authentication.',
];

const startHere = (baseUrl: string): string[] => [
  '## Start here',
  '',
  `1. ${baseUrl}${DISCOVERY_PATHS.llmsTxt} — overview of the site with links to the latest entries.`,
  `2. ${baseUrl}${DISCOVERY_PATHS.llmsFullTxt} — the same overview plus the profile and the plain-text body of every blog post, news item and work.`,
  `3. ${baseUrl}${DISCOVERY_PATHS.sitemap} — every canonical page URL.`,
];

const markdown = (baseUrl: string): string[] => [
  '## Markdown instead of HTML',
  '',
  '- Send `Accept: text/markdown` to any page URL to get Markdown at the same URL (the home page answers with llms.txt). Pages without a Markdown version (gallery, contact, colophon, paginated lists) answer with HTML.',
  '- Or fetch a Markdown version directly:',
  ...MARKDOWN_TWINS.map((path) => `  - ${baseUrl}${path}`),
  '- `<slug>` is the last path segment of the HTML page, e.g. `/blog/<slug>` → `/blog/<slug>.md`.',
];

const feeds = (baseUrl: string): string[] => ['## Feeds (RSS 2.0)', '', ...FEEDS.map((feed) => `- ${baseUrl}/${feed}/rss.xml`)];

const machineReadable = (baseUrl: string): string[] => [
  '## Machine-readable discovery',
  '',
  `- ARD manifest / AI Catalog: ${baseUrl}${DISCOVERY_PATHS.ard} (also at ${baseUrl}${DISCOVERY_PATHS.aiCatalog})`,
  `- API Catalog: ${baseUrl}${DISCOVERY_PATHS.apiCatalog}`,
  `- MCP Server Card: ${baseUrl}${DISCOVERY_PATHS.mcpServerCard}`,
];

const writing = (baseUrl: string): string[] => [
  '## Writing is owner-only',
  '',
  `The MCP server at ${MCP_ENDPOINT} drafts and publishes site content. It is owner-only: only the site owner can sign in, so do not try to register or authenticate for it on someone else's behalf. Details: ${baseUrl}${DISCOVERY_PATHS.authMarkdown}`,
];

export const buildReadSiteSkill = ({ baseUrl }: BuildReadSiteSkillArgs): string =>
  [frontmatter(), overview(), startHere(baseUrl), markdown(baseUrl), feeds(baseUrl), machineReadable(baseUrl), writing(baseUrl)]
    .map((section) => section.join('\n'))
    .join('\n\n')
    .concat('\n');
