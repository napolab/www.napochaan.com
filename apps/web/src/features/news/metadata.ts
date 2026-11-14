import { ogImageEntry } from '@utils/og/og-image-route';
import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { NewsItem } from './news-item';
import type { Metadata } from '@utils/seo/metadata';

// Ports of the news routes' `generateMetadata`.

const NEWS_DESCRIPTION = 'お知らせ — 制作・出演・公開のアナウンス。';
const NEWS_FEED = { url: '/news/rss.xml', title: 'napochaan — news' };

export const newsIndexMetadata: Metadata = resolveSectionMetadata({
  docTitle: 'news',
  description: NEWS_DESCRIPTION,
  path: '/news',
  feed: NEWS_FEED,
  markdown: '/news.md',
});

export const newsPageMetadata = (num: string): Metadata =>
  resolveSectionMetadata({
    docTitle: `news — page ${num}`,
    description: NEWS_DESCRIPTION,
    path: `/news/page/${num}`,
    feed: NEWS_FEED,
  });

// Next's file-convention `opengraph-image.tsx` added og:image (with type / size) on top
// of `resolveDetailMetadata`; the twitter card inherits it (see buildMetadata).
export const newsDetailMetadata = (item: NewsItem, slug: string): Metadata => {
  const metadata = resolveDetailMetadata({
    docTitle: item.title,
    path: `/news/${slug}`,
    seo: item.seo,
    body: item.body,
    genericDescription: 'お知らせ',
    defaultImage: '/og-default.png',
    markdown: `/news/${slug}.md`,
  });
  if (metadata.openGraph === undefined) return metadata;

  return { ...metadata, structuredData: { type: 'blogPosting', headline: item.title, datePublished: item.date }, openGraph: { ...metadata.openGraph, images: [ogImageEntry('news', slug)] } };
};
