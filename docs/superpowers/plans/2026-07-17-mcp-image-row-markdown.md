# image-row Markdown round-trip (MCP 本文編集) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** image-row block を含む blog 記事を MCP の create_post/update_post で本文編集でき、get_post が本文を返せるようにする。

**Architecture:** `ImageRow` block 定義に Payload の `jsx: { customStartRegex, customEndRegex, export, import }` を追加し、```image-row フェンス構文を Markdown⇔Lexical で round-trip させる。MCP の guard(findRawImageRefs / hasUnsupportedBlocks)を image-row 対応にし、フェンス整合性 + media 存在チェックを tool 層に足す。

**Tech Stack:** `@payloadcms/richtext-lexical` 3.84.1 の `BlocksFeature` block.jsx / `convertMarkdownToLexical` / `convertLexicalToMarkdown`、`bson-objectid`(cell id 生成)、vitest node unit。

**Spec:** `docs/superpowers/specs/2026-07-17-mcp-image-row-markdown-design.md`

## Global Constraints

- 専用構文: ` ```image-row ` フェンス。中は**ちょうど2行**の `![media:<id>](<caption>)`(id は数字、caption 省略時 `![media:<id>]()`)。image-row は2セル固定。
- `jsx` 追加は runtime config のみ = **DB schema 変更なし・migration 不要**。admin UI / front-end 描画に影響させない。
- repo rules: arrow function のみ / `let`・IIFE・`forEach`・non-null assertion・`any` 禁止 / 非 boolean への truthiness 判定禁止(`.test()`/`.includes()` は boolean を返すので `!` 可) / early return / colocation / template literal で文字列化。
- 既存の MCP tool は英語ではなく日本語メッセージ(現状のまま統一)。新規メッセージも周囲に合わせる。
- テスト振り分け: `src/**/*.test.ts` = node unit。`@payload-config` を node unit で import すると wrangler proxy 初期化で落ちるため、**editorConfig を要する round-trip は unit で回さず**、pure 関数(export/import ロジック・guard)を単体テストし、実 round-trip は Task 1 のスパイク script と最終 staging E2E で確認する。
- 確定事実(調査済み・実装中に疑わない):
  - `BlocksFeature` は各 block の `jsx` を検出して markdown transformer を自動登録する。`convertMarkdownToLexical`/`convertLexicalToMarkdown` は `editorConfig.features.markdownTransformers` のみ読む(追加 transformer 引数は無い)。
  - `customEndRegex` を設定すると JSX タグ用パーサを迂回し、`MultilineElementTransformer` 契約(`replace(rootNode, children, startMatch, endMatch, linesInBetween, isImport)`)に落ちる。`jsx.import` 内で `props` を無視し `openMatch`/`children` から自前解析してよい。
  - `$createServerBlockNode` は top-level block `id` を自動生成。`blockType` も呼び出し側が付与するので、`jsx.import` の返り値は **block 自身の fields のみ**(`{ cells: [...] }`)、`id`/`blockType` は含めない。
  - cell(array-row)の `id` 自動採番は未確認 → `bson-objectid` で明示生成する。
  - image-row の Lexical node: `{type:'block',version:2,fields:{id,blockName:'',cells:[{id,image:<number>,caption?},{...}],blockType:'image-row'}}`。

---

### Task 1: スパイク — ImageRow に jsx を付けて実 config で round-trip を確定する

**目的:** spec の未解決事項(非 JSX の customRegex 経路、import が `children` か `linesInBetween` か、export の返り値形)を**実データで確定**し、以降のタスクが乗る jsx 契約を固める。これは feasibility ゲート。

**Files:**

- Modify: `src/blocks/image-row/index.ts`(`jsx` 追加)
- Create: `scripts/verify-image-row-roundtrip.ts`(検証用・後で削除可)
- Modify: `package.json`(`bson-objectid` を直接依存化 / 検証 script 実行用メモは不要)

**Interfaces:**

