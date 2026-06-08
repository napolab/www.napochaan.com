import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Blog posts are self-authored articles (the home teaser + `/blog` + `/blog/{id}`).
// External RSS posts are NOT part of this collection — they stay in the log feed.
const revalidateBlog = createPublishedTagRevalidateHooks([CACHE_TAGS.blog]);

export const Blog = {
  slug: 'blog',
  labels: { singular: 'ブログ', plural: 'ブログ' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'source', 'publishedAt', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateBlog.afterChange],
    afterDelete: [revalidateBlog.afterDelete],
  },
  fields: [
    { name: 'title', label: 'タイトル', type: 'text', required: true },
    {
      name: 'source',
      label: 'クロス投稿先',
      type: 'select',
      required: true,
      options: [
        { label: 'Zenn', value: 'zenn' },
        { label: 'しずかなインターネット', value: 'sizu' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      label: '公開日',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    { name: 'excerpt', label: '抜粋', type: 'textarea', required: true },
    { name: 'body', label: '本文', type: 'richText', required: true },
  ],
} satisfies CollectionConfig;
