import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Works feed the archive (`/works`), the detail page (`/works/{id}`), the home
// teaser, and the log chronicle. Busting CACHE_TAGS.works purges those reads via
// the unstable_cache tags; revalidatePath('/') and ('/works') cover the ISR HTML.
const revalidateWorks = createPublishedTagRevalidateHooks([CACHE_TAGS.works]);

export const Works = {
  slug: 'works',
  labels: { singular: '作品', plural: '作品' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'date', '_status'],
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
    {
      name: 'no',
      label: '表示番号',
      type: 'text',
      admin: { description: "'01' のような表示用の連番。未設定なら一覧の並び順から自動採番されます。" },
    },
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
      name: 'url',
      label: '外部リンク',
      type: 'text',
      admin: { description: '設定すると、一覧や年表のリンクが内部の詳細ページではなくこの URL を指します。' },
    },
    { name: 'thumbnail', label: 'サムネイル', type: 'upload', relationTo: 'media' },
    { name: 'description', label: '概要', type: 'textarea' },
    { name: 'body', label: '本文', type: 'richText' },
  ],
} satisfies CollectionConfig;