- Produces: `ImageRow.jsx.export` / `ImageRow.jsx.import` の**確定した実装**。export が返す文字列形(フェンス全体 or content のみ)を Task 2 のテストが参照する。

- [ ] **Step 1: bson-objectid を直接依存化**

```bash
pnpm add bson-objectid
```

Expected: dependencies に入る(既に transitive にあるので lockfile 差分は小さい)。

- [ ] **Step 2: ImageRow に jsx を追加(第一版)**

`src/blocks/image-row/index.ts` の `ImageRow` に `jsx` を足す。`fields` の前後は不変。ファイル冒頭に import を追加:

````typescript
import ObjectID from 'bson-objectid';

import type { Block } from 'payload';

// フェンス開始/終了。customEndRegex を設定することで JSX タグ用パーサを迂回し、
// MultilineElementTransformer 契約でフェンス構文を扱う。
const FENCE_START = /^```image-row\s*$/;
const FENCE_END = /^```\s*$/;
const CELL_LINE = /^\s*!\[media:(\d+)\]\((.*)\)\s*$/;

type ImageRowCell = { id: string; image: number; caption?: string };

// フェンス内の1行を cell に。マッチしなければ undefined。
const parseCellLine = (line: string): ImageRowCell | undefined => {
  const match = line.match(CELL_LINE);
  if (match === null) return undefined;
  const image = parseInt(match[1] ?? '', 10);
  if (Number.isNaN(image)) return undefined;
  const caption = (match[2] ?? '').trim();
  return caption.length > 0 ? { id: ObjectID().toHexString(), image, caption } : { id: ObjectID().toHexString(), image };
};

const cellToLine = (cell: { image: number | { id: number }; caption?: string | null }): string => {
  const id = typeof cell.image === 'number' ? cell.image : cell.image.id;
  const caption = cell.caption ?? '';
  return `![media:${id}](${caption})`;
};
````

`ImageRow` object に `jsx` プロパティを追加(`fields` と同階層):

```typescript
  jsx: {
    customStartRegex: FENCE_START,
    customEndRegex: FENCE_END,
    // Lexical block node → フェンス文字列。fields.cells[0/1] から組む。
    export: ({ fields }: { fields: { cells?: { image: number | { id: number }; caption?: string | null }[] } }) => {
      const cells = fields.cells ?? [];
      const lines = cells.map(cellToLine).join('\n');
      return `\`\`\`image-row\n${lines}\n\`\`\``;
    },
    // フェンス内容 → block fields。children はフェンス内の複数行文字列。
    import: ({ children }: { children: string }) => {
      const cells = children
        .split('\n')
        .map((line) => parseCellLine(line))
        .filter((cell): cell is ImageRowCell => cell !== undefined);
      if (cells.length !== 2) return false;
      return { cells };
    },
  },
```

型メモ: `satisfies Block` を維持しつつ `jsx` を足す。`BlockJSX` の型に厳密に合わせる必要があるので、typecheck が通らなければ `export`/`import` の引数型を `@payloadcms/richtext-lexical` or `payload` の `BlockJSX` に合わせる(spec 参照)。合わない場合は引数を緩め(`(args: { fields: any })` は `any` 禁止なので `Record<string, unknown>` + narrow)。

- [ ] **Step 3: 検証 script を書く**

`scripts/verify-image-row-roundtrip.ts`:

````typescript
import { convertLexicalToMarkdown, convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';

import { getPayloadClient } from '../src/lib/payload/client';

const MD = ['# heading', '', 'intro paragraph', '', '```image-row', '![media:79](left cap)', '![media:78]()', '```', '', 'outro paragraph'].join('\n');

const main = async (): Promise<void> => {
  const payload = await getPayloadClient();
  const editorConfig = await editorConfigFactory.default({ config: payload.config });

  const lexical = convertMarkdownToLexical({ editorConfig, markdown: MD });
  const blockNodes = JSON.stringify(lexical).match(/"blockType":"image-row"/g) ?? [];
  console.log('block nodes:', blockNodes.length);
  console.log('lexical (image-row node):', JSON.stringify((lexical.root.children as { type: string }[]).find((n) => n.type === 'block'), null, 2));

  const back = convertLexicalToMarkdown({ editorConfig, data: lexical });
  console.log('--- round-trip markdown ---');
  console.log(back);
  console.log('--- contains fence:', back.includes('```image-row'), '| contains media:79:', back.includes('media:79'));
};

