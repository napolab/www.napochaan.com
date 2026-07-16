# Markdown Pages (`.md` URL) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** コンテンツページ URL に `.md` を付けると、そのページの内容を markdown（`text/markdown; charset=utf-8`）で返す。

**Architecture:** 静的 5 URL（`/about.md` `/blog.md` `/news.md` `/log.md` `/works.md`）は `llms.txt` と同じリテラルディレクトリ route handler。動的 3 URL（`/blog/:slug.md` 等）は next.config rewrite → `[slug]/md/route.ts`。本文は新規の純関数 `lexicalToMarkdown` で Lexical → markdown 変換し、セクションごとの純関数ビルダーが frontmatter 付き文書を組み立てる。

**Tech Stack:** Next.js 15 App Router route handlers / Payload Lexical SerializedEditorState / vitest (unit, `.test.ts`)

**Spec:** `docs/superpowers/specs/2026-07-16-markdown-pages-design.md`

## Global Constraints

- 関数は全て arrow function（`const fn = () => {}`）。`let` / `forEach` / IIFE / non-null `!` / `any` 禁止
- Boolean/String/Number ラッパー禁止。文字列化はテンプレートリテラル、truthiness チェックは明示比較（`!== undefined` 等）
- `as` より `satisfies`。テストで lexical state を作るときのみ `as unknown as SerializedEditorState` を許容（既存テストと同じ慣行）
- コロケーション: `<name>/index.ts` + `<name>/<name>.test.ts`。kebab-case
- URL 組み立ては `new URL(path, base)` を使う（文字列連結しない）
- 型 import は `import type`。パスエイリアス: `@utils/*` `@lib/*` は既存 tsconfig 通り
- テストは `.test.ts`（node 環境。window に触らないので `.tsx` 不要）
- 各タスク完了時に `pnpm vitest run <対象>` グリーン → commit（husky が lint+typecheck を実行する）
- コミットメッセージ末尾に必ず付ける:
  ```
  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PfXeJ9dFsqnV3h19PAUtpz
  ```
- 作業ディレクトリ: `/Users/napochaan/ghq/github.com/napolab/www.napochaan.com/.claude/worktrees/feat-markdown-pages`（ブランチ `worktree-feat-markdown-pages`）

---

### Task 1: markdown 共有ユーティリティ（frontmatter + Response ヘルパ）

**Files:**

- Create: `src/utils/markdown/frontmatter/index.ts`
- Create: `src/utils/markdown/frontmatter/frontmatter.test.ts`
- Create: `src/utils/markdown/response/index.ts`
- Create: `src/utils/markdown/response/response.test.ts`

**Interfaces:**

- Produces: `formatFrontmatter(fields: Readonly<Record<string, string | number | undefined>>): string` — `---` 囲み YAML 文字列（末尾改行なし）。undefined 値のキーは省略。文字列値は `"` 囲み + エスケープ
- Produces: `markdownResponse(text: string): Response` — 200 / `text/markdown; charset=utf-8`
- Produces: `notFoundResponse(): Response` — 404 / `text/plain; charset=utf-8` / body `Not Found`

- [ ] **Step 1: frontmatter の失敗するテストを書く**

```ts
// src/utils/markdown/frontmatter/frontmatter.test.ts
import { describe, expect, it } from 'vitest';

import { formatFrontmatter } from '.';

describe('formatFrontmatter', () => {
  it('renders --- fenced YAML with quoted strings and bare numbers', () => {
    const result = formatFrontmatter({ title: 'v3.0.0 制作記', date: '2026-01-01', readMin: 5 });
    expect(result).toBe(['---', 'title: "v3.0.0 制作記"', 'date: "2026-01-01"', 'readMin: 5', '---'].join('\n'));
  });

  it('omits undefined fields', () => {
    const result = formatFrontmatter({ title: 'a', category: undefined });
    expect(result).toBe(['---', 'title: "a"', '---'].join('\n'));
  });

  it('escapes double quotes and flattens newlines in values', () => {
    const result = formatFrontmatter({ title: 'say "hi"\nplease' });
    expect(result).toBe(['---', 'title: "say \\"hi\\" please"', '---'].join('\n'));
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/utils/markdown/frontmatter`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/utils/markdown/frontmatter/index.ts
export type FrontmatterValue = string | number | undefined;

// Quote + escape a string value: backslashes and double quotes are escaped, and
// newlines collapse to single spaces so the value always stays on one line.
const escapeValue = (value: string): string => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s*\r?\n\s*/g, ' ')}"`;

const formatLine = ([key, value]: readonly [string, string | number]): string => (typeof value === 'number' ? `${key}: ${value}` : `${key}: ${escapeValue(value)}`);

/**
 * Renders a `---` fenced YAML frontmatter block for the `.md` endpoints.
 * Keys keep their insertion order; `undefined` values drop the whole line.
 */
export const formatFrontmatter = (fields: Readonly<Record<string, FrontmatterValue>>): string => {
  const lines = Object.entries(fields)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(formatLine);

  return ['---', ...lines, '---'].join('\n');
};
```

- [ ] **Step 4: response の失敗するテストを書く**

```ts
// src/utils/markdown/response/response.test.ts
import { describe, expect, it } from 'vitest';

import { markdownResponse, notFoundResponse } from '.';

describe('markdownResponse', () => {
  it('returns 200 with text/markdown content-type and the given body', async () => {
    const res = markdownResponse('# hi\n');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(await res.text()).toBe('# hi\n');
  });
});

describe('notFoundResponse', () => {
  it('returns 404 text/plain Not Found', async () => {
    const res = notFoundResponse();
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('Not Found');
  });
});
```

- [ ] **Step 5: 失敗を確認**

Run: `pnpm vitest run src/utils/markdown/response`
Expected: FAIL

- [ ] **Step 6: 実装**

```ts
// src/utils/markdown/response/index.ts
/** 200 response for the `.md` endpoints. */
export const markdownResponse = (text: string): Response => new Response(text, { headers: { 'content-type': 'text/markdown; charset=utf-8' } });

