import { extractPlainText } from '../../../app/(site)/news/rss.xml/extract-plain-text';

import type { Profile } from '../../../app/(site)/about/_lib/profile';
import type { Post } from '../../../app/(site)/blog/_lib/post';
import type { NewsItem } from '../../../app/(site)/news/_lib/news-item';
import type { WorkRow } from '../../../app/(site)/works/_lib/work-row';

type BuildLLMsFullTxtArgs = {
  baseUrl: string;
  news: readonly NewsItem[];
  blog: readonly Post[];
  works: readonly WorkRow[];
  profile?: Profile;
};

const FALLBACK_SUMMARY = 'napochaan のポートフォリオサイト — 制作・出演・公開のアーカイブ。';

const summaryFor = (profile?: Profile): string => {
  if (profile === undefined) return FALLBACK_SUMMARY;
  if (profile.tagline === '') return FALLBACK_SUMMARY;

  return profile.tagline;
};

const aboutSection = (profile?: Profile): string => {
  if (profile === undefined) return '## About\n\nProfile is unavailable.';

  // Coerce the optional lexical bodies at the boundary, then drop empty blocks.
  const blocks = ['## About', `**${profile.name}** (${profile.aka})`, `Now: ${profile.now} / Team: ${profile.team}`];
  const bio = extractPlainText(profile.bio ?? undefined);
  const philosophy = extractPlainText(profile.philosophy ?? undefined);
  const extra = [bio, philosophy].filter((value) => value !== '');

  return [...blocks, ...extra].join('\n\n');
};

const newsEntry = (baseUrl: string, item: NewsItem): string => {
  const url = `${baseUrl}/news/${item.id}`;
  const body = extractPlainText(item.body ?? undefined);
  const lines = [`### ${item.title}`, `${item.date} · ${item.category} · ${url}`];
  if (body === '') return lines.join('\n');

  return [...lines, '', body].join('\n');
};

const blogEntry = (baseUrl: string, post: Post): string => {
  const url = `${baseUrl}/blog/${post.id}`;
  const body = extractPlainText(post.body ?? undefined);
  const lines = [`### ${post.title}`, `${post.date} · ${url}`, '', post.excerpt];
  if (body === '') return lines.join('\n');

  return [...lines, '', body].join('\n');
};

const workEntry = (baseUrl: string, work: WorkRow): string => {
  const url = `${baseUrl}/works/${work.id}`;

  return [`### ${work.title}`, `${work.type} · ${work.year} · ${url}`].join('\n');
};

const listSection = (heading: string, entries: readonly string[]): string => {
  if (entries.length === 0) return `## ${heading}\n\nNo entries yet.`;

  return [`## ${heading}`, ...entries].join('\n\n');
};

export const buildLLMsFullTxt = ({ baseUrl, news, blog, works, profile }: BuildLLMsFullTxtArgs): string => {
  const sections = [
    '# napochaan',
    `> ${summaryFor(profile)}`,
    aboutSection(profile),
    listSection(
      'Works',
      works.map((work) => workEntry(baseUrl, work)),
    ),
    listSection(
      'News',
      news.map((item) => newsEntry(baseUrl, item)),
    ),
    listSection(
      'Blog',
      blog.map((post) => blogEntry(baseUrl, post)),
    ),
  ];

  return `${sections.join('\n\n')}\n`;
};