await main();
````

- [ ] **Step 4: 検証 script を実行して round-trip を確認**

Run: `pnpm payload run scripts/verify-image-row-roundtrip.ts`
Expected: `block nodes: 1`、image-row node の `cells` が `[{image:79,caption:'left cap'},{image:78}]`(cell id 付き)、round-trip markdown が ```image-row フェンスを含み、位置(heading/intro の後、outro の前)が保たれる。

**うまくいかない場合の調整(spec の未解決事項):**

- import に `children` が来ず `linesInBetween`(配列)で来る場合 → import 引数を `({ children, ...rest })` にして実際に渡る引数を `console.log` で確認し、そのフィールドから行配列を得る。
- export の返り値が `{ children, props }` を要求される / フェンスが二重になる場合 → 返り値を content のみ(`lines`)や `{ children: lines }` に変え、フェンスは transformer 側が付けるか実挙動で確認して合わせる。
- customStartRegex が openMatch を要求する形(capture group)なら合わせる。
- **確定した export 返り値形と import 引数を、この Task の実装コメントに1行で残す**(Task 2 のテストが参照)。

- [ ] **Step 5: typecheck / lint**

Run: `pnpm typecheck && pnpm lint`
Expected: clean(`jsx` の型が通る)。

- [ ] **Step 6: Commit**

```bash
pnpm lint && pnpm typecheck
git add src/blocks/image-row/index.ts scripts/verify-image-row-roundtrip.ts package.json pnpm-lock.yaml
git commit -m "feat: ImageRow に image-row フェンスの markdown round-trip(jsx)を追加"
```

---

### Task 2: MCP guard の image-row 対応(markdown モジュール)

**Files:**

- Modify: `src/lib/mcp/markdown/index.ts`
- Modify: `src/lib/mcp/markdown/markdown.test.ts`

**Interfaces:**

- Consumes: Task 1 で確定した ```image-row フェンス構文。
- Produces:
  - `findRawImageRefs(markdown)` — `![media:<数字>](...)` を除外して生 URL 画像のみ返す(既存名・挙動修正)。
  - `hasUnsupportedBlocks(body)` — `image-row` を対応済みとし、それ以外の block/inlineBlock がある時だけ true。
  - `validateImageRowFences(markdown: string): string[]` — 各フェンスが2行の `![media:<数字>](...)` でなければ回復指示メッセージを返す(新規)。
  - `extractImageRowMediaIDs(markdown: string): number[]` — 全フェンスの cell media id を列挙(新規、Task 3 の存在チェック用)。

- [ ] **Step 1: 失敗するテストを追記**

`src/lib/mcp/markdown/markdown.test.ts` の既存 describe 群に追加:

````typescript
import { describe, expect, it } from 'vitest';

import { extractImageRowMediaIDs, findRawImageRefs, hasUnsupportedBlocks, validateImageRowFences } from '.';

import type { Blog } from '@payload-types';

const bodyWith = (children: unknown[]): Blog['body'] =>
  ({ root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 } }) as Blog['body'];

const FENCE = ['```image-row', '![media:79](left)', '![media:78]()', '```'].join('\n');

