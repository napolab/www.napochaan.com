import { CACHE_TAGS } from '@utils/cache-tags';

import { slugField } from './fields/slug';
import { createPublishedTagAndPathRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// ソフトウェア販売に伴う利用規約・免責事項。外部の販売ページから直リンクされる前提で、
// 安定した公開 URL `/legal/{slug}` を持つ。CACHE_TAGS.legalDocuments を落とすとローダーの
// キャッシュが、revalidatePath が path 固定の ISR HTML が飛ぶ。
// 一覧ページは持たないので静的 path の配列は空。
const revalidateLegalDocuments = createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.legalDocuments], [], (slug) => `/legal/${slug}`);

export const LegalDocuments = {
  slug: 'legal-documents',
  labels: { singular: '法務文書', plural: '法務文書' },
  admin: {
    group: 'コンテンツ',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'effectiveAt', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  // autosave は付けない。法務文書は書きながら見た目を確認するものではなく、下書きで改訂を
  // 用意して施行日に publish する運用のため、素の drafts で足りる。
  versions: { drafts: true },
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
  ],
} satisfies CollectionConfig;