/** 404 for `.md` detail endpoints whose slug matches no published record. */
export const notFoundResponse = (): Response => new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
```

- [ ] **Step 7: グリーン確認**

Run: `pnpm vitest run src/utils/markdown`
Expected: PASS（5 tests）

- [ ] **Step 8: Commit**

```bash
git add src/utils/markdown
git commit -m "feat: .md エンドポイント用 frontmatter/Response ヘルパを追加"
```

---

### Task 2: lexicalToMarkdown — 骨格 + text/paragraph/heading

**Files:**

- Create: `src/utils/lexical/to-markdown/index.ts`
- Create: `src/utils/lexical/to-markdown/to-markdown.test.ts`

**Interfaces:**

- Produces: `lexicalToMarkdown(state: SerializedEditorState | undefined, opts: { baseUrl: string }): string` — ブロックを `\n\n` 結合した markdown。`undefined` / 空 body → `''`
- 対応ノード種は `src/components/rich-text/converters/types.ts` の `NodeTypes` union をミラーする（このタスクで text/paragraph/heading、以降のタスクで残りを追加）
- テスト用の state 生成ヘルパ `state(...blocks)` をテストファイル内に定義（後続タスクのテストも同じヘルパを使う）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/utils/lexical/to-markdown/to-markdown.test.ts
import { describe, expect, it } from 'vitest';

import { lexicalToMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const BASE = 'https://example.com';
const opts = { baseUrl: BASE };

// Minimal lexical state factory for tests. The runtime walker reads nodes
// structurally (type/children/text/...), so a plain object literal cast once
// here keeps every test case terse.
export const state = (...blocks: readonly unknown[]): SerializedEditorState => ({ root: { children: blocks } }) as unknown as SerializedEditorState;

const text = (value: string, format = 0) => ({ type: 'text', text: value, format });
const paragraph = (...children: readonly unknown[]) => ({ type: 'paragraph', children });

describe('lexicalToMarkdown: basics', () => {
  it('returns empty string for undefined body', () => {
    expect(lexicalToMarkdown(undefined, opts)).toBe('');
  });

  it('joins paragraphs with blank lines and skips empty ones', () => {
    const body = state(paragraph(text('一段落目')), paragraph(), paragraph(text('二段落目')));
    expect(lexicalToMarkdown(body, opts)).toBe('一段落目\n\n二段落目');
  });

  it('renders headings h1-h6 with # markers', () => {
    const body = state({ type: 'heading', tag: 'h2', children: [text('見出し')] }, { type: 'heading', tag: 'h4', children: [text('小見出し')] });
    expect(lexicalToMarkdown(body, opts)).toBe('## 見出し\n\n#### 小見出し');
  });

  it('applies bold/italic/strikethrough/inline-code format bitmasks', () => {
    // bitmasks mirror src/components/rich-text/converters/text: bold=1 italic=2 strike=4 code=16
    const body = state(paragraph(text('強い', 1), text(' と '), text('code', 16), text(' と '), text('全部', 1 | 2 | 4)));
    expect(lexicalToMarkdown(body, opts)).toBe('**強い** と `code` と **~~*全部*~~**');
  });

  it('renders linebreak as a newline inside a paragraph', () => {
    const body = state(paragraph(text('上'), { type: 'linebreak' }, text('下')));
    expect(lexicalToMarkdown(body, opts)).toBe('上\n下');
  });

  it('ignores unknown node types without throwing', () => {
    const body = state({ type: 'mystery-widget', children: [] }, paragraph(text('生存')));
    expect(lexicalToMarkdown(body, opts)).toBe('生存');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/utils/lexical/to-markdown`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/utils/lexical/to-markdown/index.ts
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
```

- [ ] **Step 4: グリーン確認**

Run: `pnpm vitest run src/utils/lexical/to-markdown`
Expected: PASS（6 tests）

- [ ] **Step 5: Commit**

```bash
git add src/utils/lexical/to-markdown
git commit -m "feat: lexicalToMarkdown の骨格 (text/paragraph/heading) を追加"
```

---

### Task 3: lexicalToMarkdown — link/autolink + list（ネスト・checklist）

**Files:**

- Modify: `src/utils/lexical/to-markdown/index.ts`
- Modify: `src/utils/lexical/to-markdown/to-markdown.test.ts`

**Interfaces:**

- Consumes: Task 2 の `renderInline` / `renderBlock` / ガード群
- Produces: link は `[text](url)`（相対 URL は `new URL(url, baseUrl)` で絶対化、`javascript:` 等の危険 scheme は `#`）。list は `-` / `1.` マーカー、ネストは 4 スペースインデント、`checked` boolean を持つ item は `- [x]` / `- [ ]`

- [ ] **Step 1: 失敗するテストを追記**

```ts
// to-markdown.test.ts に追記
const link = (url: string, ...children: readonly unknown[]) => ({ type: 'link', fields: { url }, children });
const listitem = (...children: readonly unknown[]) => ({ type: 'listitem', children });
const list = (tag: 'ul' | 'ol', ...children: readonly unknown[]) => ({ type: 'list', tag, children });

describe('lexicalToMarkdown: links', () => {
  it('renders links and absolutizes relative internal URLs', () => {
    const body = state(paragraph(link('/works/miffy', text('miffy')), text(' / '), link('https://zenn.dev/x', text('zenn'))));
    expect(lexicalToMarkdown(body, opts)).toBe('[miffy](https://example.com/works/miffy) / [zenn](https://zenn.dev/x)');
  });

  it('falls back to # for unsafe href schemes', () => {
    const body = state(paragraph(link('javascript:alert(1)', text('evil'))));
    expect(lexicalToMarkdown(body, opts)).toBe('[evil](#)');
  });

  it('renders autolink nodes like link nodes', () => {
    const body = state(paragraph({ type: 'autolink', fields: { url: 'https://example.org' }, children: [text('https://example.org')] }));
    expect(lexicalToMarkdown(body, opts)).toBe('[https://example.org](https://example.org)');
  });
});

describe('lexicalToMarkdown: lists', () => {
  it('renders unordered and ordered lists', () => {
    const body = state(list('ul', listitem(text('a')), listitem(text('b'))), list('ol', listitem(text('one')), listitem(text('two'))));
    expect(lexicalToMarkdown(body, opts)).toBe('- a\n- b\n\n1. one\n2. two');
  });

  it('indents a nested list under its parent item without a stray marker', () => {
    // Lexical wraps a nested list in a listitem whose only child is the list
    // (mirrors the data shape handled by converters/list).
    const body = state(list('ul', listitem(text('parent')), listitem(list('ul', listitem(text('child'))))));
    expect(lexicalToMarkdown(body, opts)).toBe('- parent\n    - child');
  });

  it('renders check-list items with checkbox markers', () => {
    const body = state(list('ul', { type: 'listitem', checked: true, children: [text('done')] }, { type: 'listitem', checked: false, children: [text('todo')] }));
    expect(lexicalToMarkdown(body, opts)).toBe('- [x] done\n- [ ] todo');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/utils/lexical/to-markdown`
Expected: 新規 6 tests が FAIL

- [ ] **Step 3: 実装を追記**

`index.ts` に追加（`renderInline` の switch と `renderBlock` の switch を拡張）:

```ts
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

// renderInline の switch に case を追加:
//   case 'link':
//   case 'autolink':
//     return `[${renderInline(childrenOf(node), opts)}](${resolveHref(node, opts)})`;

const INDENT = '    ';

const listMarker = (tag: string | undefined, index: number, node: unknown): string => {
  const checked = isObject(node) && typeof node.checked === 'boolean' ? node.checked : undefined;
  if (checked !== undefined) return checked ? '- [x]' : '- [ ]';
  if (tag === 'ol') return `${index + 1}.`;

  return '-';
};

// One listitem → one or more lines. A wrapper item (its only children are
// nested lists — Lexical's nesting shape) emits no marker line of its own.
const renderListItem = (node: unknown, tag: string | undefined, index: number, depth: number, opts: LexicalToMarkdownOptions): string => {
  const nested = childrenOf(node).filter((child) => typeOf(child) === 'list');
  const own = childrenOf(node).filter((child) => typeOf(child) !== 'list');
  const inline = renderInline(own, opts).replace(/\n/g, ' ');
  const ownLine = inline === '' ? [] : [`${INDENT.repeat(depth)}${listMarker(tag, index, node)} ${inline}`];
  const nestedLines = nested.map((child) => renderList(child, depth + 1, opts));

  return [...ownLine, ...nestedLines].join('\n');
};

const renderList = (node: unknown, depth: number, opts: LexicalToMarkdownOptions): string => {
  const tag = stringOf(node, 'tag');

  return childrenOf(node)
    .map((child, index) => renderListItem(child, tag, index, depth, opts))
    .filter((line) => line !== '')
    .join('\n');
};

// renderBlock の switch に case を追加:
//   case 'list':
//     return renderList(node, 0, opts);
```

- [ ] **Step 4: グリーン確認**

Run: `pnpm vitest run src/utils/lexical/to-markdown`
Expected: PASS（12 tests）

- [ ] **Step 5: Commit**

```bash
git add src/utils/lexical/to-markdown
git commit -m "feat: lexicalToMarkdown に link/autolink とネストリストを追加"
```

---

### Task 4: lexicalToMarkdown — quote / code / table / horizontalrule

**Files:**

- Modify: `src/utils/lexical/to-markdown/index.ts`
- Modify: `src/utils/lexical/to-markdown/to-markdown.test.ts`

**Interfaces:**

