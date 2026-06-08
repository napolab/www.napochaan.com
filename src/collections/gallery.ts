import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Gallery photos feed `/gallery` (skyline masonry) and the home teaser. The image
// is a media upload; width/height/alt come from the media record.
const revalidateGallery = createPublishedTagRevalidateHooks([CACHE_TAGS.gallery]);

export const Gallery = {
  slug: 'gallery',
  labels: { singular: 'ギャラリー', plural: 'ギャラリー' },
  admin: {
    useAsTitle: 'caption',
    defaultColumns: ['caption', 'order', '_status'],
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
    { name: 'order', label: '並び順', type: 'number', admin: { position: 'sidebar', description: '昇順。masonry の表示順。未設定は最後。' } },
  ],
} satisfies CollectionConfig;
