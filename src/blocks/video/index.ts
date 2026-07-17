import { FENCE_END, FENCE_START, MEDIA_LINE, POSTER_REF, fenceBodyLines } from './fence';

import type { Block } from 'payload';

// Fence delimiters for the `video` Markdown round-trip (see `jsx` below).
// customEndRegex makes Payload route this block through the multiline-element
// transformer (linesInBetween join) instead of the default JSX <tag> parser,
// same as src/blocks/image-row/index.ts. Definitions live in ./fence — single
// source of truth (shared with a future MCP markdown validator).

type VideoVariant = 'ambient' | 'player';

type VideoFields = { video: number; variant: VideoVariant; caption?: string; poster?: number };

const isVideoVariant = (value: unknown): value is VideoVariant => value === 'ambient' || value === 'player';

// `props.variant` comes from the fence's start line (extractPropsFromJSXPropsString).
// Missing or unrecognized -> default to 'ambient' per the fence contract.
const parseVariant = (value: unknown): VideoVariant => (isVideoVariant(value) ? value : 'ambient');

// `props.poster` is only meaningful for the `player` variant; ignore it otherwise.
const parsePosterID = (value: unknown, variant: VideoVariant): number | undefined => {
  if (variant !== 'player') return undefined;
  if (typeof value !== 'string') return undefined;

  const match = value.match(POSTER_REF);
  if (match === null) return undefined;

  const id = parseInt(match[1] ?? '', 10);
  return Number.isNaN(id) ? undefined : id;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// A saved upload field's value is a raw ID while editing, but may already be a
// populated media doc (`{ id: number, ... }`) when read back from Payload.
const resolveMediaID = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (isRecord(value) && typeof value.id === 'number') return value.id;

  return undefined;
};

// A rich-text block that embeds a single video, either as a looping ambient
// background clip (no controls, no audio) or as a controlled player. The
// converter lives in src/components/rich-text/converters/video.
export const Video = {
  slug: 'video',
  labels: { singular: '動画', plural: '動画' },
  // CONFIRMED against @payloadcms/richtext-lexical 3.84.1 (src/features/blocks/server/markdown/markdownTransformer.js),
  // mirroring src/blocks/image-row/index.ts: export may return a plain string, emitted verbatim as the whole
  // ```video fence. import receives `children` as the fence's inner line(s) already joined with '\n' and trimmed,
  // and `props` parsed from the start line's `variant=... poster=media:<id>` attributes
  // (FENCE_START's capture group -> Payload's extractPropsFromJSXPropsString). Return the block's own fields
  // only ({ video, variant, caption?, poster? }), not id/blockType.
  jsx: {
    customStartRegex: FENCE_START,
    customEndRegex: FENCE_END,
    // Payload's own `BlockFields` (payload/dist/fields/config/types.d.ts) is
    // `{ [key: string]: any; blockName?: string; blockType?: string }` — an index
    // signature is the actual boundary contract here, not an escape hatch we chose.
    export: ({ fields }: { fields: { video?: unknown; variant?: unknown; caption?: unknown; poster?: unknown; [key: string]: unknown } }) => {
      const videoID = resolveMediaID(fields.video);
      if (videoID === undefined) return false;

      const variant = parseVariant(fields.variant);
      const caption = typeof fields.caption === 'string' ? fields.caption : '';
      const posterID = variant === 'player' ? resolveMediaID(fields.poster) : undefined;
      const posterAttr = posterID !== undefined ? ` poster=media:${posterID}` : '';

      return `\`\`\`video variant=${variant}${posterAttr}\n![media:${videoID}](${caption})\n\`\`\``;
    },
    import: ({ children, props }: { children: string; props: Record<string, unknown> }) => {
      const lines = fenceBodyLines(children);
      if (lines.length !== 1) return false;

      const [line] = lines;
      if (line === undefined) return false;

      const match = line.match(MEDIA_LINE);
      if (match === null) return false;

      const videoID = parseInt(match[1] ?? '', 10);
      if (Number.isNaN(videoID)) return false;

      const caption = (match[2] ?? '').trim();
      const variant = parseVariant(props.variant);
      const poster = parsePosterID(props.poster, variant);

      const fields: VideoFields = {
        video: videoID,
        variant,
        ...(caption.length > 0 ? { caption } : {}),
        ...(poster !== undefined ? { poster } : {}),
      };

      return fields;
    },
  },
  fields: [
    {
      name: 'video',
      label: '動画',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'MP4 (H.264, faststart) を想定',
      },
    },
    {
      name: 'variant',
      label: '再生方式',
      type: 'radio',
      options: [
        { label: 'アンビエント(自動再生ループ・音なし)', value: 'ambient' },
        { label: 'プレイヤー(コントロール付き)', value: 'player' },
      ],
      defaultValue: 'ambient',
      required: true,
    },
    {
      name: 'caption',
      label: 'キャプション',
      type: 'text',
    },
    {
      name: 'poster',
      label: 'ポスター画像',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: '未指定なら自動生成',
        condition: (_data, siblingData: { variant?: VideoVariant }) => siblingData?.variant === 'player',
      },
    },
  ],
} satisfies Block;