- Consumes: Task 2-3 の walker
- Produces: quote → 各行 `> ` prefix / code → ` ```lang ` フェンス（children の text + linebreak を素の文字列で連結）/ table → `|` 区切り + 先頭行の後に `| --- |` セパレータ / horizontalrule → `---`

- [ ] **Step 1: 失敗するテストを追記**

````ts
// to-markdown.test.ts に追記
describe('lexicalToMarkdown: quote/code/table/hr', () => {
  it('prefixes quote lines with >', () => {
    const body = state({ type: 'quote', children: [text('一行目'), { type: 'linebreak' }, text('二行目')] });
    expect(lexicalToMarkdown(body, opts)).toBe('> 一行目\n> 二行目');
  });

  it('renders fenced code blocks with language', () => {
    const body = state({ type: 'code', language: 'ts', children: [text('const a = 1;'), { type: 'linebreak' }, text('const b = 2;')] });
    expect(lexicalToMarkdown(body, opts)).toBe('```ts\nconst a = 1;\nconst b = 2;\n```');
  });

  it('renders a fence without language when language is absent', () => {
    const body = state({ type: 'code', children: [text('plain')] });
    expect(lexicalToMarkdown(body, opts)).toBe('```\nplain\n```');
  });

  it('renders tables with a separator after the first row', () => {
    const cell = (value: string, headerState = 0) => ({ type: 'tablecell', headerState, children: [paragraph(text(value))] });
    const row = (...cells: readonly unknown[]) => ({ type: 'tablerow', children: cells });
    const body = state({ type: 'table', children: [row(cell('名前', 2), cell('値', 2)), row(cell('a'), cell('b'))] });
    expect(lexicalToMarkdown(body, opts)).toBe('| 名前 | 値 |\n| --- | --- |\n| a | b |');
  });

  it('renders horizontalrule as ---', () => {
    const body = state(paragraph(text('上')), { type: 'horizontalrule' }, paragraph(text('下')));
    expect(lexicalToMarkdown(body, opts)).toBe('上\n\n---\n\n下');
  });
});
````

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/utils/lexical/to-markdown`
Expected: 新規 5 tests が FAIL

- [ ] **Step 3: 実装を追記**

```ts
// Raw text of a code block: text nodes joined verbatim, linebreak → '\n'
// (no inline formatting inside a fence).
const renderCodeText = (nodes: readonly unknown[]): string => {
  return nodes.map((node) => (typeOf(node) === 'linebreak' ? '\n' : (stringOf(node, 'text') ?? ''))).join('');
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

// renderBlock の switch に case を追加:
//   case 'quote': {
//     const inline = renderInline(childrenOf(node), opts);
//     return inline === '' ? undefined : inline.split('\n').map((line) => `> ${line}`).join('\n');
//   }
//   case 'code': {
//     const lang = stringOf(node, 'language') ?? '';
//     return `\`\`\`${lang}\n${renderCodeText(childrenOf(node))}\n\`\`\``;
//   }
//   case 'table':
//     return renderTable(node, opts);
//   case 'horizontalrule':
//     return '---';
```

注意: `renderBlock` と `renderTableCell` が相互参照になるため、両方とも同一ファイル内の `const` 宣言順に注意（`renderTableCell` / `renderTable` を `renderBlock` より先に宣言し、`renderBlock` から呼ぶ。`renderTableCell` 内の `renderBlock` 参照は関数実行時に解決されるので宣言順で TDZ にはならない — ファイル内で両方定義されていれば良い。oxlint の no-use-before-define が指摘する場合は `renderTableCell` を `renderBlock` の後に置き、`renderBlock` から呼ぶ側を関数化する）。

- [ ] **Step 4: グリーン確認**

Run: `pnpm vitest run src/utils/lexical/to-markdown`
Expected: PASS（17 tests）

- [ ] **Step 5: Commit**

```bash
git add src/utils/lexical/to-markdown
git commit -m "feat: lexicalToMarkdown に quote/code/table/hr を追加"
```

---

### Task 5: lexicalToMarkdown — upload + image-row ブロック

**Files:**

- Modify: `src/utils/lexical/to-markdown/index.ts`
- Modify: `src/utils/lexical/to-markdown/to-markdown.test.ts`

**Interfaces:**

- Consumes: Task 2-4 の walker
- Produces: upload（populated image）→ `![alt](絶対URL)` + caption 行（`fields.caption` 優先、fallback alt。converters/upload と同じポリシー）。非画像 upload → `[filename](絶対URL)`。未 populate（数値 id）→ skip。`image-row` ブロック → セルごとに `![caption](絶対URL)` を改行で連結

- [ ] **Step 1: 失敗するテストを追記**

```ts
// to-markdown.test.ts に追記
describe('lexicalToMarkdown: upload & image-row', () => {
  const media = { url: '/api/media/file/cat.jpg', alt: '猫', mimeType: 'image/jpeg', width: 800, height: 450 };

  it('renders a populated image upload as absolute-URL image with caption line', () => {
    const body = state({ type: 'upload', value: media, fields: { caption: '飼い猫' } });
    expect(lexicalToMarkdown(body, opts)).toBe('![猫](https://example.com/api/media/file/cat.jpg)\n*飼い猫*');
  });

  it('falls back to alt as caption and skips unpopulated uploads', () => {
    const body = state({ type: 'upload', value: media }, { type: 'upload', value: 42 });
    expect(lexicalToMarkdown(body, opts)).toBe('![猫](https://example.com/api/media/file/cat.jpg)\n*猫*');
  });

  it('renders non-image uploads as file links', () => {
    const body = state({ type: 'upload', value: { url: '/api/media/file/tool.zip', mimeType: 'application/zip', filename: 'tool.zip' } });
    expect(lexicalToMarkdown(body, opts)).toBe('[tool.zip](https://example.com/api/media/file/tool.zip)');
  });

  it('renders image-row block cells as stacked images', () => {
    const body = state({
      type: 'block',
      fields: {
        blockType: 'image-row',
        cells: [
          { image: media, caption: '左' },
          { image: { ...media, url: '/api/media/file/dog.jpg', alt: '犬' } },
        ],
      },
    });
    expect(lexicalToMarkdown(body, opts)).toBe('![猫](https://example.com/api/media/file/cat.jpg)\n*左*\n![犬](https://example.com/api/media/file/dog.jpg)\n*犬*');
  });

  it('skips unknown block types', () => {
    const body = state({ type: 'block', fields: { blockType: 'future-block' } }, paragraph(text('生存')));
    expect(lexicalToMarkdown(body, opts)).toBe('生存');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/utils/lexical/to-markdown`
Expected: 新規 5 tests が FAIL

- [ ] **Step 3: 実装を追記**

```ts
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

// renderBlock の switch に case を追加:
//   case 'upload':
//     return renderUpload(node, opts);
//   case 'block': {
//     const fields = isObject(node) && isObject(node.fields) ? node.fields : undefined;
//     if (fields === undefined) return undefined;
//     if (fields.blockType === 'image-row') return renderImageRow(fields, opts);
//     return undefined;
//   }
```

- [ ] **Step 4: グリーン確認 + 全体回帰**

Run: `pnpm vitest run src/utils/lexical`
Expected: PASS（to-markdown 22 tests + 既存 extract-plain-text / first-image-src がグリーン）

- [ ] **Step 5: Commit**

```bash
git add src/utils/lexical/to-markdown
git commit -m "feat: lexicalToMarkdown に upload/image-row を追加し変換を完成"
```

---

### Task 6: blog ビルダー（詳細 + 一覧）

**Files:**

- Create: `src/app/(site)/blog/_lib/build-post-markdown/index.ts`
- Create: `src/app/(site)/blog/_lib/build-post-markdown/build-post-markdown.test.ts`
- Create: `src/app/(site)/blog/_lib/build-blog-index-markdown/index.ts`
- Create: `src/app/(site)/blog/_lib/build-blog-index-markdown/build-blog-index-markdown.test.ts`

**Interfaces:**

- Consumes: `formatFrontmatter`（Task 1）、`lexicalToMarkdown`（Task 2-5）、`Post` 型（`src/app/(site)/blog/_lib/post` — フィールド: `slug` `title` `date` `excerpt` `readMin` `body?`）
- Produces: `buildPostMarkdown(post: Post, baseUrl: string): string`（frontmatter: title/date/url/excerpt/readMin → `# title` → body md、末尾改行 1 つ）
- Produces: `buildBlogIndexMarkdown(posts: readonly Post[], baseUrl: string): string`（`# blog` + `- YYYY-MM-DD — [title](url.md) — excerpt` 行、末尾改行 1 つ）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// build-post-markdown.test.ts
import { describe, expect, it } from 'vitest';

import { buildPostMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Post } from '../post';

const BASE = 'https://example.com';

const body = { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: '本文です', format: 0 }] }] } } as unknown as SerializedEditorState;

