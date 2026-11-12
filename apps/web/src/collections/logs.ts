import { CACHE_TAGS } from '@utils/cache-tags';

import { LOG_META_OPTIONS } from './fields/log-meta';
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
    group: 'コンテンツ',
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
      // 正準値は ./fields/log-meta。MCP の create_log / update_log も同じ配列から
      // z.enum を組む。ここで導出しているのでリテラルの二重管理は発生しない。
      options: LOG_META_OPTIONS.map((value) => ({ label: value, value })),
      admin: { description: '年表に表示する種別ラベル。' },
    },
    { name: 'url', label: '外部リンク', type: 'text', admin: { description: '設定するとタイトルがこの URL へのリンクになります。' } },
  ],
} satisfies CollectionConfig;
