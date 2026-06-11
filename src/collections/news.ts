import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagAndPathRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// News flows into ISR/`unstable_cache` reads tagged with CACHE_TAGS.news (the
// home teaser `/`, the archive `/news`, the chronicle `/log`, and the detail
// page `/news/{id}`). Busting the tag on publish/unpublish purges the data caches
// via the NEXT_TAG_CACHE_D1 binding; revalidatePath('/'), ('/news'), and the
// per-doc detail path cover the path-keyed ISR HTML. Drafts are skipped — only a
// published-state change reaches the public site.
const revalidateNews = createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.news], ['/', '/news'], (id) => `/news/${id}`);

export const News = {
  slug: 'news',
  labels: { singular: 'news', plural: 'news' },
  // Default to newest-first so the admin list mirrors the public order (pinned
  // items still float to the top of the public feed via the explicit
  // `['-pinned', '-publishedAt']` sort in lib/payload/news).
  defaultSort: '-publishedAt',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['pinned', 'title', 'category', 'publishedAt', '_status'],
    components: {
      // A strip above the list table that always shows every pinned item,
      // independent of the table's pagination/filtering. See the component.
      beforeListTable: ['/components/admin/news-pinned-strip#NewsPinnedStrip'],
    },
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
      // Pinned items float to the top of the public feed (home teaser + /news),
      // ahead of the default newest-first date order. Among pinned items, newest
      // date wins. See the `['-pinned', '-publishedAt']` sort in lib/payload/news.
      name: 'pinned',
      label: 'ピン留め',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'オンにすると、このお知らせを news の先頭に固定表示する。',
      },
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
        { label: 'お知らせ', value: 'notification' },
        { label: 'サポート', value: 'support' },
        { label: '登壇', value: 'talk' },
        { label: 'DJ', value: 'dj' },
        { label: 'VJ', value: 'vj' },
        { label: '制作', value: 'work' },
        { label: 'フライヤー', value: 'flyer' },
      ],
      admin: {
        position: 'sidebar',
        description: 'お知らせの活動カテゴリ。お知らせ/サポート/登壇/DJ/VJ/フライヤー/制作 から選ぶ。',
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
