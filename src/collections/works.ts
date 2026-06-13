import { CACHE_TAGS } from '@utils/cache-tags';

import { slugField } from './fields/slug';
import { createPublishedTagAndPathRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Works feed the archive (`/works`), the detail page (`/works/{id}`), the home
// teaser, and the log chronicle. Busting CACHE_TAGS.works purges those reads via
// the unstable_cache tags; revalidatePath('/'), ('/works'), ('/log'), and the
// per-doc detail path cover the path-keyed ISR HTML.
const revalidateWorks = createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.works], ['/', '/works', '/log'], (slug) => `/works/${slug}`);

export const Works = {
  slug: 'works',
  labels: { singular: 'works', plural: 'works' },
  // Admin list orders by `date`, newest first. Public reads keep their own
  // explicit date sort (see lib/payload/works).
  defaultSort: '-date',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['date', 'thumbnail', 'title', 'type', 'body', '_status'],
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
    slugField(),
    { name: 'title', label: 'タイトル', type: 'text', required: true },
    { name: 'thumbnail', label: 'サムネイル', type: 'upload', relationTo: 'media' },
    {
      name: 'type',
      label: '種別',
      type: 'select',
      required: true,
      options: [
        { label: '制作', value: 'production' },
        { label: '登壇', value: 'talk' },
        { label: '制作協力', value: 'support' },
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
    { name: 'description', label: '概要', type: 'textarea' },
    { name: 'body', label: '本文', type: 'richText' },
  ],
} satisfies CollectionConfig;
