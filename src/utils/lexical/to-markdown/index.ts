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

// Allow only safe URL schemes — mirrors converters/link. Author-controlled URLs
// may carry javascript:/data: payloads; those collapse to '#'.
const SAFE_HREF = /^(?:https?:|mailto:|tel:|\/|#)/i;

const resolveHref = (node: unknown, opts: LexicalToMarkdownOptions): string => {
  const fields = isObject(node) ? node.fields : undefined;
  const raw = stringOf(fields, 'url') ?? '';
  if (!SAFE_HREF.test(raw)) return '#';
  if (raw.startsWith('/')) return new URL(raw, opts.baseUrl).toString();

  return raw;
};

// Inline renderer: text / linebreak / link / autolink. Unknown inline
// nodes flatten to their children's text so content is never silently dropped.
const renderInline = (nodes: readonly unknown[], opts: LexicalToMarkdownOptions): string => {
  return nodes
    .map((node) => {
      switch (typeOf(node)) {
        case 'text':
          return renderTextNode(node);
        case 'linebreak':
          return '\n';
        case 'link':
        case 'autolink':
          return `[${renderInline(childrenOf(node), opts)}](${resolveHref(node, opts)})`;
        default:
          return renderInline(childrenOf(node), opts);
      }
    })
    .join('');
};

const INDENT = '    ';

const listMarker = (tag: string | undefined, index: number, node: unknown): string => {
  const checked = isObject(node) && typeof node.checked === 'boolean' ? node.checked : undefined;
  if (checked !== undefined) return checked ? '- [x]' : '- [ ]';
  if (tag === 'ol') return `${index + 1}.`;

  return '-';
};

// One listitem → one or more lines. A wrapper item (its only children are
// nested lists — Lexical's nesting shape) emits no marker line of its own,
// so it must not consume an ordinal — the caller passes only the count of
// marker-emitting items that preceded it.
const renderListItem = (node: unknown, tag: string | undefined, ordinal: number, depth: number, opts: LexicalToMarkdownOptions): string => {
  const nested = childrenOf(node).filter((child) => typeOf(child) === 'list');
  const own = childrenOf(node).filter((child) => typeOf(child) !== 'list');
  const inline = renderInline(own, opts).replace(/\n/g, ' ');
  const ownLine = inline === '' ? [] : [`${INDENT.repeat(depth)}${listMarker(tag, ordinal, node)} ${inline}`];
  const nestedLines = nested.map((child) => renderList(child, depth + 1, opts));

  return [...ownLine, ...nestedLines].join('\n');
};

// A listitem emits its own marker line iff it has non-list children whose
// inline rendering is non-empty (mirrors the ownLine check in renderListItem).
const emitsMarkerLine = (node: unknown, opts: LexicalToMarkdownOptions): boolean => {
  const own = childrenOf(node).filter((child) => typeOf(child) !== 'list');

  return renderInline(own, opts) !== '';
};

const renderList = (node: unknown, depth: number, opts: LexicalToMarkdownOptions): string => {
  const tag = stringOf(node, 'tag');

  return childrenOf(node)
    .reduce<{ lines: readonly string[]; ordinal: number }>(
      (acc, child) => {
        const line = renderListItem(child, tag, acc.ordinal, depth, opts);
        const ordinal = emitsMarkerLine(child, opts) ? acc.ordinal + 1 : acc.ordinal;

        return { lines: [...acc.lines, line], ordinal };
      },
      { lines: [], ordinal: 0 },
    )
    .lines.filter((line) => line !== '')
    .join('\n');
};

const headingLevel = (tag: string | undefined): number => {
  const parsed = tag !== undefined && /^h[1-6]$/.test(tag) ? parseInt(tag.slice(1), 10) : 6;

  return parsed;
};

// One code-block child → its raw text. linebreak/tab carry no text field of
// their own, so they must be special-cased before falling back to `text`
// (mirrors converters/code/extract-code's childText).
const codeChildText = (node: unknown): string => {
  switch (typeOf(node)) {
    case 'linebreak':
      return '\n';
    case 'tab':
      return '\t';
    default:
      return stringOf(node, 'text') ?? '';
  }
};

// Raw text of a code block: text nodes joined verbatim, linebreak → '\n',
// tab → '\t' (no inline formatting inside a fence).
const renderCodeText = (nodes: readonly unknown[]): string => {
  return nodes.map((node) => codeChildText(node)).join('');
};

const absolutize = (url: string, opts: LexicalToMarkdownOptions): string => (url.startsWith('/') ? new URL(url, opts.baseUrl).toString() : url);

// A populated media value carries url (+ alt/mimeType); an unpopulated one is a
// numeric id — mirrors converters/image-row's guard.
type PopulatedMedia = { url: string; alt: string; mimeType: string; filename?: string };

const populatedMediaOf = (value: unknown): PopulatedMedia | undefined => {
  if (!isObject(value)) return undefined;
  const url = stringOf(value, 'url');
  if (url === undefined) return undefined;

  return { url, alt: stringOf(value, 'alt') ?? '', mimeType: stringOf(value, 'mimeType') ?? '', filename: stringOf(value, 'filename') };
};

// `![alt](url)` + caption line. Caption prefers the explicit caption, falling
// back to alt so an image is never label-less (same policy as converters/upload).
const imageMarkdown = (media: PopulatedMedia, caption: string | undefined, opts: LexicalToMarkdownOptions): string => {
  const line = `![${media.alt}](${absolutize(media.url, opts)})`;
  const label = caption !== undefined && caption !== '' ? caption : media.alt;

  return label === '' ? line : `${line}\n*${label}*`;
};

const renderUpload = (node: unknown, opts: LexicalToMarkdownOptions): string | undefined => {
  const media = populatedMediaOf(isObject(node) ? node.value : undefined);
  if (media === undefined) return undefined;
  if (!media.mimeType.startsWith('image')) return `[${media.filename ?? media.url}](${absolutize(media.url, opts)})`;

  return imageMarkdown(media, stringOf(isObject(node) ? node.fields : undefined, 'caption'), opts);
};

const renderImageRow = (fields: Record<string, unknown>, opts: LexicalToMarkdownOptions): string | undefined => {
  const cells = Array.isArray(fields.cells) ? fields.cells : [];
  const rendered = cells
    .map((cell: unknown) => {
      const media = populatedMediaOf(isObject(cell) ? cell.image : undefined);
      if (media === undefined) return undefined;

      return imageMarkdown(media, stringOf(cell, 'caption'), opts);
    })
    .filter((value): value is string => value !== undefined);

  return rendered.length === 0 ? undefined : rendered.join('\n');
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
    case 'list':
      return renderList(node, 0, opts);
    case 'quote': {
      const inline = renderInline(childrenOf(node), opts);

      return inline === ''
        ? undefined
        : inline
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n');
    }
    case 'code': {
      const lang = stringOf(node, 'language') ?? '';

      return `\`\`\`${lang}\n${renderCodeText(childrenOf(node))}\n\`\`\``;
    }
    case 'table':
      return renderTable(node, opts);
    case 'horizontalrule':
      return '---';
    case 'upload':
      return renderUpload(node, opts);
    case 'block': {
      const fields = isObject(node) && isObject(node.fields) ? node.fields : undefined;
      if (fields === undefined) return undefined;
      if (fields.blockType === 'image-row') return renderImageRow(fields, opts);

      return undefined;
    }
    default:
      return undefined;
  }
};

// Table cell content collapses to one line (pipes escaped so they don't break
// the row).
const renderTableCell = (cell: unknown, opts: LexicalToMarkdownOptions): string => {
  const blocks = childrenOf(cell)
    .map((child) => renderBlock(child, opts) ?? renderInline(childrenOf(child), opts))
    .filter((value) => value !== '');

  return blocks.join(' ').replace(/\n/g, ' ').replace(/\|/g, '\\|');
};

const renderTable = (node: unknown, opts: LexicalToMarkdownOptions): string => {
  const rows = childrenOf(node).map((row) => childrenOf(row).map((cell) => renderTableCell(cell, opts)));
  const [head, ...rest] = rows;
  if (head === undefined) return '';

  const line = (cells: readonly string[]): string => `| ${cells.join(' | ')} |`;
  const separator = line(head.map(() => '---'));

  return [line(head), separator, ...rest.map(line)].join('\n');
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
