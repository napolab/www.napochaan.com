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

const childrenOf = (node: Record<string, unknown>): readonly unknown[] => (Array.isArray(node.children) ? node.children : []);

const collectFromNodes = (nodes: readonly unknown[]): Media[] =>
  nodes.reduce<Media[]>((acc, node) => {
    if (!isObject(node)) return acc;
    const media = populatedMediaOf(node);
    if (media !== undefined) return [...acc, media];
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
const sentinelizeNodes = (nodes: readonly unknown[]): unknown[] =>
  nodes.map((node) => {
    if (!isObject(node)) return node;

    const media = populatedMediaOf(node);
    if (media !== undefined) return { ...node, value: { __file: media.filename, __alt: media.alt ?? '' } };

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
