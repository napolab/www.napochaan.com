import { CACHE_TAGS } from '@utils/cache-tags';

import { slugField } from './fields/slug';
import { createPublishedTagAndPathRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Software products. Embedded in blog bodies via the `software-download` block and
// surfaced at `/software/{slug}`. A product is the stable identity; its binaries
// live in the `software-release` collection. Busting CACHE_TAGS.software purges the
// loader reads; revalidatePath of the detail page covers the path-keyed ISR HTML.
// Blog detail pages that embed a software block are revalidated separately (see the
// software-release hook / Task 15).
const revalidateSoftware = createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.software], [], (slug) => `/software/${slug}`);

export const Software = {
  slug: 'software',
  labels: { singular: 'ソフトウェア', plural: 'ソフトウェア' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateSoftware.afterChange],
    afterDelete: [revalidateSoftware.afterDelete],
  },
  fields: [
    slugField(),
    { name: 'name', label: '名称', type: 'text', required: true },
    {
      name: 'summary',
      label: '概要',
      type: 'textarea',
      required: true,
      admin: { description: '一覧やダウンロードブロックの見出し下、詳細ページ、OG に表示される短い説明。' },
    },
    {
      name: 'terms',
      label: '利用規約',
      type: 'richText',
      required: true,
      admin: { description: 'ダウンロード時のダイアログ内にスクロール表示される利用規約。' },
    },
  ],
} satisfies CollectionConfig;
