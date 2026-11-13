import type { Sitemap, SitemapEntry } from '../types';

// Port of Next's `resolveSitemap` (next/dist/build/webpack/loaders/metadata/
// resolve-route-data.js), limited to the fields of our `SitemapEntry` (no alternates,
// images or videos), so /sitemap.xml keeps the exact bytes the Next `sitemap.ts`
// metadata route served. Like Next, values are not XML-escaped.
const serializeEntry = (entry: SitemapEntry): string => {
  const lines = [
    `<loc>${entry.url}</loc>`,
    entry.lastModified === undefined || entry.lastModified === '' ? undefined : `<lastmod>${entry.lastModified}</lastmod>`,
    entry.changeFrequency === undefined ? undefined : `<changefreq>${entry.changeFrequency}</changefreq>`,
    entry.priority === undefined ? undefined : `<priority>${entry.priority}</priority>`,
  ].filter((line) => line !== undefined);

  return `<url>\n${lines.map((line) => `${line}\n`).join('')}</url>\n`;
};

export const serializeSitemap = (sitemap: Sitemap): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(serializeEntry).join('')}</urlset>\n`;
