import { headingText, slugifyHeading } from '../toc';
import { tagToLevel } from '../converters/heading';
import { imageRowFiguresOf } from '../converters/image-row';
import { uploadFigureOf } from '../converters/upload';

import type { ImageRowFigure } from '../converters/image-row';
import type { UploadFigure } from '../converters/upload';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type Level = 1 | 2 | 3 | 4 | 5 | 6;
type RootNode = SerializedEditorState['root'];
type TopLevelNode = RootNode['children'][number];

// A Lexical body cut at the nodes that carry a client leaf, so `rich-text.astro` can
// render everything else as server-only React and place only those leaves as islands:
//   - static:    a run of consecutive nodes, re-wrapped in the original root envelope.
//   - heading:   the heading's copy-anchor (CopyHashButton) is a client leaf.
//   - upload:    an image upload's zoomable Figure opens the client Lightbox.
//   - image-row: each cell's Figure opens the client Lightbox.
// Headings, uploads and blocks are always top-level in a Lexical root.
export type RichTextSegment =
  | { kind: 'static'; data: SerializedEditorState }
  | { kind: 'heading'; level: Level; slug: string; inline: SerializedEditorState }
  | { kind: 'upload'; figure: UploadFigure }
  | { kind: 'image-row'; figures: readonly ImageRowFigure[] };

type Leaf = Exclude<RichTextSegment, { kind: 'static' }>;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const withChildren = (root: RootNode, children: readonly unknown[]): SerializedEditorState => ({ root: { ...root, children: children as RootNode['children'] } });

const headingLeaf = (root: RootNode, node: Record<string, unknown>): Leaf | undefined => {
  if (node.type !== 'heading' || typeof node.tag !== 'string') return undefined;
  const inline = Array.isArray(node.children) ? node.children : [];

  return { kind: 'heading', level: tagToLevel(node.tag), slug: slugifyHeading(headingText(node)), inline: withChildren(root, inline) };
};

const uploadLeaf = (node: Record<string, unknown>): Leaf | undefined => {
  if (node.type !== 'upload') return undefined;
  const figure = uploadFigureOf({ value: node.value, fields: node.fields });

  return figure === undefined ? undefined : { kind: 'upload', figure };
};

const isImageRow = (node: Record<string, unknown>): boolean => node.type === 'block' && isObject(node.fields) && node.fields.blockType === 'image-row';

// What a top-level node becomes: a leaf segment, `null` (renders nothing — an image
// row without populated cells), or undefined (stays in the static run).
const classify = (root: RootNode, node: TopLevelNode): Leaf | null | undefined => {
  const record: unknown = node;
  if (!isObject(record)) return undefined;
  if (isImageRow(record)) {
    const figures = imageRowFiguresOf(isObject(record.fields) ? record.fields.cells : undefined);
    return figures.length === 0 ? null : { kind: 'image-row', figures };
  }

  return headingLeaf(root, record) ?? uploadLeaf(record);
};

const appendStatic = (root: RootNode, segments: readonly RichTextSegment[], node: TopLevelNode): RichTextSegment[] => {
  const last = segments.at(-1);
  if (last?.kind !== 'static') return [...segments, { kind: 'static', data: withChildren(root, [node]) }];

  return [...segments.slice(0, -1), { kind: 'static', data: withChildren(root, [...last.data.root.children, node]) }];
};

/** Splits a Lexical body into static runs and client-leaf segments, in order. Pure. */
export const segmentRichText = (data: SerializedEditorState): readonly RichTextSegment[] =>
  data.root.children.reduce<RichTextSegment[]>((segments, node) => {
    const leaf = classify(data.root, node);
    if (leaf === null) return segments;
    if (leaf === undefined) return appendStatic(data.root, segments, node);

    return [...segments, leaf];
  }, []);
