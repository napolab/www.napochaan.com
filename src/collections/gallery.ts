import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagAndPathRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Gallery photos feed `/gallery` (skyline masonry) and the home teaser. The image
// is a media upload; width/height/alt come from the media record. There is no per-doc
// detail page, so revalidatePath('/') and ('/gallery') cover the ISR HTML.
const revalidateGallery = createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.gallery], ['/', '/gallery']);

export const Gallery = {
  slug: 'gallery',
  labels: { singular: 'gallery', plural: 'gallery' },
  // Drag-and-drop reordering in the admin list view. Payload stores the order in a
  // hidden fractional-index `_order` field and sorts by it by default, so the old
  // manual `order` number field is gone — drag the rows to reorder.
  orderable: true,
  admin: {
    useAsTitle: 'caption',
    defaultColumns: ['caption', 'homeTop', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateGallery.afterChange],
    afterDelete: [revalidateGallery.afterDelete],
  },
  fields: [
    { name: 'image', label: '画像', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', label: 'キャプション', type: 'text', admin: { description: "'flyer / 05.23' のような短い表示ラベル。" } },
    { name: 'alt', label: '代替テキスト（上書き）', type: 'text', admin: { description: '空なら画像（media）側の alt を使います。' } },
    {
      // Presentational only (no stored data): the Cell renders a "top" badge on the first
      // 6 rows by list order — the ones shown on the home page. It reads the live order from
      // useListQuery, so the badge updates in real time while dragging. A `ui` field is the
      // right host for a Cell with no underlying column.
      name: 'homeTop',
      type: 'ui',
      label: 'ホーム',
      admin: {
        components: { Cell: '/components/admin/gallery-home-badge#GalleryHomeBadgeCell' },
      },
    },
  ],
} satisfies CollectionConfig;
