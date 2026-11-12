import { purgeOnChange } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Media is referenced by news SEO images, works thumbnails, gallery images, and
// blog thumbnails/bodies, so any change purges the whole Workers Cache.
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
    afterChange: [purgeOnChange],
    afterDelete: [purgeOnChange],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
};
