import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Reads the `children` array off an unknown lexical node, guarding every access
// so the walker stays type-safe without `any`.
const readChildren = (node: unknown): readonly unknown[] => {
  if (typeof node !== 'object' || node === null) return [];
  if (!('children' in node)) return [];
  const { children } = node;
  if (!Array.isArray(children)) return [];

  return children;
};

// Reads a string field off an unknown object node, returning undefined when the
// key is absent or non-string.
const readString = (node: unknown, key: string): string | undefined => {
  if (typeof node !== 'object' || node === null) return undefined;
  if (!(key in node)) return undefined;
  const value = (node as Record<string, unknown>)[key];
  if (typeof value !== 'string') return undefined;

  return value;
};

// The image source of a single node, if it carries one. An upload node holds its
// resolved Media on `value` (populated when depth >= 1) whose `url` is the source;
// some inline image nodes carry a flat `src` instead. Returns undefined otherwise.
const imageSrcOf = (node: unknown): string | undefined => {
  const directSrc = readString(node, 'src');
  if (directSrc !== undefined) return directSrc;

  if (typeof node !== 'object' || node === null) return undefined;
  if (!('value' in node)) return undefined;

  return readString((node as Record<string, unknown>).value, 'url');
};

// Depth-first search for the first node carrying an image source, returning its
// src/url or undefined. Checks the node itself before descending into children.
const findFirstImage = (node: unknown): string | undefined => {
  const own = imageSrcOf(node);
  if (own !== undefined) return own;

  for (const child of readChildren(node)) {
    const found = findFirstImage(child);
    if (found !== undefined) return found;
  }

  return undefined;
};

// Walks `body.root` and returns the src/url of the FIRST image/upload node found
// in document order, or undefined when the body is absent or carries no image.
export const firstImageSrc = (body?: SerializedEditorState): string | undefined => {
  if (body === undefined) return undefined;

  return findFirstImage(body.root);
};
