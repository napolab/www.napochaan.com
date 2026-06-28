import { revalidateTagsAndPaths } from './hooks/revalidate';
import { CACHE_TAGS } from '@utils/cache-tags';

import type { CollectionConfig } from 'payload';

// Media is referenced by news SEO images, works thumbnails, and gallery images.
// Bust all dependent caches whenever a media document is changed or deleted.
const revalidateMedia = (): void => revalidateTagsAndPaths([CACHE_TAGS.news, CACHE_TAGS.works, CACHE_TAGS.gallery], ['/', '/news', '/works', '/gallery']);

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'media', plural: 'media' },
  admin: {
    group: 'システム',
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  hooks: {
    afterChange: [revalidateMedia],
    afterDelete: [revalidateMedia],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
};