const post: Post = { id: '1', slug: 'v3-renewal', index: '01', title: 'v3.0.0 制作記', readMin: 5, date: '2026-01-01', excerpt: 'リニューアルの記録', body };

describe('buildPostMarkdown', () => {
  it('renders frontmatter, H1 title, and converted body', () => {
    expect(buildPostMarkdown(post, BASE)).toBe(
      ['---', 'title: "v3.0.0 制作記"', 'date: "2026-01-01"', 'url: "https://example.com/blog/v3-renewal"', 'excerpt: "リニューアルの記録"', 'readMin: 5', '---', '', '# v3.0.0 制作記', '', '本文です', ''].join('\n'),
    );
  });

  it('falls back to the excerpt when the body is absent', () => {
    const teaser: Post = { ...post, body: undefined };
    expect(buildPostMarkdown(teaser, BASE)).toContain('# v3.0.0 制作記\n\nリニューアルの記録\n');
  });
});
```

```ts
// build-blog-index-markdown.test.ts
import { describe, expect, it } from 'vitest';

import { buildBlogIndexMarkdown } from '.';

import type { Post } from '../post';

const BASE = 'https://example.com';

const post = (slug: string, title: string, date: string, excerpt: string): Post => ({ id: slug, slug, index: '01', title, readMin: 3, date, excerpt });

describe('buildBlogIndexMarkdown', () => {
  it('renders a heading and one linked line per post', () => {
    const posts = [post('b', '記事B', '2026-02-01', '概要B'), post('a', '記事A', '2026-01-01', '概要A')];
    expect(buildBlogIndexMarkdown(posts, BASE)).toBe(['# blog', '', '- 2026-02-01 — [記事B](https://example.com/blog/b.md) — 概要B', '- 2026-01-01 — [記事A](https://example.com/blog/a.md) — 概要A', ''].join('\n'));
  });

  it('renders an empty-state line when there are no posts', () => {
    expect(buildBlogIndexMarkdown([], BASE)).toBe('# blog\n\nNo entries yet.\n');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run "src/app/(site)/blog/_lib"`
Expected: 新規テストのみ FAIL（既存 find-post / adjacent-posts はグリーン）

- [ ] **Step 3: 実装**

```ts
// build-post-markdown/index.ts
import { lexicalToMarkdown } from '@utils/lexical/to-markdown';
import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { Post } from '../post';

/** One blog post as a standalone markdown document (`/blog/{slug}.md`). Pure. */
export const buildPostMarkdown = (post: Post, baseUrl: string): string => {
  const url = new URL(`/blog/${post.slug}`, baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: post.title, date: post.date, url, excerpt: post.excerpt, readMin: post.readMin });
  const body = lexicalToMarkdown(post.body, { baseUrl });
  const content = body === '' ? post.excerpt : body;

  return `${[frontmatter, `# ${post.title}`, content].join('\n\n')}\n`;
};
```

```ts
// build-blog-index-markdown/index.ts
import type { Post } from '../post';

const entryLine = (post: Post, baseUrl: string): string => {
  const url = new URL(`/blog/${post.slug}.md`, baseUrl).toString();

  return `- ${post.date} — [${post.title}](${url}) — ${post.excerpt}`;
};

/** The blog index as markdown (`/blog.md`): one linked line per published post. Pure. */
export const buildBlogIndexMarkdown = (posts: readonly Post[], baseUrl: string): string => {
  if (posts.length === 0) return '# blog\n\nNo entries yet.\n';

  return `${['# blog', '', ...posts.map((post) => entryLine(post, baseUrl))].join('\n')}\n`;
};
```

- [ ] **Step 4: グリーン確認**

Run: `pnpm vitest run "src/app/(site)/blog/_lib"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/blog/_lib/build-post-markdown" "src/app/(site)/blog/_lib/build-blog-index-markdown"
git commit -m "feat: blog の .md ビルダー (詳細/一覧) を追加"
```

---

### Task 7: news ビルダー（詳細 + 一覧）

**Files:**

- Create: `src/app/(site)/news/_lib/build-news-item-markdown/index.ts`
- Create: `src/app/(site)/news/_lib/build-news-item-markdown/build-news-item-markdown.test.ts`
- Create: `src/app/(site)/news/_lib/build-news-index-markdown/index.ts`
- Create: `src/app/(site)/news/_lib/build-news-index-markdown/build-news-index-markdown.test.ts`

**Interfaces:**

- Consumes: `formatFrontmatter` / `lexicalToMarkdown` / `NewsItem` 型（`_lib/news-item` — `slug` `date` `category` `title` `url?` `body?`）/ `isExternalNews`（`_lib/is-external-news`）
- Produces: `buildNewsItemMarkdown(item: NewsItem, baseUrl: string): string`（frontmatter: title/date/category/url → `# title` → body md。body なしは frontmatter + H1 のみ）
- Produces: `buildNewsIndexMarkdown(items: readonly NewsItem[], baseUrl: string): string`（external item は `item.url` へ、internal は `/news/{slug}.md` へリンク）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// build-news-item-markdown.test.ts
import { describe, expect, it } from 'vitest';

import { buildNewsItemMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { NewsItem } from '../news-item';

const BASE = 'https://example.com';
const body = { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'お知らせ本文', format: 0 }] }] } } as unknown as SerializedEditorState;

describe('buildNewsItemMarkdown', () => {
  it('renders frontmatter with category, H1, and body', () => {
    const item: NewsItem = { id: '1', slug: 'gig-0801', date: '2026-08-01', category: 'gig', title: '出演告知', body };
    expect(buildNewsItemMarkdown(item, BASE)).toBe(['---', 'title: "出演告知"', 'date: "2026-08-01"', 'category: "gig"', 'url: "https://example.com/news/gig-0801"', '---', '', '# 出演告知', '', 'お知らせ本文', ''].join('\n'));
  });

  it('renders frontmatter + H1 only when the body is absent', () => {
    const item: NewsItem = { id: '2', slug: 'short', date: '2026-08-02', category: 'info', title: '短報' };
    expect(buildNewsItemMarkdown(item, BASE)).toBe(['---', 'title: "短報"', 'date: "2026-08-02"', 'category: "info"', 'url: "https://example.com/news/short"', '---', '', '# 短報', ''].join('\n'));
  });
});
```

```ts
// build-news-index-markdown.test.ts
import { describe, expect, it } from 'vitest';

import { buildNewsIndexMarkdown } from '.';

import type { NewsItem } from '../news-item';

const BASE = 'https://example.com';

