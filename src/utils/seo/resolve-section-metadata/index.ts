import type { Metadata } from 'next';

type Feed = {
  url: string;
  title: string;
};

export type ResolveSectionMetadataArgs = {
  // Bare document title; the root `%s — napochaan` template appends the suffix.
  docTitle: string;
  description?: string;
  // Canonical path, reused as the relative og:url (resolved via metadataBase).
  path: string;
  // Optional RSS feed surfaced via alternates.types.
  feed?: Feed;
  // Site default og:image (defaults to the shared OG card). Same bytes as the
  // file-convention opengraph-image.png.
  image?: string;
};

const SUFFIX = ' — napochaan';
const SITE_NAME = 'napochaan';
const DEFAULT_IMAGE = '/og-default.png';

const buildAlternates = (path: string, feed?: Feed): Metadata['alternates'] => {
  if (feed === undefined) return { canonical: path };

  return {
    canonical: path,
    types: { 'application/rss+xml': [{ url: feed.url, title: feed.title }] },
  };
};

// Builds the full `Metadata` for a section/index page (about, works, news, blog,
// log): a page-specific title + description over the shared site-wide Open Graph /
// Twitter card. Unlike detail pages (resolve-detail-metadata) there is no per-record
// content, so the OG image is always the site default card. Pure.
export const resolveSectionMetadata = (args: ResolveSectionMetadataArgs): Metadata => {
  const displayTitle = `${args.docTitle}${SUFFIX}`;
  const image = args.image ?? DEFAULT_IMAGE;

  return {
    title: args.docTitle,
    description: args.description,
    alternates: buildAlternates(args.path, args.feed),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'ja_JP',
      url: args.path,
      title: displayTitle,
      description: args.description,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: args.description,
      images: [image],
    },
  };
};
