import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// A software-download block's `software` field is either a populated object ({ id })
// or a raw id (number | string), depending on populate depth. Normalize to a string id.
export const referenceId = (software: unknown): string | undefined => {
  if (typeof software === 'number' || typeof software === 'string') return `${software}`;
  if (isObject(software) && (typeof software.id === 'number' || typeof software.id === 'string')) return `${software.id}`;
  return undefined;
};

const idFromNode = (node: unknown): string | undefined => {
  if (!isObject(node) || node.type !== 'block' || !isObject(node.fields)) return undefined;
  if (node.fields.blockType !== 'software-download') return undefined;
  return referenceId(node.fields.software);
};

const childrenOf = (node: unknown): readonly unknown[] => (isObject(node) && Array.isArray(node.children) ? node.children : []);

// Depth-first walk collecting software ids from software-download blocks. Deduped,
// first-seen order preserved.
const walk = (node: unknown, seen: Set<string>): void => {
  const id = idFromNode(node);
  if (id !== undefined) seen.add(id);
  for (const child of childrenOf(node)) walk(child, seen);
};

export const collectSoftwareIds = (body?: SerializedEditorState): readonly string[] => {
  if (body === undefined) return [];
  const seen = new Set<string>();
  walk((body as unknown as { root: unknown }).root, seen);
  return [...seen];
};