describe('buildNewsIndexMarkdown', () => {
  it('links internal items to their .md and external items to their url', () => {
    const items: readonly NewsItem[] = [
      { id: '1', slug: 'internal', date: '2026-08-01', category: 'gig', title: '内部告知' },
      { id: '2', slug: 'external', date: '2026-07-01', category: 'release', title: '外部リリース', url: 'https://booth.pm/x' },
    ];
    expect(buildNewsIndexMarkdown(items, BASE)).toBe(['# news', '', '- 2026-08-01 — [内部告知](https://example.com/news/internal.md) (gig)', '- 2026-07-01 — [外部リリース](https://booth.pm/x) (release)', ''].join('\n'));
  });

  it('renders an empty-state line when there is no news', () => {
    expect(buildNewsIndexMarkdown([], BASE)).toBe('# news\n\nNo entries yet.\n');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run "src/app/(site)/news/_lib"`
Expected: 新規テストのみ FAIL

- [ ] **Step 3: 実装**

```ts
// build-news-item-markdown/index.ts
import { lexicalToMarkdown } from '@utils/lexical/to-markdown';
import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { NewsItem } from '../news-item';

/** One news item as a standalone markdown document (`/news/{slug}.md`). Pure. */
export const buildNewsItemMarkdown = (item: NewsItem, baseUrl: string): string => {
  const url = new URL(`/news/${item.slug}`, baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: item.title, date: item.date, category: item.category, url });
  const body = lexicalToMarkdown(item.body, { baseUrl });
  const sections = body === '' ? [frontmatter, `# ${item.title}`] : [frontmatter, `# ${item.title}`, body];

  return `${sections.join('\n\n')}\n`;
};
```

```ts
// build-news-index-markdown/index.ts
import { isExternalNews } from '../is-external-news';

import type { NewsItem } from '../news-item';

// External items point straight at their off-site url (their detail route 404s);
// internal ones link to the `.md` detail. Mirrors the HTML index's link policy.
const entryLine = (item: NewsItem, baseUrl: string): string => {
  const href = isExternalNews(item) ? (item.url ?? '') : new URL(`/news/${item.slug}.md`, baseUrl).toString();

  return `- ${item.date} — [${item.title}](${href}) (${item.category})`;
};

/** The news index as markdown (`/news.md`). Pure. */
export const buildNewsIndexMarkdown = (items: readonly NewsItem[], baseUrl: string): string => {
  if (items.length === 0) return '# news\n\nNo entries yet.\n';

  return `${['# news', '', ...items.map((item) => entryLine(item, baseUrl))].join('\n')}\n`;
};
```

- [ ] **Step 4: グリーン確認**

Run: `pnpm vitest run "src/app/(site)/news/_lib"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/news/_lib/build-news-item-markdown" "src/app/(site)/news/_lib/build-news-index-markdown"
git commit -m "feat: news の .md ビルダー (詳細/一覧) を追加"
```

---

### Task 8: works ビルダー（詳細 + 一覧）

**Files:**

- Create: `src/app/(site)/works/_lib/build-work-markdown/index.ts`
- Create: `src/app/(site)/works/_lib/build-work-markdown/build-work-markdown.test.ts`
- Create: `src/app/(site)/works/_lib/build-works-index-markdown/index.ts`
- Create: `src/app/(site)/works/_lib/build-works-index-markdown/build-works-index-markdown.test.ts`

**Interfaces:**

- Consumes: `formatFrontmatter` / `lexicalToMarkdown` / `WorkRow` 型（`_lib/work-row` — `slug` `title` `type` `year` `date?` `description?` `body?`）
- Produces: `buildWorkMarkdown(work: WorkRow, baseUrl: string): string`（frontmatter: title/type/year/date?/url → `# title` → description（あれば）→ body md）
- Produces: `buildWorksIndexMarkdown(works: readonly WorkRow[], baseUrl: string): string`（`- [title](url.md) — type · year` 行）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// build-work-markdown.test.ts
import { describe, expect, it } from 'vitest';

import { buildWorkMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { WorkRow } from '../work-row';

const BASE = 'https://example.com';
const body = { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: '制作の話', format: 0 }] }] } } as unknown as SerializedEditorState;

describe('buildWorkMarkdown', () => {
  it('renders frontmatter (with date), H1, description, and body', () => {
    const work: WorkRow = { id: '1', slug: 'vj-tools', no: '01', title: 'VJ tools', type: 'software', year: 2026, date: '2026-03-01', description: 'VJ 用ツール群', body };
    expect(buildWorkMarkdown(work, BASE)).toBe(
      ['---', 'title: "VJ tools"', 'type: "software"', 'year: 2026', 'date: "2026-03-01"', 'url: "https://example.com/works/vj-tools"', '---', '', '# VJ tools', '', 'VJ 用ツール群', '', '制作の話', ''].join('\n'),
    );
  });

  it('omits date/description/body when absent', () => {
    const work: WorkRow = { id: '2', slug: 'flyer', no: '02', title: 'フライヤー', type: 'design', year: 2025 };
    expect(buildWorkMarkdown(work, BASE)).toBe(['---', 'title: "フライヤー"', 'type: "design"', 'year: 2025', 'url: "https://example.com/works/flyer"', '---', '', '# フライヤー', ''].join('\n'));
  });
});
```

```ts
// build-works-index-markdown.test.ts
import { describe, expect, it } from 'vitest';

import { buildWorksIndexMarkdown } from '.';

import type { WorkRow } from '../work-row';

const BASE = 'https://example.com';

describe('buildWorksIndexMarkdown', () => {
  it('renders one linked line per work', () => {
    const works: readonly WorkRow[] = [
      { id: '1', slug: 'vj-tools', no: '01', title: 'VJ tools', type: 'software', year: 2026 },
      { id: '2', slug: 'flyer', no: '02', title: 'フライヤー', type: 'design', year: 2025 },
    ];
    expect(buildWorksIndexMarkdown(works, BASE)).toBe(['# works', '', '- [VJ tools](https://example.com/works/vj-tools.md) — software · 2026', '- [フライヤー](https://example.com/works/flyer.md) — design · 2025', ''].join('\n'));
  });

  it('renders an empty-state line when there are no works', () => {
    expect(buildWorksIndexMarkdown([], BASE)).toBe('# works\n\nNo entries yet.\n');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run "src/app/(site)/works/_lib"`
Expected: 新規テストのみ FAIL

- [ ] **Step 3: 実装**

```ts
// build-work-markdown/index.ts
import { lexicalToMarkdown } from '@utils/lexical/to-markdown';
import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { WorkRow } from '../work-row';

/** One work as a standalone markdown document (`/works/{slug}.md`). Pure. */
export const buildWorkMarkdown = (work: WorkRow, baseUrl: string): string => {
  const url = new URL(`/works/${work.slug}`, baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: work.title, type: work.type, year: work.year, date: work.date, url });
  const body = lexicalToMarkdown(work.body, { baseUrl });
  const sections = [frontmatter, `# ${work.title}`, work.description, body === '' ? undefined : body].filter((section): section is string => section !== undefined && section !== '');

  return `${sections.join('\n\n')}\n`;
};
```

```ts
// build-works-index-markdown/index.ts
import type { WorkRow } from '../work-row';

const entryLine = (work: WorkRow, baseUrl: string): string => {
  const url = new URL(`/works/${work.slug}.md`, baseUrl).toString();

  return `- [${work.title}](${url}) — ${work.type} · ${work.year}`;
};

/** The works index as markdown (`/works.md`). Pure. */
export const buildWorksIndexMarkdown = (works: readonly WorkRow[], baseUrl: string): string => {
  if (works.length === 0) return '# works\n\nNo entries yet.\n';

  return `${['# works', '', ...works.map((work) => entryLine(work, baseUrl))].join('\n')}\n`;
};
```

- [ ] **Step 4: グリーン確認**

Run: `pnpm vitest run "src/app/(site)/works/_lib"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/works/_lib/build-work-markdown" "src/app/(site)/works/_lib/build-works-index-markdown"
git commit -m "feat: works の .md ビルダー (詳細/一覧) を追加"
```

---

### Task 9: about + log ビルダー

**Files:**

- Create: `src/app/(site)/about/_lib/build-about-markdown/index.ts`
- Create: `src/app/(site)/about/_lib/build-about-markdown/build-about-markdown.test.ts`
- Create: `src/app/(site)/log/_lib/build-log-markdown/index.ts`
- Create: `src/app/(site)/log/_lib/build-log-markdown/build-log-markdown.test.ts`

**Interfaces:**

- Consumes: `formatFrontmatter` / `lexicalToMarkdown` / `Profile` 型（`about/_lib/profile` — `name` `aka` `now` `team` `tagline` `bio?` `philosophy?`）/ `LogYearGroup` 型（`log/_lib/build-log-timeline` — `{ year, items: LogEntry[] }`、`LogEntry` は `{ date, meta, title, href?, upcoming }`）
- Produces: `buildAboutMarkdown(profile: Profile | undefined, baseUrl: string): string`（profile 不在時は `Profile is unavailable.` — llms-full.txt と同じ文言）
- Produces: `buildLogMarkdown(groups: readonly LogYearGroup[], baseUrl: string): string`（`# log` + 年ごとに `## {year}` + `- {date} — [title](href) ({meta})`。href が相対なら絶対化、なければリンクなし）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// build-about-markdown.test.ts
import { describe, expect, it } from 'vitest';

import { buildAboutMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Profile } from '../profile';

const BASE = 'https://example.com';
const rich = (value: string) => ({ root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: value, format: 0 }] }] } }) as unknown as SerializedEditorState;

