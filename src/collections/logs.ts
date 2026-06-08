import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Manual chronicle entries merged into the /log timeline alongside the derived
// news/works/external-post entries — for milestones that none of those cover.
const revalidateLogs = createPublishedTagRevalidateHooks([CACHE_TAGS.logs]);

export const Logs = {
  slug: 'logs',
  labels: { singular: '年表エントリ', plural: '年表エントリ' },
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
    { name: 'meta', label: 'メタラベル', type: 'text', required: true, admin: { description: "年表に表示する種別ラベル（例: 'milestone'）。" } },
    { name: 'url', label: '外部リンク', type: 'text', admin: { description: '設定するとタイトルがこの URL へのリンクになります。' } },
  ],
} satisfies CollectionConfig;
