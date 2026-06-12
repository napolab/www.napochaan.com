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

// Same sentinel predicate as sentinelValueOf, applied to a bare value rather than
// an upload node's `.value`. Block fields (e.g. image-row cells) hold the
// `{ __file, __alt }` placeholder at `fields.cells[i].image`, not in a `value` slot.
const sentinelValueOfValue = (value: unknown): UploadSentinel | undefined => {
  if (!isObject(value)) return undefined;
  const file = value.__file;
  const alt = value.__alt;
  if (typeof file !== 'string' || typeof alt !== 'string') return undefined;
  return { file, alt };
};

const childrenOf = (node: Record<string, unknown>): readonly unknown[] => (Array.isArray(node.children) ? node.children : []);

// Deterministic deep walk of an arbitrary block-fields value: arrays in index
// order, objects in key (Object.values) order. The order MUST match
// rebuildValue's traversal so positional resolution stays aligned, and MUST match
// the export side's collectFromValue so a round trip resolves the same slots.
const collectFromValue = (value: unknown): UploadSentinel[] => {
  const sentinel = sentinelValueOfValue(value);
  if (sentinel !== undefined) return [sentinel];
  if (Array.isArray(value)) return value.flatMap((item) => collectFromValue(item));
  if (isObject(value)) return Object.values(value).flatMap((item) => collectFromValue(item));
  return [];
};

const collectFromNodes = (nodes: readonly unknown[]): UploadSentinel[] =>
  nodes.reduce<UploadSentinel[]>((acc, node) => {
    if (!isObject(node)) return acc;
    const sentinel = sentinelValueOf(node);
    if (sentinel !== undefined) return [...acc, sentinel];
    // Block nodes carry sentinels inside `fields` (e.g. image-row cells), real
    // lexical containers carry them in `children`. Walk fields first, then
    // children, so a node with both stays in a fixed, document order.
    if (node.type === 'block') return [...acc, ...collectFromValue(node.fields), ...collectFromNodes(childrenOf(node))];
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
// Deep rewrite of a block-fields value mirroring collectFromValue's traversal.
// Each sentinel value consumes one resolution positionally: a resolved id replaces
// it; an unresolved one (id === undefined) is LEFT as the sentinel. Unlike a
// top-level upload node, a block cell cannot be dropped safely (it would desync
// the fixed cells array / break import), so the placeholder is kept verbatim and
// import does not break. Arrays/objects are rebuilt in the same order.
const rebuildValue = (value: unknown, resolutions: readonly ResolvedMedia[], cursor: number): { value: unknown; cursor: number } => {
  const sentinel = sentinelValueOfValue(value);
  if (sentinel !== undefined) {
    const resolution = resolutions[cursor];
    const nextCursor = cursor + 1;
    if (resolution?.id === undefined) return { value, cursor: nextCursor };
    return { value: resolution.id, cursor: nextCursor };
  }

  if (Array.isArray(value)) {
    const rebuilt = value.reduce<{ items: unknown[]; cursor: number }>(
      (acc, item) => {
        const next = rebuildValue(item, resolutions, acc.cursor);
        return { items: [...acc.items, next.value], cursor: next.cursor };
      },
      { items: [], cursor },
    );
    return { value: rebuilt.items, cursor: rebuilt.cursor };
  }

  if (isObject(value)) {
    const rebuilt = Object.entries(value).reduce<{ entries: [string, unknown][]; cursor: number }>(
      (acc, [key, item]) => {
        const next = rebuildValue(item, resolutions, acc.cursor);
        return { entries: [...acc.entries, [key, next.value]], cursor: next.cursor };
      },
      { entries: [], cursor },
    );
    return { value: Object.fromEntries(rebuilt.entries), cursor: rebuilt.cursor };
  }

  return { value, cursor };
};

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

      if (node.type === 'block') {
        const fieldsRebuilt = node.fields === undefined ? { value: node.fields, cursor: acc.cursor } : rebuildValue(node.fields, resolutions, acc.cursor);
        const withFields = node.fields === undefined ? node : { ...node, fields: fieldsRebuilt.value };
        if (!Array.isArray(withFields.children)) return { nodes: [...acc.nodes, withFields], cursor: fieldsRebuilt.cursor };
        const childrenRebuilt = rebuildNodes(withFields.children, resolutions, fieldsRebuilt.cursor);
        return { nodes: [...acc.nodes, { ...withFields, children: childrenRebuilt.nodes }], cursor: childrenRebuilt.cursor };
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
