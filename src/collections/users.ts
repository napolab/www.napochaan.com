import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    read: ({ req: { user } }) => user !== null,
    create: async ({ req }) => {
      // Allow the very first user to be created without auth (bootstrap),
      // then require an authenticated user for any subsequent creation.
      if (req.user !== null) return true;
      const { totalDocs } = await req.payload.count({ collection: 'users' });
      return totalDocs === 0;
    },
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
    admin: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Display name for this user.',
      },
    },
  ],
};
