import type { Profile } from '../../../app/(site)/about/_lib/profile';
import type { Post } from '../../../app/(site)/blog/_lib/post';
import type { NewsItem } from '../../../app/(site)/news/_lib/news-item';
import type { WorkRow } from '../../../app/(site)/works/_lib/work-row';

type BuildLLMsTxtArgs = {
  baseUrl: string;
  news: readonly NewsItem[];
  blog: readonly Post[];
  works: readonly WorkRow[];
  profile?: Profile;
};

const FALLBACK_SUMMARY = 'napochaan のポートフォリオサイト — 制作・出演・公開のアーカイブ。';
const LATEST_LIMIT = 10;

const summaryFor = (profile?: Profile): string => {
  if (profile === undefined) return FALLBACK_SUMMARY;
  if (profile.tagline === '') return FALLBACK_SUMMARY;

  return profile.tagline;
};

// One markdown bullet: `- [title](url): note` — the note is omitted when empty.
const bulletLink = (title: string, url: string, note?: string): string => {
  if (note === undefined || note === '') return `- [${title}](${url})`;

  return `- [${title}](${url}): ${note}`;
};

const aboutSection = (baseUrl: string, profile?: Profile): string => {
  const note = profile === undefined ? undefined : `${profile.now} / ${profile.team}`;

  return ['## About', bulletLink('about napochaan', `${baseUrl}/about`, note)].join('\n');
};

const linkSection = (heading: string, lines: readonly string[]): string => [`## ${heading}`, ...lines].join('\n');

const feedsSection = (baseUrl: string): string =>
  linkSection('Feeds', [
    bulletLink('news feed', `${baseUrl}/news/rss.xml`, 'RSS'),
    bulletLink('blog feed', `${baseUrl}/blog/rss.xml`, 'RSS'),
    bulletLink('works feed', `${baseUrl}/works/rss.xml`, 'RSS'),
  ]);

export const buildLLMsTxt = ({ baseUrl, news, blog, works, profile }: BuildLLMsTxtArgs): string => {
  const newsLines = news.slice(0, LATEST_LIMIT).map((item) => bulletLink(item.title, `${baseUrl}/news/${item.slug}`, `${item.date} · ${item.category}`));
  const blogLines = blog.slice(0, LATEST_LIMIT).map((post) => bulletLink(post.title, `${baseUrl}/blog/${post.slug}`, post.excerpt));
  const worksLines = works.slice(0, LATEST_LIMIT).map((work) => bulletLink(work.title, `${baseUrl}/works/${work.slug}`, `${work.type} · ${work.year}`));

  const sections = [
    '# napochaan',
    `> ${summaryFor(profile)}`,
    aboutSection(baseUrl, profile),
    linkSection('Works', worksLines),
    linkSection('News', newsLines),
    linkSection('Blog', blogLines),
    feedsSection(baseUrl),
  ];

  return `${sections.join('\n\n')}\n`;
};