describe('findRawImageRefs (image-row aware)', () => {
  it('excludes image-row cell lines with captions', () => {
    expect(findRawImageRefs('![media:79](left cap)')).toEqual([]);
  });

  it('excludes empty-paren media refs', () => {
    expect(findRawImageRefs('![media:78]()')).toEqual([]);
  });

  it('still detects raw URL images', () => {
    expect(findRawImageRefs('![shot](https://example.com/a.png)')).toEqual(['![shot](https://example.com/a.png)']);
  });

  it('detects raw URL but not media cell in the same doc', () => {
    const md = `${FENCE}\n\n![x](https://example.com/y.png)`;
    expect(findRawImageRefs(md)).toEqual(['![x](https://example.com/y.png)']);
  });
});

describe('hasUnsupportedBlocks (image-row supported)', () => {
  it('returns false for an image-row block', () => {
    const body = bodyWith([{ type: 'block', version: 2, fields: { blockType: 'image-row' } }]);
    expect(hasUnsupportedBlocks(body)).toBe(false);
  });

  it('returns true for an unknown block type', () => {
    const body = bodyWith([{ type: 'block', version: 2, fields: { blockType: 'some-other-block' } }]);
    expect(hasUnsupportedBlocks(body)).toBe(true);
  });

  it('returns false for plain paragraphs', () => {
    const body = bodyWith([{ type: 'paragraph', version: 1, children: [] }]);
    expect(hasUnsupportedBlocks(body)).toBe(false);
  });

  it('detects a nested unsupported block', () => {
    const body = bodyWith([{ type: 'list', version: 1, children: [{ type: 'block', version: 2, fields: { blockType: 'x' } }] }]);
    expect(hasUnsupportedBlocks(body)).toBe(true);
  });
});

describe('validateImageRowFences', () => {
  it('accepts a well-formed 2-cell fence', () => {
    expect(validateImageRowFences(FENCE)).toEqual([]);
  });

  it('rejects a fence with only one cell', () => {
    const bad = ['```image-row', '![media:79](x)', '```'].join('\n');
    const errors = validateImageRowFences(bad);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('2');
  });

  it('rejects a fence with a non-image line', () => {
    const bad = ['```image-row', '![media:79](x)', 'not an image', '```'].join('\n');
    expect(validateImageRowFences(bad).length).toBe(1);
  });

  it('accepts a doc with no fences', () => {
    expect(validateImageRowFences('# hi\n\npara')).toEqual([]);
  });
});

describe('extractImageRowMediaIDs', () => {
  it('lists media ids from all fences', () => {
    const md = `${FENCE}\n\n${FENCE}`;
    expect(extractImageRowMediaIDs(md)).toEqual([79, 78, 79, 78]);
  });

  it('returns empty for no fences', () => {
    expect(extractImageRowMediaIDs('para')).toEqual([]);
  });
});
````

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/lib/mcp/markdown --project unit`
Expected: FAIL(`validateImageRowFences` / `extractImageRowMediaIDs` 未定義、findRawImageRefs/hasUnsupportedBlocks が新挙動未対応)。

- [ ] **Step 3: 実装**

`src/lib/mcp/markdown/index.ts` を更新(codec 部は不変、guard を差し替え・追加):

````typescript
// 画像参照。alt が media:<数字> のもの(単一 media プレースホルダ / image-row セル)は
// 生 URL ではないので除外する。それ以外の ![alt](非空) を生 URL として返す。
const IMAGE_REF = /!\[([^\]]*)\]\(([^)]+)\)/g;
const MEDIA_ALT = /^media:\d+$/;

export const findRawImageRefs = (markdown: string): string[] =>
  [...markdown.matchAll(IMAGE_REF)].filter((match) => MEDIA_ALT.test(match[1] ?? '') === false).map((match) => match[0]);

// MCP が Markdown 往復できる block。増えたらここに足す。
const SUPPORTED_BLOCK_TYPES = ['image-row'];

type LexicalNode = { type?: string; fields?: { blockType?: string }; children?: LexicalNode[] };

const containsUnsupportedBlock = (nodes: LexicalNode[]): boolean =>
  nodes.some((node) => {
    const isBlock = node.type === 'block' || node.type === 'inlineBlock';
    if (isBlock && SUPPORTED_BLOCK_TYPES.includes(node.fields?.blockType ?? '') === false) return true;
    return containsUnsupportedBlock(node.children ?? []);
  });

// 対応済み block(image-row)は Markdown 往復できるので拒否しない。
// 未対応 block(将来の block 等)を含む本文だけ true。
export const hasUnsupportedBlocks = (body: Blog['body']): boolean => containsUnsupportedBlock(body.root.children as LexicalNode[]);

// ```image-row フェンスとセル行。
const IMAGE_ROW_FENCE = /^```image-row\s*\n([\s\S]*?)^```\s*$/gm;
const CELL_LINE = /^\s*!\[media:(\d+)\]\((.*)\)\s*$/;

