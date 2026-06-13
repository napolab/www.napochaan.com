import { dayjs } from '@utils/dayjs';

import type { Post } from '../../../app/(site)/blog/_lib/post';
import type { NewsItem } from '../../../app/(site)/news/_lib/news-item';
import type { WorkRow } from '../../../app/(site)/works/_lib/work-row';
import type { MetadataRoute } from 'next';

type BuildSitemapArgs = {
  baseUrl: string;
  news: readonly NewsItem[];
  blog: readonly Post[];
  works: readonly WorkRow[];
};

type SitemapEntry = MetadataRoute.Sitemap[number];

// Every public static page. Preview/admin/api routes are never listed here.
// The home page sorts first with the highest priority.
const STATIC_PATHS = ['', '/about', '/works', '/news', '/blog', '/log', '/gallery', '/contact', '/colophon'] as const;

// Normalizes an ISO `YYYY-MM-DD` date (Asia/Tokyo) to the `lastModified` string,
// returning undefined when the source has no date so the entry omits the field.
const toLastModified = (date?: string): string | undefined => {
  if (date === undefined) return undefined;

  return dayjs(date).tz('Asia/Tokyo').format('YYYY-MM-DD');
};

const toStaticEntry = (baseUrl: string, path: string): SitemapEntry => ({
  url: `${baseUrl}${path}`,
  changeFrequency: 'weekly',
  priority: path === '' ? 1 : 0.8,
});

const toDetailEntry = (url: string, date?: string): SitemapEntry => {
  const lastModified = toLastModified(date);
  if (lastModified === undefined) {
    return { url, changeFrequency: 'monthly', priority: 0.6 };
  }

  return { url, lastModified, changeFrequency: 'monthly', priority: 0.6 };
};

export const buildSitemap = ({ baseUrl, news, blog, works }: BuildSitemapArgs): MetadataRoute.Sitemap => {
  const staticEntries = STATIC_PATHS.map((path) => toStaticEntry(baseUrl, path));
  const newsEntries = news.map((item) => toDetailEntry(`${baseUrl}/news/${item.slug}`, item.date));
  const blogEntries = blog.map((post) => toDetailEntry(`${baseUrl}/blog/${post.slug}`, post.date));
  const worksEntries = works.map((work) => toDetailEntry(`${baseUrl}/works/${work.slug}`, work.date));

  return [...staticEntries, ...newsEntries, ...blogEntries, ...worksEntries];
};
