import type { MetadataInput } from '@components/seo/build-metadata';

// Port of the gallery page `metadata`: only the feed alternate. Next merged it over the
// root, so the root title / description / card apply and no canonical is emitted.
export const galleryMetadata: MetadataInput = {
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/gallery/rss.xml', title: 'napochaan — gallery' }],
    },
  },
};
