import { revalidatePath } from 'next/cache';

import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
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
    afterChange: [
      () => {
        try {
          revalidatePath('/');
        } catch {
          // revalidatePath throws outside a Next request context (e.g. CLI seed). Safe to swallow.
        }
      },
    ],
    afterDelete: [
      () => {
        try {
          revalidatePath('/');
        } catch {
          // revalidatePath throws outside a Next request context (e.g. CLI seed). Safe to swallow.
        }
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
};
