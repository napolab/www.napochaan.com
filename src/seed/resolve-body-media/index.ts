import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// A "sentinel" upload node carries the asset filename + alt instead of a resolved
// media id. richTextFromBlocks' img block emits these; the seed import resolves
// them to real media ids before persisting (the upload converter needs a numeric
// id / populated object, not a `{ __file, __alt }` placeholder).

export type UploadSentinel = {
  readonly file: string;
  readonly alt: string;
};

// A sentinel paired with the media id it resolved to (undefined = asset missing,
// so the node is dropped from the body rather than left dangling).
export type ResolvedMedia = UploadSentinel & {
  readonly id: number | undefined;
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// True only for an upload node still carrying a `{ __file, __alt }` sentinel value
// (a node whose value is already a numeric id / populated object is left alone).
const sentinelValueOf = (node: Record<string, unknown>): UploadSentinel | undefined => {
  if (node.type !== 'upload') return undefined;
  const { value } = node;
  if (!isObject(value)) return undefined;
  const file = value.__file;
  const alt = value.__alt;
  if (typeof file !== 'string' || typeof alt !== 'string') return undefined;
  return { file, alt };
};

const childrenOf = (node: Record<string, unknown>): readonly unknown[] => (Array.isArray(node.children) ? node.children : []);

const collectFromNodes = (nodes: readonly unknown[]): UploadSentinel[] =>
  nodes.reduce<UploadSentinel[]>((acc, node) => {
    if (!isObject(node)) return acc;
    const sentinel = sentinelValueOf(node);
    if (sentinel !== undefined) return [...acc, sentinel];
    return [...acc, ...collectFromNodes(childrenOf(node))];
  }, []);

/**
 * Every unresolved upload sentinel in a body, in document order. Pure: the input
 * tree is never mutated. The caller resolves each `{ file, alt }` to a media id
 * (in this same order) and feeds the result back to {@link applyResolvedMedia}.
 */
export const collectUploadSentinels = (body: SerializedEditorState): readonly UploadSentinel[] => collectFromNodes(body.root.children);

// Rebuilds a node list, consuming `resolutions` positionally as upload sentinels
// are encountered (same order as collectUploadSentinels). A resolved sentinel is
// rewritten to its numeric id; an unresolved one (id === undefined) is dropped.
// Returns the rebuilt children plus the advanced cursor so siblings stay in sync.
const rebuildNodes = (nodes: readonly unknown[], resolutions: readonly ResolvedMedia[], cursor: number): { nodes: unknown[]; cursor: number } =>
  nodes.reduce<{ nodes: unknown[]; cursor: number }>(
    (acc, node) => {
      if (!isObject(node)) return { nodes: [...acc.nodes, node], cursor: acc.cursor };

      const sentinel = sentinelValueOf(node);
      if (sentinel !== undefined) {
        const resolution = resolutions[acc.cursor];
        const nextCursor = acc.cursor + 1;
        if (resolution?.id === undefined) return { nodes: acc.nodes, cursor: nextCursor };
        return { nodes: [...acc.nodes, { ...node, value: resolution.id }], cursor: nextCursor };
      }

      if (!Array.isArray(node.children)) return { nodes: [...acc.nodes, node], cursor: acc.cursor };

      const rebuilt = rebuildNodes(node.children, resolutions, acc.cursor);
      return { nodes: [...acc.nodes, { ...node, children: rebuilt.nodes }], cursor: rebuilt.cursor };
    },
    { nodes: [], cursor },
  );

/**
 * A new body where each upload sentinel is rewritten to its resolved numeric media
 * id, or dropped when the id is undefined (asset missing). `resolutions` must be in
 * the same order {@link collectUploadSentinels} produced. Pure: the input tree is
 * never mutated.
 */
export const applyResolvedMedia = (body: SerializedEditorState, resolutions: readonly ResolvedMedia[]): SerializedEditorState => {
  const { nodes } = rebuildNodes(body.root.children, resolutions, 0);
  const raw: unknown = { ...body, root: { ...body.root, children: nodes } };
  return raw as SerializedEditorState;
};