const fenceCellLines = (inner: string): string[] => inner.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

// 各 image-row フェンスが「ちょうど2行の ![media:<id>](...)」であることを検証。
// 違反ごとに LLM 向け回復指示を返す。
export const validateImageRowFences = (markdown: string): string[] =>
  [...markdown.matchAll(IMAGE_ROW_FENCE)]
    .filter((match) => {
      const lines = fenceCellLines(match[1] ?? '');
      const cells = lines.filter((line) => CELL_LINE.test(line));
      return lines.length !== 2 || cells.length !== 2;
    })
    .map(
      (match) =>
        `image-row フェンスは ![media:<id>](caption) をちょうど2行含む必要があります(画像2枚固定)。caption は省略可(![media:<id>]())。該当:\n${match[0]}`,
    );

// 全 image-row フェンスの cell media id を列挙(存在チェック用)。
export const extractImageRowMediaIDs = (markdown: string): number[] =>
  [...markdown.matchAll(IMAGE_ROW_FENCE)].flatMap((match) =>
    fenceCellLines(match[1] ?? '')
      .map((line) => line.match(CELL_LINE))
      .filter((cell): cell is RegExpMatchArray => cell !== null)
      .map((cell) => parseInt(cell[1] ?? '', 10)),
  );
````

既存の `RAW_IMAGE_REF` 定数と旧 `containsBlockNode` は削除する。

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm vitest run src/lib/mcp/markdown --project unit`
Expected: PASS(既存 + 追加分すべて)。

- [ ] **Step 5: Commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/mcp/markdown
git commit -m "feat: MCP guard を image-row 対応に(生URL除外・対応block・フェンス検証)"
```

---

### Task 3: tool 層に image-row フェンス検証 + media 存在チェックを配線

**Files:**

- Modify: `src/lib/mcp/tools/index.ts`
- Modify: `src/lib/mcp/tools/tools.test.ts`

**Interfaces:**

- Consumes: Task 2 の `findRawImageRefs` / `validateImageRowFences` / `extractImageRowMediaIDs` / `hasUnsupportedBlocks`。
- Produces: create_post/update_post が image-row フェンス込み本文を受理・検証。

- [ ] **Step 1: 失敗するテストを追記**

`src/lib/mcp/tools/tools.test.ts` の該当 describe に追加(既存の `createDeps()` / mock パターンに従う):

````typescript
const FENCE = ['```image-row', '![media:5](left)', '![media:6]()', '```'].join('\n');

