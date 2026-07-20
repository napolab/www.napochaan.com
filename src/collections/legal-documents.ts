import { CACHE_TAGS } from '@utils/cache-tags';

import { slugField } from './fields/slug';
import { createPublishedTagAndPathRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// ソフトウェア販売に伴う利用規約・免責事項。外部の販売ページから直リンクされる前提で、
// 安定した公開 URL `/legal/{slug}` を持つ。CACHE_TAGS.legalDocuments を落とすとローダーの
// キャッシュが飛び、revalidatePath が path 固定の ISR HTML を飛ばす。
// 一覧ページは持たないので静的 path の配列は空。
const revalidateLegalDocuments = createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.legalDocuments], [], (slug) => `/legal/${slug}`);

export const LegalDocuments = {
  slug: 'legal-documents',
  labels: { singular: '法務文書', plural: '法務文書' },
  admin: {
    group: '法務',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'effectiveAt', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  // Live Preview を real time 反映させるため autosave を有効化(news/works/blog と同じ)。
  // draft edits をストリームし、preview ルートの RefreshRouteOnSave が最新 draft を再取得する。
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateLegalDocuments.afterChange],
    afterDelete: [revalidateLegalDocuments.afterDelete],
  },
  fields: [
    slugField(),
    {
      name: 'title',
      label: 'タイトル',
      type: 'text',
      required: true,
    },
    {
      // publish 日とは別物。「11/10 に文面を直したが施行は 12/1」が普通に起きるので
      // createdAt/updatedAt を流用せず独立したフィールドとして持つ。
      name: 'effectiveAt',
      label: '施行日',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' },
        description: 'この文書が効力を持つ日。公開ページの末尾に「YYYY年M月D日 施行」として表示される。',
      },
    },
    {
      name: 'body',
      label: '本文',
      type: 'richText',
      required: true,
    },
    {
      // 編集中の slug から公開 URL(/legal/{slug})をサイドバーにリンク表示する UI フィールド。
      // 販売ページに貼る URL をここからコピーできる。スキーマには載らない(type: 'ui')。
      name: 'publicURL',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/admin/legal-public-url#LegalPublicURLField',
        },
      },
    },
  ],
} satisfies CollectionConfig;