const profile: Profile = { name: 'naporitan', aka: 'napochaan', now: 'エンジニア · DJ · VJ', team: 'StudioGnu', tagline: 'おそろしき、なんでも屋。', bio: rich('自己紹介'), philosophy: rich('哲学'), love: [], skillGroups: [], contacts: [] };

describe('buildAboutMarkdown', () => {
  it('renders frontmatter, profile header lines, bio, and philosophy', () => {
    expect(buildAboutMarkdown(profile, BASE)).toBe(
      ['---', 'title: "naporitan"', 'url: "https://example.com/about"', '---', '', '# naporitan', '', '**naporitan** (napochaan)', '', '> おそろしき、なんでも屋。', '', 'Now: エンジニア · DJ · VJ / Team: StudioGnu', '', '自己紹介', '', '哲学', ''].join('\n'),
    );
  });

  it('reports unavailability when the profile is undefined', () => {
    expect(buildAboutMarkdown(undefined, BASE)).toBe('# about\n\nProfile is unavailable.\n');
  });
});
```

```ts
// build-log-markdown.test.ts
import { describe, expect, it } from 'vitest';

import { buildLogMarkdown } from '.';

import type { LogYearGroup } from '../build-log-timeline';

const BASE = 'https://example.com';

describe('buildLogMarkdown', () => {
  it('renders year sections with linked and plain entries', () => {
    const groups: readonly LogYearGroup[] = [
      {
        year: 2026,
        items: [
          { id: 'work-1', year: 2026, date: '03.01 (日)', meta: 'software', title: 'VJ tools', upcoming: false, href: '/works/vj-tools' },
          { id: 'post-1', year: 2026, date: '02.01 (日)', meta: 'zenn', title: '記事', upcoming: false, href: 'https://zenn.dev/x' },
          { id: 'log-1', year: 2026, date: '01.01 (木)', meta: 'gig', title: '出演', upcoming: false },
        ],
      },
      { year: 2025, items: [{ id: 'log-2', year: 2025, date: '12.31 (水)', meta: 'gig', title: '年末', upcoming: false }] },
    ];
    expect(buildLogMarkdown(groups, BASE)).toBe(
      ['# log', '', '## 2026', '', '- 03.01 (日) — [VJ tools](https://example.com/works/vj-tools) (software)', '- 02.01 (日) — [記事](https://zenn.dev/x) (zenn)', '- 01.01 (木) — 出演 (gig)', '', '## 2025', '', '- 12.31 (水) — 年末 (gig)', ''].join('\n'),
    );
  });

  it('renders an empty-state line when there are no groups', () => {
    expect(buildLogMarkdown([], BASE)).toBe('# log\n\nNo entries yet.\n');
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run "src/app/(site)/about/_lib" "src/app/(site)/log/_lib/build-log-markdown"`
Expected: 新規テストのみ FAIL

- [ ] **Step 3: 実装**

```ts
// build-about-markdown/index.ts
import { lexicalToMarkdown } from '@utils/lexical/to-markdown';
import { formatFrontmatter } from '@utils/markdown/frontmatter';

import type { Profile } from '../profile';

/** The about page as markdown (`/about.md`). Pure. */
export const buildAboutMarkdown = (profile: Profile | undefined, baseUrl: string): string => {
  if (profile === undefined) return '# about\n\nProfile is unavailable.\n';

  const url = new URL('/about', baseUrl).toString();
  const frontmatter = formatFrontmatter({ title: profile.name, url });
  const bio = lexicalToMarkdown(profile.bio, { baseUrl });
  const philosophy = lexicalToMarkdown(profile.philosophy, { baseUrl });
  const sections = [frontmatter, `# ${profile.name}`, `**${profile.name}** (${profile.aka})`, `> ${profile.tagline}`, `Now: ${profile.now} / Team: ${profile.team}`, bio, philosophy].filter((section) => section !== '');

  return `${sections.join('\n\n')}\n`;
};
```

```ts
// build-log-markdown/index.ts
import type { LogEntry, LogYearGroup } from '../build-log-timeline';

const resolveHref = (href: string | undefined, baseUrl: string): string | undefined => {
  if (href === undefined) return undefined;

  return href.startsWith('/') ? new URL(href, baseUrl).toString() : href;
};

const entryLine = (entry: LogEntry, baseUrl: string): string => {
  const href = resolveHref(entry.href, baseUrl);
  const title = href === undefined ? entry.title : `[${entry.title}](${href})`;

  return `- ${entry.date} — ${title} (${entry.meta})`;
};

const yearSection = (group: LogYearGroup, baseUrl: string): string => [`## ${group.year}`, '', ...group.items.map((entry) => entryLine(entry, baseUrl))].join('\n');

/** The activity chronicle as markdown (`/log.md`). Pure. */
export const buildLogMarkdown = (groups: readonly LogYearGroup[], baseUrl: string): string => {
  if (groups.length === 0) return '# log\n\nNo entries yet.\n';

  return `${['# log', '', groups.map((group) => yearSection(group, baseUrl)).join('\n\n')].join('\n')}\n`;
};
```

注意: `LogEntry` が `build-log-timeline` から export されていない場合は export を追加する（既に `export type LogEntry` になっているはず — `src/app/(site)/log/_lib/build-log-timeline/index.ts` を確認）。

- [ ] **Step 4: グリーン確認**

Run: `pnpm vitest run "src/app/(site)/about/_lib" "src/app/(site)/log/_lib"`
Expected: PASS（既存テスト含む）

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/about/_lib/build-about-markdown" "src/app/(site)/log/_lib/build-log-markdown"
git commit -m "feat: about/log の .md ビルダーを追加"
```

---

### Task 10: route handler 8 本 + rewrites

**Files:**

- Create: `src/app/(site)/about.md/route.ts`
- Create: `src/app/(site)/blog.md/route.ts`
- Create: `src/app/(site)/news.md/route.ts`
- Create: `src/app/(site)/log.md/route.ts`
- Create: `src/app/(site)/works.md/route.ts`
- Create: `src/app/(site)/blog/[slug]/md/route.ts`
- Create: `src/app/(site)/news/[slug]/md/route.ts`
- Create: `src/app/(site)/works/[slug]/md/route.ts`
- Modify: `next.config.ts`（redirects の後に rewrites を追加）

**Interfaces:**

- Consumes: Task 1 の `markdownResponse` / `notFoundResponse`、Task 6-9 のビルダー、既存 `findBlogList` / `findBlogBySlug` / `findNewsList` / `findNewsBySlug` / `findWorksList` / `findWorkBySlug` / `findProfile` / `findLogList` / `fetchExternalPosts` / `buildLogTimeline` / `isExternalNews`
- Produces: 公開 URL 8 本（スモークテストは Task 12）

- [ ] **Step 1: next.config.ts に rewrites を追加**

`redirects` ブロックの直後に追加:

```ts
  // `.md` twins of the content pages. Next.js cannot express a partial dynamic
  // segment (`[slug].md`), so the three dynamic URLs rewrite onto nested `md`
  // route handlers. Each rule uses a plain `:slug` (always exactly one segment),
  // which sidesteps the OpenNext `:path*` zero-segment pitfall described above.
  rewrites: async () => [
    { source: '/blog/:slug.md', destination: '/blog/:slug/md' },
    { source: '/news/:slug.md', destination: '/news/:slug/md' },
    { source: '/works/:slug.md', destination: '/works/:slug/md' },
  ],
```

- [ ] **Step 2: 一覧 + about の route handler を作る**

全て `llms-full.txt/route.ts` と同じく `force-dynamic`（`next build` 時に BASE_URL 不在のまま焼き込まない）。

```ts
// src/app/(site)/blog.md/route.ts
import { findBlogList } from '@lib/payload/blog';
import { markdownResponse } from '@utils/markdown/response';

import { buildBlogIndexMarkdown } from '../blog/_lib/build-blog-index-markdown';

// Runtime resolution, mirroring llms.txt: BASE_URL and published content are
// per-request concerns; the findXList reads stay cached via unstable_cache.
export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const posts = await findBlogList();

  return markdownResponse(buildBlogIndexMarkdown(posts, baseUrl));
};
```

```ts
// src/app/(site)/news.md/route.ts
import { findNewsList } from '@lib/payload/news';
import { markdownResponse } from '@utils/markdown/response';

import { buildNewsIndexMarkdown } from '../news/_lib/build-news-index-markdown';

export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const items = await findNewsList();

  return markdownResponse(buildNewsIndexMarkdown(items, baseUrl));
};
```

```ts
// src/app/(site)/works.md/route.ts
import { findWorksList } from '@lib/payload/works';
import { markdownResponse } from '@utils/markdown/response';

import { buildWorksIndexMarkdown } from '../works/_lib/build-works-index-markdown';

export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const works = await findWorksList();

  return markdownResponse(buildWorksIndexMarkdown(works, baseUrl));
};
```

```ts
// src/app/(site)/about.md/route.ts
import { findProfile } from '@lib/payload/profile';
import { markdownResponse } from '@utils/markdown/response';

import { buildAboutMarkdown } from '../about/_lib/build-about-markdown';

export const dynamic = 'force-dynamic';

export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const profile = await findProfile();

  return markdownResponse(buildAboutMarkdown(profile, baseUrl));
};
```

```ts
// src/app/(site)/log.md/route.ts
import { dayjs } from '@utils/dayjs';
import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { markdownResponse } from '@utils/markdown/response';

import { buildLogMarkdown } from '../log/_lib/build-log-markdown';
import { buildLogTimeline } from '../log/_lib/build-log-timeline';
import { fetchExternalPosts } from '../log/_lib/fetch-external-posts';

export const dynamic = 'force-dynamic';

// Assembles the same timeline as the /log page (works + external posts + manual
// log entries), then flattens it to a markdown chronicle.
export const GET = async (): Promise<Response> => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const [works, posts, logs] = await Promise.all([findWorksList(), fetchExternalPosts(), findLogList()]);
  const now = dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD');
  const groups = buildLogTimeline(works, posts, now, logs);

  return markdownResponse(buildLogMarkdown(groups, baseUrl));
};
```

注意: `now` の渡し方は `log-timeline-section/index.tsx` の実装を確認して**そのまま踏襲**する（引数の形式・順序 `buildLogTimeline(works, posts, now, logs)` は現物優先）。

- [ ] **Step 3: 詳細 route handler を作る**

```ts
// src/app/(site)/blog/[slug]/md/route.ts
import { findBlogBySlug } from '@lib/payload/blog';
import { markdownResponse, notFoundResponse } from '@utils/markdown/response';

import { buildPostMarkdown } from '../../_lib/build-post-markdown';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

export const GET = async (_request: Request, { params }: Context): Promise<Response> => {
  const { slug } = await params;
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const post = await findBlogBySlug(slug);
  if (post === undefined) return notFoundResponse();

  return markdownResponse(buildPostMarkdown(post, baseUrl));
};
```

```ts
// src/app/(site)/news/[slug]/md/route.ts
import { findNewsBySlug } from '@lib/payload/news';
import { markdownResponse, notFoundResponse } from '@utils/markdown/response';

import { buildNewsItemMarkdown } from '../../_lib/build-news-item-markdown';
import { isExternalNews } from '../../_lib/is-external-news';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

// External news items have no internal detail page (the HTML route 404s too),
// so their .md twin mirrors that.
export const GET = async (_request: Request, { params }: Context): Promise<Response> => {
  const { slug } = await params;
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const item = await findNewsBySlug(slug);
  if (item === undefined || isExternalNews(item)) return notFoundResponse();

  return markdownResponse(buildNewsItemMarkdown(item, baseUrl));
};
```

```ts
// src/app/(site)/works/[slug]/md/route.ts
import { findWorkBySlug } from '@lib/payload/works';
import { markdownResponse, notFoundResponse } from '@utils/markdown/response';

import { buildWorkMarkdown } from '../../_lib/build-work-markdown';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slug: string }> };

export const GET = async (_request: Request, { params }: Context): Promise<Response> => {
  const { slug } = await params;
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const work = await findWorkBySlug(slug);
  if (work === undefined) return notFoundResponse();

  return markdownResponse(buildWorkMarkdown(work, baseUrl));
};
```

注意: news の HTML 詳細ページ（`src/app/(site)/news/[slug]/page.tsx`）が external item をどう扱っているか確認し、404 条件を**現物に合わせる**（isExternalNews で notFound していなければ .md 側も合わせて素直に返す）。

- [ ] **Step 4: lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/about.md" "src/app/(site)/blog.md" "src/app/(site)/news.md" "src/app/(site)/log.md" "src/app/(site)/works.md" "src/app/(site)/blog/[slug]/md" "src/app/(site)/news/[slug]/md" "src/app/(site)/works/[slug]/md" next.config.ts
git commit -m "feat: .md エンドポイント 8 本と動的 rewrite を配線"
```

---

### Task 11: `<link rel="alternate" type="text/markdown">` 導線

**Files:**

- Modify: `src/utils/seo/resolve-section-metadata/index.ts`
- Modify: `src/utils/seo/resolve-section-metadata/resolve-section-metadata.test.ts`
- Modify: `src/utils/seo/resolve-detail-metadata/index.ts`
- Modify: `src/utils/seo/resolve-detail-metadata/resolve-detail-metadata.test.ts`
- Modify: `src/app/(site)/about/page.tsx`（`resolveSectionMetadata` 呼び出しに `markdown: '/about.md'`）
- Modify: `src/app/(site)/blog/(index)/page.tsx`（`markdown: '/blog.md'`）
- Modify: `src/app/(site)/news/(index)/page.tsx`（`markdown: '/news.md'`）
- Modify: `src/app/(site)/works/(index)/page.tsx`（`markdown: '/works.md'`）
- Modify: `src/app/(site)/log/page.tsx`（`markdown: '/log.md'`）
- Modify: `src/app/(site)/blog/[slug]/page.tsx`（`resolveDetailMetadata` に `markdown: \`/blog/${slug}.md\``）
- Modify: `src/app/(site)/news/[slug]/page.tsx`（`markdown: \`/news/${slug}.md\``）
- Modify: `src/app/(site)/works/[slug]/page.tsx`（`markdown: \`/works/${slug}.md\``）

**Interfaces:**

- Consumes: 既存 `ResolveSectionMetadataArgs` / `ResolveDetailMetadataArgs`
- Produces: 両ヘルパに省略可能な `markdown?: string`（.md の相対パス）。指定時に `alternates.types['text/markdown']` を出力。未指定なら従来出力と完全一致（後方互換）

- [ ] **Step 1: 失敗するテストを追記**

`resolve-section-metadata.test.ts` に追加:

```ts
it('adds a text/markdown alternate when markdown is given', () => {
  const result = resolveSectionMetadata({ docTitle: 'blog', path: '/blog', markdown: '/blog.md' });
  expect(result.alternates?.types).toMatchObject({ 'text/markdown': [{ url: '/blog.md', title: 'blog' }] });
  // canonical is preserved
  expect(result.alternates?.canonical).toBe('/blog');
});

it('keeps the rss alternate alongside the markdown one', () => {
  const result = resolveSectionMetadata({ docTitle: 'blog', path: '/blog', feed: { url: '/blog/rss.xml', title: 'blog feed' }, markdown: '/blog.md' });
  expect(result.alternates?.types).toMatchObject({
    'application/rss+xml': [{ url: '/blog/rss.xml', title: 'blog feed' }],
    'text/markdown': [{ url: '/blog.md', title: 'blog' }],
  });
});
```

`resolve-detail-metadata.test.ts` に追加:

```ts
it('adds a text/markdown alternate when markdown is given', () => {
  const result = resolveDetailMetadata({ docTitle: 't', path: '/blog/x', genericDescription: 'g', defaultImage: '/og.png', markdown: '/blog/x.md' });
  expect(result.alternates).toMatchObject({ canonical: '/blog/x', types: { 'text/markdown': [{ url: '/blog/x.md', title: 't' }] } });
});

it('emits canonical-only alternates when markdown is absent', () => {
  const result = resolveDetailMetadata({ docTitle: 't', path: '/blog/x', genericDescription: 'g', defaultImage: '/og.png' });
  expect(result.alternates).toEqual({ canonical: '/blog/x' });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/utils/seo`
Expected: 新規 4 tests が FAIL

- [ ] **Step 3: ヘルパを拡張**

`resolve-section-metadata/index.ts` — args に `markdown?: string` を追加し、`buildAlternates` を差し替え:

```ts
export type ResolveSectionMetadataArgs = {
  docTitle: string;
  description?: string;
  path: string;
  feed?: Feed;
  image?: string;
  // Optional path of the page's `.md` twin, surfaced as a text/markdown alternate.
  markdown?: string;
};

const buildAlternates = (args: ResolveSectionMetadataArgs): Metadata['alternates'] => {
  const rss = args.feed === undefined ? {} : { 'application/rss+xml': [{ url: args.feed.url, title: args.feed.title }] };
  const md = args.markdown === undefined ? {} : { 'text/markdown': [{ url: args.markdown, title: args.docTitle }] };
  const types = { ...rss, ...md };

  if (Object.keys(types).length === 0) return { canonical: args.path };

  return { canonical: args.path, types };
};
```

呼び出し側 `resolveSectionMetadata` 内の `alternates: buildAlternates(args.path, args.feed)` を `alternates: buildAlternates(args)` に変更。

`resolve-detail-metadata/index.ts` — args に `markdown?: string` を追加し、`alternates: { canonical: args.path }`（93 行目付近）を:

```ts
    alternates: args.markdown === undefined ? { canonical: args.path } : { canonical: args.path, types: { 'text/markdown': [{ url: args.markdown, title: args.docTitle }] } },
```

- [ ] **Step 4: グリーン確認**

Run: `pnpm vitest run src/utils/seo`
Expected: PASS（既存テスト含む全件）

- [ ] **Step 5: 8 ページに markdown 引数を配線**

各ページの `resolveSectionMetadata({...})` / `resolveDetailMetadata({...})` 呼び出しに 1 行追加するだけ（値は Files 欄に記載の通り）。詳細ページ 3 つは `slug` が同スコープに await 済みで存在する（`const { slug } = await params;` の後）。

- [ ] **Step 6: lint + typecheck + 全テスト**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 全て PASS（ベースライン 886 passed / 1 skipped + 本 PR の追加分）

- [ ] **Step 7: Commit**

```bash
git add src/utils/seo "src/app/(site)"
git commit -m "feat: HTML ページに text/markdown alternate 導線を追加"
```

---

### Task 12: 実機スモークテスト（build + next start）

**Files:** なし（検証のみ。修正が出た場合は該当タスクのファイルへ）

**Interfaces:**

- Consumes: Task 1-11 の全成果物

- [ ] **Step 1: migrate + build**

```bash
pnpm payload migrate && pnpm build
```

Expected: build 成功。route 一覧に `/about.md` `/blog.md` `/news.md` `/log.md` `/works.md`（ƒ = dynamic）と `/blog/[slug]/md` `/news/[slug]/md` `/works/[slug]/md` が現れる

- [ ] **Step 2: next start でスモーク**

（`pnpm start -- -p` は罠 — `-p` がディレクトリ引数扱いされる。`pnpm exec next start` を使う）

```bash
pnpm exec next start -p 3001 &
sleep 3
for path in /about.md /blog.md /news.md /log.md /works.md; do
  echo "== $path"; curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "http://localhost:3001$path"
done
# 動的ルート: seed 済みの実 slug を 1 つ使う（/blog.md の出力から拾う）
curl -s "http://localhost:3001/blog.md" | head -5
# 例: curl -s -D - "http://localhost:3001/blog/<実slug>.md" | head -20
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3001/blog/no-such-post.md"   # 404 を期待
kill %1
```

Expected:

- 静的 5 URL → `200 text/markdown; charset=utf-8`
- `/blog/<実slug>.md` → 200、frontmatter `---` で始まる本文
- 存在しない slug → `404`
- `<link rel="alternate" type="text/markdown"` が HTML に出る: `curl -s http://localhost:3001/blog | grep -o 'text/markdown[^>]*'`

- [ ] **Step 3: 問題があれば該当タスクに戻って修正 → 再検証**

特に確認する既知リスク:

- rewrite `/blog/:slug.md` が `next start` で効くか（path-to-regexp の suffix マッチ）。効かない場合は `source: '/blog/:slug(.md)'` 形式ではなく、`source: '/blog/:slug((?:[^/]+?))\\.md'` 等の regex 形式を検討し、変更したら必ず再スモーク
- `/blog.md` が `(site)` の layout に食われず route handler に解決されるか（llms.txt 前例があるので低リスク）

- [ ] **Step 4: 最終確認 + Commit（修正があった場合）**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add -A && git commit -m "fix: スモークテストで見つかった問題の修正"   # 修正があった場合のみ
```

---

## 完了後

`superpowers:finishing-a-development-branch` に従う。PR を出す前に difit でユーザーレビューを依頼する（CLAUDE.md ルール）。PR 本文の検証結果に curl 出力を貼る。

## Self-Review 済み事項

- spec の全要件（8 URL / rewrite 3 本 / 完全 markdown 変換 / frontmatter / 一覧リンク形式 / alternates 導線 / 404 / force-dynamic / TDD）に対応するタスクあり
- 命名は全タスクで一貫: `formatFrontmatter` / `markdownResponse` / `notFoundResponse` / `lexicalToMarkdown` / `buildPostMarkdown` / `buildBlogIndexMarkdown` / `buildNewsItemMarkdown` / `buildNewsIndexMarkdown` / `buildWorkMarkdown` / `buildWorksIndexMarkdown` / `buildAboutMarkdown` / `buildLogMarkdown`
- 「MD」ではなく「Markdown」を識別子に使う（acronym-casing ルールの適用対象外の普通語として扱う）
