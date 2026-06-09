import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// News flows into ISR/`unstable_cache` reads tagged with CACHE_TAGS.news (the
// home teaser `/`, the archive `/news`, the chronicle `/log`, and the detail
// page `/news/{id}`). Busting the tag on publish/unpublish purges those route +
// data caches via the NEXT_TAG_CACHE_D1 binding. Drafts are skipped — only a
// published-state change reaches the public site.
const revalidateNews = createPublishedTagRevalidateHooks([CACHE_TAGS.news]);

export const News = {
  slug: 'news',
  labels: { singular: 'news', plural: 'news' },
  // Drag-and-drop reordering in the admin list view (Payload stores a hidden
  // fractional-index `_order` and sorts by it by default). Public reads keep their
  // own explicit publishedAt sort (see lib/payload/news), so only the admin order is manual.
  orderable: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
  },
  access: {
    // Logged-in admins see everything (drafts included); the public site only
    // sees published documents. Local API calls default to overrideAccess:true,
    // so query helpers must still filter `_status` explicitly.
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  // Autosave streams draft edits as you type, so the server-side Live Preview
  // route (RefreshRouteOnSave) can refetch the latest draft and refresh in real time.
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateNews.afterChange],
    afterDelete: [revalidateNews.afterDelete],
  },
  fields: [
    {
      name: 'title',
      label: 'タイトル',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedAt',
      label: '公開日',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' },
      },
    },
    {
      name: 'category',
      label: 'カテゴリ',
      type: 'select',
      required: true,
      options: [
        { label: 'サポート', value: 'support' },
        { label: '登壇', value: 'talk' },
        { label: 'DJ', value: 'dj' },
        { label: 'VJ', value: 'vj' },
        { label: '制作', value: 'work' },
        { label: 'フライヤー', value: 'flyer' },
      ],
      admin: {
        position: 'sidebar',
        description: 'お知らせの活動カテゴリ。サポート/登壇/DJ/VJ/フライヤー/制作 から選ぶ。',
      },
    },
    {
      name: 'url',
      label: '外部リンク',
      type: 'text',
      admin: {
        description: '設定すると、年表などのリンクが内部の詳細ページではなくこの URL を指します。',
      },
    },
    {
      name: 'body',
      label: '本文',
      type: 'richText',
    },
  ],
} satisfies CollectionConfig;
