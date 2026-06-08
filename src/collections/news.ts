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
  labels: { singular: 'お知らせ', plural: 'お知らせ' },
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
        { label: '出演', value: 'live' },
        { label: 'リリース', value: 'release' },
        { label: '更新', value: 'update' },
      ],
      admin: {
        position: 'sidebar',
        // Payload 3.81 `select` options are `{ label, value }` only — no
        // per-option description — so the three buckets are documented here.
        description: '出演: DJ/VJ 出演・イベント開催のお知らせ / リリース: フライヤー・キービジュアル・楽曲・ソフトなど制作物の公開 / 更新: サイト・プロフィール・ブログなどの更新のお知らせ',
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
