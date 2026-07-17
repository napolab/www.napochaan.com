import ObjectID from 'bson-objectid';

import { CELL_LINE, FENCE_END, FENCE_START, fenceCellLines } from './fence';

import type { Block } from 'payload';

// Fence delimiters for the `image-row` Markdown round-trip (see `jsx` below).
// customEndRegex makes Payload route this block through the multiline-element
// transformer (linesInBetween join) instead of the default JSX <tag> parser.
// Definitions live in ./fence (shared with src/lib/mcp/markdown via
// src/blocks/image-row/mcp-support — single source of truth for the syntax).

type ImageRowCell = { id: string; image: number; caption?: string };

// One fence line ("![media:<id>](<caption>)") -> cell. undefined if the line
// doesn't match the expected shape.
const parseCellLine = (line: string): ImageRowCell | undefined => {
  const match = line.match(CELL_LINE);
  if (match === null) return undefined;

  const imageID = match[1] ?? '';
  const image = parseInt(imageID, 10);
  if (Number.isNaN(image)) return undefined;

  const caption = (match[2] ?? '').trim();

  return caption.length > 0 ? { id: ObjectID().toHexString(), image, caption } : { id: ObjectID().toHexString(), image };
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// A saved cell's `image` is a raw ID while editing, but may already be a
// populated media doc (`{ id: number, ... }`) when read back from Payload.
const imageIDOf = (image: unknown): number | undefined => {
  if (typeof image === 'number') return image;
  if (isRecord(image) && typeof image.id === 'number') return image.id;

  return undefined;
};

// One saved cell -> fence line. undefined if the cell has no resolvable image id.
const cellToLine = (cell: unknown): string | undefined => {
  if (!isRecord(cell)) return undefined;

  const id = imageIDOf(cell.image);
  if (id === undefined) return undefined;

  const caption = typeof cell.caption === 'string' ? cell.caption : '';

  return `![media:${id}](${caption})`;
};

// A rich-text block that places exactly two cover images side by side. Each cell
// reuses the Figure `cover` look (16:9 + blurred backdrop); on narrow screens the
// row scrolls horizontally. The converter lives in
// src/components/rich-text/converters/image-row.
export const ImageRow = {
  slug: 'image-row',
  labels: { singular: '画像横並び', plural: '画像横並び' },
  // CONFIRMED against @payloadcms/richtext-lexical 3.84.1 (src/features/blocks/server/markdown/markdownTransformer.js):
  // export may return a plain string, which is emitted verbatim (no extra <image-row> wrapping) — used here to return
  // the whole ```image-row fence. import receives `children` as the fence's inner lines already joined with '\n' and
  // trimmed (from `linesInBetween.join('\n').trim()`); return the block's own fields only ({ cells }), not id/blockType.
  jsx: {
    customStartRegex: FENCE_START,
    customEndRegex: FENCE_END,
    // Payload's own `BlockFields` (payload/dist/fields/config/types.d.ts) is
    // `{ [key: string]: any; blockName?: string; blockType?: string }` — an index
    // signature is the actual boundary contract here, not an escape hatch we chose.
    // `cells` is surfaced explicitly because it's the only field this block reads.
    export: ({ fields }: { fields: { cells?: unknown; [key: string]: unknown } }) => {
      const cells = Array.isArray(fields.cells) ? fields.cells : [];
      const lines = cells
        .map(cellToLine)
        .filter((line): line is string => line !== undefined)
        .join('\n');

      return `\`\`\`image-row\n${lines}\n\`\`\``;
    },
    import: ({ children }: { children: string }) => {
      const lines = fenceCellLines(children);
      if (lines.length !== 2) return false;

      const cells = lines.map((line) => parseCellLine(line)).filter((cell): cell is ImageRowCell => cell !== undefined);
      if (cells.length !== 2) return false;

      return { cells };
    },
  },
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
