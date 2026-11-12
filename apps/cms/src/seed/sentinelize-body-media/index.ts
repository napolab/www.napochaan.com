import type { Media } from '@payload-types';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Inverse of resolve-body-media, used at export time: a depth-1 find() populates
// each upload node's value with the full Media object, which is tied to one
// database's ids. seed:export rewrites those values back to portable
// `{ __file, __alt }` sentinels (and saves the binaries under assets/) so the
// import side can re-resolve them against whatever database it runs on.

// `filename` narrowed to string — populatedMediaOf only matches values that
// actually carry one, so callers can read it without re-checking.
type PopulatedMedia = Media & { readonly filename: string };

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// True only for an upload node whose value is a populated media object: a plain
// object carrying a string `filename` that is not a `{ __file, __alt }` sentinel.
// Numeric ids, sentinels, and unresolvable objects all return undefined (the
// mirror of `sentinelValueOf` in resolve-body-media).
const populatedMediaOf = (node: Record<string, unknown>): PopulatedMedia | undefined => {
  if (node.type !== 'upload') return undefined;
  const { value } = node;
  if (!isObject(value)) return undefined;
  if (typeof value.__file === 'string') return undefined;
  if (typeof value.filename !== 'string') return undefined;
  return value as unknown as PopulatedMedia;
};

// Same populated-media predicate as populatedMediaOf, applied to a bare value
// rather than an upload node's `.value`. Block fields (e.g. image-row cells) hold
// media at `fields.cells[i].image`, not in a `value` slot.
const populatedMediaValueOf = (value: unknown): PopulatedMedia | undefined => {
  if (!isObject(value)) return undefined;
  if (typeof value.__file === 'string') return undefined;
  if (typeof value.filename !== 'string') return undefined;
  return value as unknown as PopulatedMedia;
};

const childrenOf = (node: Record<string, unknown>): readonly unknown[] => (Array.isArray(node.children) ? node.children : []);

// Deterministic deep walk of an arbitrary block-fields value: arrays in index
// order, objects in key (Object.values) order. Any populated-media value found is
// collected; the order MUST match collectFromValue's rewrite in
// sentinelize-body-media's import counterpart for positional resolution.
const collectFromValue = (value: unknown): Media[] => {
  const media = populatedMediaValueOf(value);
  if (media !== undefined) return [media];
  if (Array.isArray(value)) return value.flatMap((item) => collectFromValue(item));
  if (isObject(value)) return Object.values(value).flatMap((item) => collectFromValue(item));
  return [];
};

const collectFromNodes = (nodes: readonly unknown[]): Media[] =>
  nodes.reduce<Media[]>((acc, node) => {
    if (!isObject(node)) return acc;
    const media = populatedMediaOf(node);
    if (media !== undefined) return [...acc, media];
    // Block nodes carry media inside `fields` (e.g. image-row cells), real lexical
    // containers carry it in `children`. Walk fields first, then children, so a
    // node that happens to have both stays in a fixed, document order.
    if (node.type === 'block') return [...acc, ...collectFromValue(node.fields), ...collectFromNodes(childrenOf(node))];
    return [...acc, ...collectFromNodes(childrenOf(node))];
  }, []);

/**
 * Every populated media object embedded in a body's upload nodes, in document
 * order. Pure: the input tree is never mutated. The caller saves each media's
 * binary to the assets dir before {@link applyBodySentinels} strips the
 * populated values from the exported JSON.
 */
export const collectBodyMedia = (body: SerializedEditorState): readonly Media[] => collectFromNodes(body.root.children);

// Rebuilds a node list with every populated upload value replaced by its
// sentinel. Non-upload nodes recurse through children; everything else is
// passed through untouched, which makes the transform idempotent.
const sentinelOf = (media: PopulatedMedia): { __file: string; __alt: string } => ({ __file: media.filename, __alt: media.alt ?? '' });

// Deep rewrite mirroring collectFromValue's traversal: every populated-media
// value (at any depth in block fields) becomes its sentinel; arrays/objects are
// rebuilt in the same order. Idempotent — already-sentinel values are skipped.
const sentinelizeValue = (value: unknown): unknown => {
  const media = populatedMediaValueOf(value);
  if (media !== undefined) return sentinelOf(media);
  if (Array.isArray(value)) return value.map((item) => sentinelizeValue(item));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sentinelizeValue(item)]));
  return value;
};

const sentinelizeNodes = (nodes: readonly unknown[]): unknown[] =>
  nodes.map((node) => {
    if (!isObject(node)) return node;

    const media = populatedMediaOf(node);
    if (media !== undefined) return { ...node, value: sentinelOf(media) };

    if (node.type === 'block') {
      const withFields = node.fields === undefined ? node : { ...node, fields: sentinelizeValue(node.fields) };
      if (!Array.isArray(withFields.children)) return withFields;
      return { ...withFields, children: sentinelizeNodes(withFields.children) };
    }

    if (!Array.isArray(node.children)) return node;
    return { ...node, children: sentinelizeNodes(node.children) };
  });

/**
 * A new body where every populated upload value is rewritten to its portable
 * `{ __file, __alt }` sentinel (missing alt becomes ''). Already-sentinel
 * values, numeric ids, and unresolvable objects are left untouched, so applying
 * twice equals applying once. Pure: the input tree is never mutated.
 */
export const applyBodySentinels = (body: SerializedEditorState): SerializedEditorState => {
  const raw: unknown = { ...body, root: { ...body.root, children: sentinelizeNodes(body.root.children) } };
  return raw as SerializedEditorState;
};
