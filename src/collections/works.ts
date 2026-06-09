import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Works feed the archive (`/works`), the detail page (`/works/{id}`), the home
// teaser, and the log chronicle. Busting CACHE_TAGS.works purges those reads via
// the unstable_cache tags; revalidatePath('/') and ('/works') cover the ISR HTML.
const revalidateWorks = createPublishedTagRevalidateHooks([CACHE_TAGS.works]);

export const Works = {
  slug: 'works',
  labels: { singular: 'works', plural: 'works' },
  // Admin list orders by the numeric `sort` field (newest first). `sort` mirrors
  // `date`: it is auto-numbered in date order on `seed:export` (see seed/export.ts),
  // giving a stable total order even when several works share a dayOnly date.
  // Public reads keep their own explicit date sort (see lib/payload/works).
  defaultSort: '-sort',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['date', 'title', 'type', 'body', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateWorks.afterChange],
    afterDelete: [revalidateWorks.afterDelete],
  },
  fields: [
    { name: 'title', label: 'タイトル', type: 'text', required: true },
    { name: 'thumbnail', label: 'サムネイル', type: 'upload', relationTo: 'media' },
    {
      name: 'type',
      label: '種別',
      type: 'select',
      required: true,
      options: [
        { label: 'グラフィック', value: 'graphic' },
        { label: 'VJ', value: 'vj' },
        { label: 'フライヤー', value: 'flyer' },
        { label: '開発', value: 'dev' },
        { label: '映像', value: 'video' },
        { label: 'VRChat', value: 'vrchat' },
        { label: '登壇', value: 'talk' },
        { label: 'サポート', value: 'support' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'date',
      label: '制作日',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    {
      name: 'sort',
      label: '並び順',
      type: 'number',
      admin: { position: 'sidebar', description: '一覧の並び順（大きいほど上）。seed export 時に制作日順で自動採番されます。' },
    },
    {
      name: 'url',
      label: '外部リンク',
      type: 'text',
      admin: { description: '設定すると、一覧や年表のリンクが内部の詳細ページではなくこの URL を指します。' },
    },
    { name: 'description', label: '概要', type: 'textarea' },
    { name: 'body', label: '本文', type: 'richText' },
  ],
} satisfies CollectionConfig;
