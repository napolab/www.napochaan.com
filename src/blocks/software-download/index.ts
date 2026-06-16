import type { Block } from 'payload';

// A rich-text block embedding a software product's download gate. Holds only a
// reference to the product; the converter resolves the product's terms and release
// history (supplied by the page loader) at render time and shows the latest version
// as the primary download plus a disclosure of past versions. Converter lives in
// src/components/rich-text/converters/software-download.
export const SoftwareDownload = {
  slug: 'software-download',
  labels: { singular: 'ダウンロード', plural: 'ダウンロード' },
  fields: [
    {
      name: 'software',
      label: 'ソフトウェア',
      type: 'relationship',
      relationTo: 'software',
      required: true,
    },
  ],
} satisfies Block;
