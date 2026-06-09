import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Blog posts are self-authored articles (the home teaser + `/blog` + `/blog/{id}`).
// External RSS posts are NOT part of this collection — they stay in the log feed.
const revalidateBlog = createPublishedTagRevalidateHooks([CACHE_TAGS.blog]);

export const Blog = {
  slug: 'blog',
  labels: { singular: 'blog', plural: 'blogs' },
  defaultSort: '-publishedAt',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', '_status'],
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
      name: 'publishedAt',
      label: '公開日',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    {
      name: 'excerpt',
      label: '抜粋',
      type: 'textarea',
      required: true,
      admin: {
        description: '一覧・ホームのティーザー・RSS・SNS共有で表示される短い紹介文。本文の冒頭の貼り付けではなく、記事を一言で説明する独立した要約として書く。',
      },
    },
    { name: 'body', label: '本文', type: 'richText', required: true },
  ],
} satisfies CollectionConfig;
