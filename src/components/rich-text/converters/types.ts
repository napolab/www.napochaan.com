import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical';

/**
 * The serialized fields of the `image-row` lexical block (see
 * `src/blocks/image-row`). Payload only emits block field types into
 * `payload-types.ts` for blocks registered on a collection field — blocks that
 * live solely inside the lexical editor's `BlocksFeature` are not generated, so
 * the shape is declared here. `image` is `unknown` because Payload populates it
 * with either a numeric id or a full Media object; the converter narrows it.
 */
export type ImageRowCell = {
  readonly image: unknown;
  readonly caption?: string;
};

export type ImageRowBlock = {
  readonly blockType: 'image-row';
  readonly cells?: readonly ImageRowCell[];
};

/**
 * The serialized fields of the `video` lexical block (see `src/blocks/video`).
 * Same rationale as `ImageRowBlock` above: BlocksFeature-only blocks never make
 * it into `payload-types.ts`, so the shape is hand-declared here. `video` and
 * `poster` are `unknown` because Payload populates each with either a numeric
 * id or a full Media object; the converter narrows them.
 */
export type VideoBlock = {
  readonly blockType: 'video';
  readonly video: unknown;
  readonly variant: 'ambient' | 'player';
  readonly caption?: string;
  readonly poster?: unknown;
};

/**
 * Node types handled by the rich-text JSX converters: every Payload default
 * Lexical node plus the project's custom `image-row` and `video` blocks. When a
 * collection adds another custom block, widen this union and add a matching
 * converter.
 */
export type NodeTypes = DefaultNodeTypes | SerializedBlockNode<ImageRowBlock> | SerializedBlockNode<VideoBlock>;
