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
 * Node types handled by the rich-text JSX converters: every Payload default
 * Lexical node plus the project's custom `image-row` block. When a collection
 * adds another custom block, widen this union and add a matching converter.
 */
export type NodeTypes = DefaultNodeTypes | SerializedBlockNode<ImageRowBlock>;
