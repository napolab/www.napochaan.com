import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// NOTE: 対応ノードは src/components/rich-text/converters/types.ts の NodeTypes
// union をミラーする。新しいカスタムブロックを追加するときは、あちらの union と
// JSX converter に加えてこのコンバータにも分岐を足すこと。

export type LexicalToMarkdownOptions = { baseUrl: string };

// Standard Lexical text-format bitmasks (mirrors converters/text).
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_STRIKETHROUGH = 4;
const IS_CODE = 16;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const childrenOf = (node: unknown): readonly unknown[] => {
  if (!isObject(node)) return [];
  const { children } = node;
  if (!Array.isArray(children)) return [];

  return children;
};

const typeOf = (node: unknown): string => {
  if (!isObject(node)) return '';

  return typeof node.type === 'string' ? node.type : '';
};

const stringOf = (node: unknown, key: string): string | undefined => {
  if (!isObject(node)) return undefined;
  const value = node[key];

  return typeof value === 'string' ? value : undefined;
};

const numberOf = (node: unknown, key: string): number | undefined => {
  if (!isObject(node)) return undefined;
  const value = node[key];

  return typeof value === 'number' ? value : undefined;
};

// Wrap a text run according to its format bitmask, innermost-first so the
// output nests as **~~*text*~~** (code applies alone, innermost).
const FORMAT_WRAPPERS: readonly (readonly [number, (text: string) => string])[] = [
  [IS_CODE, (value) => `\`${value}\``],
  [IS_ITALIC, (value) => `*${value}*`],
  [IS_STRIKETHROUGH, (value) => `~~${value}~~`],
  [IS_BOLD, (value) => `**${value}**`],
];

const applyFormat = (format: number, value: string): string => {
  if (value === '') return value;

  return FORMAT_WRAPPERS.reduce((acc, [bit, wrap]) => ((format & bit) === 0 ? acc : wrap(acc)), value);
};

const renderTextNode = (node: unknown): string => applyFormat(numberOf(node, 'format') ?? 0, stringOf(node, 'text') ?? '');

// Inline renderer: text / linebreak / (Task 3: link, autolink). Unknown inline
// nodes flatten to their children's text so content is never silently dropped.
const renderInline = (nodes: readonly unknown[], opts: LexicalToMarkdownOptions): string => {
  return nodes
    .map((node) => {
      switch (typeOf(node)) {
        case 'text':
          return renderTextNode(node);
        case 'linebreak':
          return '\n';
        default:
          return renderInline(childrenOf(node), opts);
      }
    })
    .join('');
};

const headingLevel = (tag: string | undefined): number => {
  const parsed = tag !== undefined && /^h[1-6]$/.test(tag) ? parseInt(tag.slice(1), 10) : 6;

  return parsed;
};

// Block renderer: returns the markdown for one top-level block, or undefined
// for unknown/empty blocks (skipped by the caller).
const renderBlock = (node: unknown, opts: LexicalToMarkdownOptions): string | undefined => {
  switch (typeOf(node)) {
    case 'paragraph': {
      const inline = renderInline(childrenOf(node), opts);

      return inline === '' ? undefined : inline;
    }
    case 'heading': {
      const inline = renderInline(childrenOf(node), opts);

      return `${'#'.repeat(headingLevel(stringOf(node, 'tag')))} ${inline}`;
    }
    default:
      return undefined;
  }
};

/**
 * Converts a Payload Lexical rich-text body to markdown. Pure. Unknown node
 * types are skipped (matching the JSX converters' defensive stance); relative
 * link/image URLs are absolutized against `baseUrl` so the `.md` output reads
 * correctly off-site.
 */
export const lexicalToMarkdown = (body: SerializedEditorState | undefined, opts: LexicalToMarkdownOptions): string => {
  if (body === undefined) return '';

  const blocks = childrenOf(body.root)
    .map((node) => renderBlock(node, opts))
    .filter((block): block is string => block !== undefined && block !== '');

  return blocks.join('\n\n');
};
