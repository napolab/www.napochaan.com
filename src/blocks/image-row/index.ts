import type { Block } from 'payload';

// A rich-text block that places exactly two cover images side by side. Each cell
// reuses the Figure `cover` look (16:9 + blurred backdrop); on narrow screens the
// row scrolls horizontally. The converter lives in
// src/components/rich-text/converters/image-row.
export const ImageRow = {
  slug: 'image-row',
  labels: { singular: '画像横並び', plural: '画像横並び' },
  fields: [
    {
      name: 'cells',
      label: '画像セル',
      labels: { singular: '画像', plural: '画像' },
      type: 'array',
      minRows: 2,
      maxRows: 2,
      required: true,
      fields: [
        {
          name: 'image',
          label: '画像',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          label: 'キャプション',
          type: 'text',
        },
      ],
    },
  ],
} satisfies Block;
