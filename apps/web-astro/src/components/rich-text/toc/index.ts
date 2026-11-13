import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type TocHeading = {
  readonly level: number;
  readonly text: string;
  readonly slug: string;
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const collectText = (nodes: unknown): string => {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) => {
      if (!isObject(node)) return '';
      if (typeof node.text === 'string') return node.text;
      return collectText(node.children);
    })
    .join('');
};

/** Plain text of a Lexical heading node (used by both the heading converter and the TOC). */
export const headingText = (node: { readonly children?: unknown }): string => collectText(node.children);

/**
 * Stable id from heading text: lower-cased, whitespace collapsed to '-', and characters unsafe in a URL
 * fragment dropped. Japanese characters are kept — they are valid in HTML ids and resolve fine as
 * `#fragments`. Identical headings collapse to the same id.
 */
export const slugifyHeading = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/[?#/\\%"'<>]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Top-level h2/h3 headings of a body, for building a table of contents. */
export const extractHeadings = (content: SerializedEditorState | null): readonly TocHeading[] => {
  if (content === null) return [];
  const children: readonly unknown[] = content.root.children;
  return children
    .filter((node): node is Record<string, unknown> => isObject(node) && node.type === 'heading' && (node.tag === 'h2' || node.tag === 'h3'))
    .map((node): TocHeading => {
      const text = collectText(node.children);
      const level = node.tag === 'h3' ? 3 : 2;
      return { level, text, slug: slugifyHeading(text) };
    })
    .filter((heading) => heading.text !== '');
};
