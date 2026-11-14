import { ogImageEntry } from '@utils/og/og-image-route';
import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Post } from './post';
import type { Metadata } from '@utils/seo/metadata';

// Ports of the blog routes' `generateMetadata`.

const BLOG_DESCRIPTION = '記事 — プログラミング・DJ・VJ についての覚え書き。';
const BLOG_FEED = { url: '/blog/rss.xml', title: 'napochaan — blog' };

export const blogIndexMetadata: Metadata = resolveSectionMetadata({
  docTitle: 'blog',
  description: BLOG_DESCRIPTION,
  path: '/blog',
  feed: BLOG_FEED,
  markdown: '/blog.md',
});

export const blogPageMetadata = (num: string): Metadata =>
  resolveSectionMetadata({
    docTitle: `blog — page ${num}`,
    description: BLOG_DESCRIPTION,
    path: `/blog/page/${num}`,
    feed: BLOG_FEED,
  });

// Next's file-convention `opengraph-image.tsx` added og:image (with type / size) on top
// of `resolveDetailMetadata`; the twitter card inherits it (see buildMetadata).
export const blogDetailMetadata = (post: Post, slug: string): Metadata => {
  const metadata = resolveDetailMetadata({
    docTitle: post.title,
    path: `/blog/${slug}`,
    seo: post.seo,
    body: post.body,
    descriptionCandidates: [post.excerpt],
    genericDescription: '記事',
    defaultImage: '/og-default.png',
    markdown: `/blog/${slug}.md`,
  });
  if (metadata.openGraph === undefined) return metadata;

  return { ...metadata, structuredData: { type: 'blogPosting', headline: post.title, datePublished: post.date }, openGraph: { ...metadata.openGraph, images: [ogImageEntry('blog', slug)] } };
};