describe('createPost with image-row', () => {
  it('accepts a valid image-row fence and checks each cell media', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail + cells all exist
    payload.create.mockResolvedValue({ id: 20, slug: 'ir' });

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 'ir', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown: `intro\n\n${FENCE}` });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalled();
  });

  it('rejects a malformed image-row fence', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 });
    const handlers = createBlogToolHandlers(deps);
    const bad = ['```image-row', '![media:5](only one)', '```'].join('\n');
    const result = await handlers.createPost({ title: 't', slug: 'ir', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown: bad });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects when a cell media does not exist', async () => {
    const { payload, deps } = createDeps();
    // thumbnail (5) exists, cell media (6) missing
    payload.findByID.mockImplementation(async ({ id }: { id: number }) => (id === 6 ? null : { id }));
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 'ir', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown: FENCE });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });
});
````

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/lib/mcp/tools --project unit`
Expected: FAIL(検証がまだ配線されていない)。

- [ ] **Step 3: 実装**

`src/lib/mcp/tools/index.ts` の import に追加:

```typescript
import { extractImageRowMediaIDs, findRawImageRefs, hasUnsupportedBlocks, validateImageRowFences } from '../markdown';
```

共通ヘルパを追加(既存の `verifyMediaExists` を利用):

```typescript
// 本文 Markdown の image-row フェンス + 生URL画像を検証し、問題があれば
// 回復指示メッセージ(1つ目)を返す。問題なければ undefined。
const validateBodyMarkdown = async (bodyMarkdown: string, verifyMediaExists: (id: number) => Promise<boolean>): Promise<string | undefined> => {
  const rawRefs = findRawImageRefs(bodyMarkdown);
  if (rawRefs.length > 0) {
    return `本文に生 URL の画像参照があります: ${rawRefs.join(', ')}\n先に upload_media で画像を登録し、返された ![media:<id>]() を使ってください。`;
  }
  const fenceErrors = validateImageRowFences(bodyMarkdown);
  if (fenceErrors.length > 0) return fenceErrors[0];

  const ids = extractImageRowMediaIDs(bodyMarkdown);
  for (const id of ids) {
    const exists = await verifyMediaExists(id);
    if (!exists) return `image-row の media id=${id} が存在しません。upload_media で作成した id を使ってください。`;
  }
  return undefined;
};
```

`createPost` の本文検証(既存の `findRawImageRefs` ブロック)を差し替え:

```typescript
    createPost: async (input): Promise<ToolResult> => {
      try {
        const bodyError = await validateBodyMarkdown(input.bodyMarkdown, verifyMediaExists);
        if (bodyError !== undefined) return fail(bodyError);

        const thumbnailExists = await verifyMediaExists(input.thumbnailMediaID);
        if (!thumbnailExists) {
          return fail(`thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。upload_media で作成した id を指定してください。`);
        }
        // ...(以降の payload.create は現状のまま)
```

`update_post` の `resolveBodyPatch` を、生URLチェックを `validateBodyMarkdown` に寄せる形へ更新。現在 `resolveBodyPatch` は同期で `findRawImageRefs` を呼んでいるので、非同期の media 存在チェックを含めるため呼び出しを `updatePost` 側に移す:

```typescript
    updatePost: async (input): Promise<ToolResult> => {
      try {
        const current = await findPost({ id: input.id });
        if (current === null) return fail('記事が見つかりません。list_posts で id を確認してください。');
        if (input.thumbnailMediaID !== undefined) {
          const thumbnailExists = await verifyMediaExists(input.thumbnailMediaID);
          if (!thumbnailExists) return fail(`thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。`);
        }
        // bodyMarkdown 指定時のみ本文検証 + block 保護
        const nextBody = await (async (): Promise<Blog['body'] | undefined | ToolResult> => {
          if (input.bodyMarkdown === undefined) return undefined;
          if (hasUnsupportedBlocks(current.body)) {
            return fail(
              'この記事の本文には MCP 非対応の block が含まれるため、bodyMarkdown での上書きはできません。title/excerpt 等のみ更新するか、本文は admin UI で編集してください。',
            );
          }
          const bodyError = await validateBodyMarkdown(input.bodyMarkdown, verifyMediaExists);
          if (bodyError !== undefined) return fail(bodyError);
          return codec.toLexical(input.bodyMarkdown);
        })();
        if (nextBody !== undefined && 'content' in (nextBody as ToolResult)) return nextBody as ToolResult;
        // ...(payload.update に body: nextBody を含める。現状の data 構築を踏襲)
```

実装メモ: IIFE 禁止ルールがあるため、上記の即時関数は**名前付きヘルパ `resolveNextBody(input, current, deps)` に切り出す**こと(戻り値 union: `{ kind: 'skip' } | { kind: 'body'; body } | { kind: 'error'; message }`)。plan の擬似コードは意図を示すもので、実装は discriminated union + guard 節で書く(early-return.md / functional-programming.md 準拠)。既存 `resolveBodyPatch` はこの新ヘルパに置き換え。

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm vitest run src/lib/mcp/tools --project unit`
Expected: PASS(既存 + 追加)。

- [ ] **Step 5: Commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/mcp/tools
git commit -m "feat: create/update に image-row フェンス検証と cell media 存在チェックを配線"
```

---

### Task 4: フル検証 + runbook 追記 + staging E2E + PR

**Files:**

- Modify: `docs/mcp-blog-authoring.md`(image-row フェンス構文の説明追記)
- 検証のみ: 全テスト / build / staging E2E

- [ ] **Step 1: runbook に構文を追記**

`docs/mcp-blog-authoring.md` の入稿ワークフロー節に、image-row フェンスの説明を追加:

````markdown
### 画像2枚を横並び(image-row)にする

本文に画像を横並びで置くには ```image-row フェンスを使う(必ず画像2枚):

    ```image-row
    ![media:79](左のキャプション)
    ![media:78](右のキャプション)
    ```

- id は upload_media で作成した media の id。caption は省略可(![media:79]())。
- image-row を含む既存記事も get_post で本文を取得でき、update_post で編集できる。
````

- [ ] **Step 2: フル検証**

```bash
pnpm lint && pnpm typecheck
pnpm vitest run
pnpm build
```

Expected: 全 green、build 成功。

- [ ] **Step 3: 検証 script を削除(スパイクの後片付け)**

Task 1 の `scripts/verify-image-row-roundtrip.ts` は round-trip 確認済みなら削除(残すなら runbook に用途を1行記載)。判断して commit:

```bash
git rm scripts/verify-image-row-roundtrip.ts
```

- [ ] **Step 4: Commit + push + PR**

```bash
git add docs/mcp-blog-authoring.md
git commit -m "docs: image-row フェンス構文を runbook に追記 + 検証 script 撤去"
git push -u origin feat/mcp-image-row-markdown
gh pr create --title "feat: image-row 入り記事を MCP で本文編集可能に(Markdown round-trip)" --body "..."
```

- [ ] **Step 5: staging E2E(CI が main マージで自動 deploy 後、または手動)**

マージ後 CI が staging を deploy する。Claude in Chrome(Access セッション)+ in-page fetch で:

1. image-row 入り実記事(genovese / cannelloni 相当)を `get_post` → **bodyEditable: true** + フェンス込み bodyMarkdown が返ること。
2. その bodyMarkdown の caption を編集 → `update_post` → `get_post` で反映確認。
3. `create_post` で image-row フェンス込みの新規 draft → admin Live Preview で2枚横並び描画を目視 → 後始末で削除。
4. 段落間に置いた image-row の**位置**が保たれること。

---

## 既知のリスクと逃げ道

| リスク                                                                | 逃げ道                                                                                                                                                                     |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customStartRegex`/`customEndRegex` 経路が想定と違う(非 JSX 未文書化) | Task 1 スパイクで実挙動を確認し export/import 形を確定してから Task 2-3 に進む。動かなければ pre/post 処理(codec 内で image-row を抜き差し)にフォールバック(spec の代替案) |
| import 引数が `children` でなく `linesInBetween`                      | Task 1 で実引数を log して確定                                                                                                                                             |
| cell の array-row id を D1 が要求/拒否                                | bson-objectid で明示生成(plan 済)。逆に id 不要なら外す                                                                                                                    |
| caption に `)` が含まれ CELL_LINE が途中で切れる                      | 既存 RAW_IMAGE_REF と同じ既存制約。行末までを greedy に取る `(.*)` で概ね吸収                                                                                              |
| front-end 描画・admin が壊れる                                        | jsx は markdown 変換専用。build + staging で /blog 実記事の描画を目視確認                                                                                                  |
