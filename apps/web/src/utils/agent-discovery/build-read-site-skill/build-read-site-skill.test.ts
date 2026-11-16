import { readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildReadSiteSkill, FEEDS, MARKDOWN_TWINS, READ_SITE_SKILL } from './index';

const skill = buildReadSiteSkill({ baseUrl: 'https://napochaan.com' });

const PAGES_DIR = path.resolve(import.meta.dirname, '../../../pages');

// Route files under src/pages, as forward-slash paths relative to it (dot directories included).
const routeFiles = (): string[] => readdirSync(PAGES_DIR, { recursive: true, encoding: 'utf8' }).map((file) => file.replaceAll('\\', '/'));

describe('route lists mirrored in the skill', () => {
  // `blog/[slug].md.ts` is served at `/blog/<slug>.md`. auth.md is not a page twin.
  it('lists exactly the Markdown twins that have a route', () => {
    const twins = routeFiles()
      .filter((file) => file.endsWith('.md.ts') && !file.startsWith('.well-known/') && file !== 'auth.md.ts')
      .map((file) => `/${file.replace(/\.ts$/, '').replace('[slug]', '<slug>')}`);
    expect([...MARKDOWN_TWINS].sort()).toEqual(twins.sort());
  });

  it('lists exactly the RSS feeds that have a route', () => {
    const feeds = routeFiles()
      .filter((file) => file.endsWith('/rss.xml.ts'))
      .map((file) => file.replace('/rss.xml.ts', ''));
    expect([...FEEDS].sort()).toEqual(feeds.sort());
  });
});

describe('buildReadSiteSkill', () => {
  it('names the skill in agentskills.io terms (lowercase alphanumerics and hyphens)', () => {
    expect(READ_SITE_SKILL.name).toBe('read-napochaan-com');
    expect(READ_SITE_SKILL.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(READ_SITE_SKILL.description.length).toBeGreaterThan(0);
    expect(READ_SITE_SKILL.description.length).toBeLessThanOrEqual(1024);
  });

  it('opens with frontmatter carrying the same name and description', () => {
    expect(skill.startsWith(`---\nname: ${READ_SITE_SKILL.name}\ndescription: ${READ_SITE_SKILL.description}\n---\n`)).toBe(true);
  });

  it('points at llms.txt, llms-full.txt, the sitemap and the AI Catalog', () => {
    for (const url of ['https://napochaan.com/llms.txt', 'https://napochaan.com/llms-full.txt', 'https://napochaan.com/sitemap.xml', 'https://napochaan.com/.well-known/ard.json']) {
      expect(skill).toContain(url);
    }
  });

  it('explains Accept: text/markdown negotiation and the .md twins that exist', () => {
    expect(skill).toContain('Accept: text/markdown');
    for (const path of ['/about.md', '/blog.md', '/news.md', '/works.md', '/log.md', '/privacy.md', '/blog/<slug>.md', '/news/<slug>.md', '/works/<slug>.md']) {
      expect(skill).toContain(path);
    }
  });

  it('lists the RSS feeds that exist', () => {
    for (const feed of ['blog', 'news', 'works', 'gallery', 'log']) {
      expect(skill).toContain(`https://napochaan.com/${feed}/rss.xml`);
    }
  });

  it('says the MCP server is owner-only and points at auth.md', () => {
    expect(skill).toMatch(/owner-only/i);
    expect(skill).toContain('https://napochaan.com/auth.md');
  });

  it('ends with a single newline', () => {
    expect(skill.endsWith('\n')).toBe(true);
    expect(skill.endsWith('\n\n')).toBe(false);
  });
});
