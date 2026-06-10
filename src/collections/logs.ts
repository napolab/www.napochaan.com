import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagAndPathRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Manual chronicle entries merged into the /log timeline alongside the derived
// news/works/external-post entries — for milestones that none of those cover.
// There is no per-doc detail page, so revalidatePath('/') and ('/log') cover the ISR HTML.
const revalidateLogs = createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.logs], ['/', '/log']);

export const Logs = {
  slug: 'logs',
  labels: { singular: 'log', plural: 'logs' },
  defaultSort: '-date',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'meta', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateLogs.afterChange],
    afterDelete: [revalidateLogs.afterDelete],
  },
  fields: [
    { name: 'title', label: 'タイトル', type: 'text', required: true },
    {
      name: 'date',
      label: '日付',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    {
      name: 'meta',
      label: 'メタラベル',
      type: 'select',
      required: true,
      // Stored verbatim and rendered as the timeline's type label, so each
      // `value` IS the on-screen text. Existing rows hold DJ / VJ / DJ/VJ, so
      // those values must stay byte-identical; the rest are new roles.
      options: [
        { label: 'DJ', value: 'DJ' },
        { label: 'VJ', value: 'VJ' },
        { label: 'DJ/VJ', value: 'DJ/VJ' },
        { label: 'Support', value: 'Support' },
        { label: 'Dev', value: 'Dev' },
        { label: 'Flyer', value: 'Flyer' },
        { label: 'Talk', value: 'Talk' },
        { label: 'Video', value: 'Video' },
      ],
      admin: { description: '年表に表示する種別ラベル。' },
    },
    { name: 'url', label: '外部リンク', type: 'text', admin: { description: '設定するとタイトルがこの URL へのリンクになります。' } },
  ],
} satisfies CollectionConfig;
