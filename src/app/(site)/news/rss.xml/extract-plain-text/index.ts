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

// Reads the `text` field off an unknown lexical node, returning '' when absent
// or non-string.
const readText = (node: unknown): string => {
  if (typeof node !== 'object' || node === null) return '';
  if (!('text' in node)) return '';
  const { text } = node;
  if (typeof text !== 'string') return '';

  return text;
};

// Recursively collects every `text` value from a node and its descendants
// (paragraphs, links, nested inline nodes).
const collectText = (node: unknown): string => {
  const own = readText(node);
  const childTexts = readChildren(node).map(collectText);

  return [own, ...childTexts].join('');
};

// Walks `body.root.children`, joining each top-level block's collected text with
// a single space, then trims. Returns '' when the body is absent or yields nothing.
export const extractPlainText = (body?: SerializedEditorState): string => {
  if (body === undefined) return '';

  const blocks = readChildren(body.root);
  const joined = blocks
    .map(collectText)
    .filter((value) => value !== '')
    .join(' ');

  return joined.trim();
};
