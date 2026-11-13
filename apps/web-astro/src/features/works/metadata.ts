import { ogImageEntry } from '@utils/og/og-image-route';
import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { WorkRow } from './work-row';
import type { Metadata } from '@utils/seo/metadata';

// Ports of the works routes' `generateMetadata`.

const WORKS_DESCRIPTION = '制作物のアーカイブ — 開発・VRChat・映像・グラフィック。';
const WORKS_FEED = { url: '/works/rss.xml', title: 'napochaan — works' };

export const worksIndexMetadata: Metadata = resolveSectionMetadata({
  docTitle: 'works',
  description: WORKS_DESCRIPTION,
  path: '/works',
  feed: WORKS_FEED,
  markdown: '/works.md',
});

export const worksPageMetadata = (num: string): Metadata =>
  resolveSectionMetadata({
    docTitle: `works — page ${num}`,
    description: WORKS_DESCRIPTION,
    path: `/works/page/${num}`,
    feed: WORKS_FEED,
  });

// Next's file-convention `opengraph-image.tsx` added og:image (with type / size) on top
// of `resolveDetailMetadata`; the twitter card inherits it (see buildMetadata).
export const workDetailMetadata = (work: WorkRow, slug: string): Metadata => {
  const metadata = resolveDetailMetadata({
    docTitle: work.title,
    path: `/works/${slug}`,
    seo: work.seo,
    body: work.body,
    descriptionCandidates: [work.description],
    imageCandidates: [work.thumbnail?.src],
    genericDescription: 'works',
    defaultImage: '/og-default.png',
    markdown: `/works/${slug}.md`,
  });
  if (metadata.openGraph === undefined) return metadata;

  return { ...metadata, openGraph: { ...metadata.openGraph, images: [ogImageEntry('works', slug)] } };
};
