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
 * The serialized fields of the premade `Code` lexical block (see
 * `src/blocks/code`). Like `ImageRowBlock`, the shape is hand-declared because
 * editor-only blocks are not emitted into `payload-types.ts`. `code`/`language`
 * are optional defensively — the converter falls back to an empty string /
 * plain-text highlighting.
 */
export type CodeBlock = {
  readonly blockType: 'Code';
  readonly code?: string;
  readonly language?: string;
};

/**
 * Node types handled by the rich-text JSX converters: every Payload default
 * Lexical node plus the project's custom `image-row` and `Code` blocks. When a
 * collection adds another custom block, widen this union and add a matching
 * converter.
 */
export type NodeTypes = DefaultNodeTypes | SerializedBlockNode<ImageRowBlock> | SerializedBlockNode<CodeBlock>;
