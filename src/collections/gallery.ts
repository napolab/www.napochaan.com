import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Gallery photos feed `/gallery` (skyline masonry) and the home teaser. The image
// is a media upload; width/height/alt come from the media record.
const revalidateGallery = createPublishedTagRevalidateHooks([CACHE_TAGS.gallery]);

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
      // Virtual (not stored): true for the first 6 rows by `_order`, i.e. the ones shown on
      // the home page. The Cell renders a badge so editors can see at a glance which rows
      // appear on top. Only computed for admin reads — the public site never reads this field.
      name: 'homeTop',
      label: 'ホーム',
      type: 'checkbox',
      virtual: true,
      admin: {
        readOnly: true,
        components: { Cell: '/components/admin/gallery-home-badge#GalleryHomeBadgeCell' },
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (req.user === null || req.user === undefined) return false;
            const id = data?.id;
            if (id === undefined || id === null) return false;
            const top = await req.payload.find({ collection: 'gallery', sort: '_order', limit: 6, depth: 0, overrideAccess: true });

            return top.docs.some((doc) => doc.id === id);
          },
        ],
      },
    },
  ],
} satisfies CollectionConfig;
