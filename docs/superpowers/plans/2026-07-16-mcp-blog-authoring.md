# 認証付き MCP サーバー(blog 入稿)Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Code / claude.ai から OAuth 認証で napochaan.com の blog を入稿・推敲・公開できる remote MCP サーバーを既存 Worker に統合する。

**Architecture:** `worker/worker.ts` を `@cloudflare/workers-oauth-provider` でラップし(OAuth 2.1 + PKCE + DCR)、`/mcp` への認証済みリクエストだけを in-process で Next の `/api/mcp` route handler に forward する。MCP 本体は `@modelcontextprotocol/sdk` の stateless Streamable HTTP transport で動き、ツールは Payload Local API(`{ user, overrideAccess: false }`)を叩く。外部からの `/api/mcp` は Hono 層で 404。

**Tech Stack:** `@cloudflare/workers-oauth-provider@^0.8.1` / `@modelcontextprotocol/sdk@^1.29.0`(**`agents` パッケージは使わない** — `cloudflare:workers` を top-level import しており Next でバンドル不可)/ zod(既存 ^3.25.76)/ `@payloadcms/richtext-lexical` 3.84.1 の `convertMarkdownToLexical` / `convertLexicalToMarkdown`。

**Spec:** `docs/superpowers/specs/2026-07-16-mcp-blog-authoring-design.md`

## Global Constraints

- リポジトリ規約: arrow function のみ / `let`・IIFE・`forEach`・non-null assertion・`any` 禁止 / truthiness 判定禁止(`!== undefined` 等で明示)/ `String()`・`Number()` 禁止(テンプレートリテラル・`parseInt`)/ early return / colocation(`module/{index.ts, module.test.ts}`)
- テスト振り分け: `src/**/*.test.ts` = node unit / `src/**/*.test.tsx` = browser / `worker/**/*.test.ts` = workers pool
- 日付は `import { dayjs } from '@utils/dayjs'` + `.tz('Asia/Tokyo')`
- 各タスク完了時に `pnpm lint && pnpm typecheck`(husky が commit 時にも実行)
- コミットは日本語 conventional commits(既存ログ準拠)
- **調査済み確定事実**(実装中に疑わない):
  - OAuth の KV binding 名は **`OAUTH_KV` 固定**(ライブラリにハードコード)
  - `completeAuthorization({ props })` の props が API リクエスト時に `ctx.props` に復号されて届く
  - `authorizeEndpoint` はメタデータ広告のみ。/oauth/authorize の実処理は defaultHandler(= Next ページ)側
  - MCP SDK 1.26+ は **リクエストごとに McpServer / transport を新規生成**必須(共有すると throw)
  - upload プレースホルダ記法は `![media:<id>]()`(空括弧必須)。ライブラリの regex: `/!\[([^\]:]+):([^\]]+)\]\(\)/`
  - `convertMarkdownToLexical` / `convertLexicalToMarkdown` は **同期**。`editorConfigFactory.default({ config })` は **async**
  - Local API はデフォルト `overrideAccess: true`(アクセス制御スキップ)。**全呼び出しに `{ overrideAccess: false, user }` を明示**
  - `payload.login()` は `req` なしで動くが返り値 `{ user?, token?, exp? }` は全て optional
  - media の `file` は `{ data: Buffer; mimetype: string; name: string; size: number }`
  - blog の `slug` は required + unique + `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`(auto 生成なし)
  - `media` コレクションは `alt` が required、`mimeTypes: ['image/*', 'application/pdf']`

---

### Task 1: 依存追加 + wrangler.toml に OAUTH_KV + 型再生成

**Files:**

- Modify: `package.json`(pnpm add 経由)
- Modify: `wrangler.toml`
- 再生成: `cloudflare-env.d.ts`(`pnpm cf:types`、gitignore 済み生成物)

**Interfaces:**

- Produces: `Cloudflare.Env['OAUTH_KV']: KVNamespace` 型(後続タスクの worker.ts が暗黙依存)

- [ ] **Step 1: 依存を追加**

```bash
pnpm add @modelcontextprotocol/sdk @cloudflare/workers-oauth-provider
```

Expected: `@modelcontextprotocol/sdk@1.29.x` / `@cloudflare/workers-oauth-provider@0.8.x` が dependencies に入る。`agents` は追加**しない**。

- [ ] **Step 2: KV namespace を作成(3環境)**

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
pnpm wrangler kv namespace create OAUTH_KV
pnpm wrangler kv namespace create OAUTH_KV --env staging
pnpm wrangler kv namespace create OAUTH_KV --env production
```

Expected: 各コマンドが `id = "<32hex>"` を出力する。控えておく。
(`CLOUDFLARE_ACCOUNT_ID` を付けないと対話プロンプトで exit 13 になる — staging-deploy-seed skill 参照。認証エラー時はこのステップだけユーザーに依頼し、以降は `id` をプレースホルダ `00000000000000000000000000000000` + `# TODO` で進める — 既存 D1 の dev 設定と同じ流儀。)

- [ ] **Step 3: wrangler.toml に binding を追加**

トップレベル(dev)の `# ===== Cache (OpenNext) =====` セクションの直前に:

```toml
# ===== MCP OAuth =====
# @cloudflare/workers-oauth-provider は binding 名 "OAUTH_KV" 固定。

[[kv_namespaces]]
binding = "OAUTH_KV"
id = "<dev の id>"
```

`[env.staging]` セクション末尾(`env.staging.d1_databases` の後)に:

```toml
[[env.staging.kv_namespaces]]
binding = "OAUTH_KV"
id = "<staging の id>"
```

`[env.production]` セクション末尾に:

```toml
[[env.production.kv_namespaces]]
binding = "OAUTH_KV"
id = "<production の id>"
```

`[env.test]` には**追加しない**(workers テストは OAuthProvider を経由しない test-entry を使う)。

- [ ] **Step 4: 型を再生成して確認**

```bash
pnpm cf:types
grep OAUTH_KV cloudflare-env.d.ts
```

Expected: `OAUTH_KV: KVNamespace;` が出力される。出ない場合は古い `tsconfig.tsbuildinfo` を `rm` して再実行。

- [ ] **Step 5: lint / typecheck / commit**

```bash
pnpm lint && pnpm typecheck
git add package.json pnpm-lock.yaml wrangler.toml
git commit -m "chore: MCP OAuth 用の依存と OAUTH_KV binding を追加"
```

---

### Task 2: Markdown 変換モジュール `src/lib/mcp/markdown/`

**Files:**

- Create: `src/lib/mcp/markdown/index.ts`
- Test: `src/lib/mcp/markdown/markdown.test.ts`(node unit)

**Interfaces:**

- Produces:
  - `type MarkdownCodec = { toLexical: (markdown: string) => Blog['body']; toMarkdown: (data: Blog['body']) => string }`
  - `createMarkdownCodec(editorConfig: SanitizedServerEditorConfig): MarkdownCodec`
  - `findRawImageRefs(markdown: string): string[]` — 生 URL 画像参照(`![alt](url)`)を列挙。`![media:12]()` は対象外
  - `hasUnsupportedBlocks(body: Blog['body']): boolean` — Lexical state に `block` / `inlineBlock` ノードが含まれるか

**設計メモ:** `@payload-config` を node unit テストで import すると wrangler proxy の初期化で落ちるため、変換の本体(`createMarkdownCodec`)は `editorConfig` を**引数で受ける薄いラッパー**とし、unit テストは純関数ガード 2 つに集中する。round-trip の実挙動は Task 7 の staging E2E で検証する。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/mcp/markdown/markdown.test.ts
import { describe, expect, it } from 'vitest';

import { findRawImageRefs, hasUnsupportedBlocks } from '.';

import type { Blog } from '@payload-types';

const bodyWith = (children: unknown[]): Blog['body'] =>
  ({
    root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 },
  }) as Blog['body'];

describe('findRawImageRefs', () => {
  it('detects raw URL image refs', () => {
    const markdown = '# title\n\n![screenshot](https://example.com/a.png)\n';
    expect(findRawImageRefs(markdown)).toEqual(['![screenshot](https://example.com/a.png)']);
  });

  it('ignores upload placeholders (empty parens)', () => {
    expect(findRawImageRefs('before ![media:12]() after')).toEqual([]);
  });

  it('ignores normal links', () => {
    expect(findRawImageRefs('[link](https://example.com)')).toEqual([]);
  });

  it('detects multiple refs', () => {
    const markdown = '![a](x.png)\n![media:1]()\n![b](y.png)';
    expect(findRawImageRefs(markdown)).toEqual(['![a](x.png)', '![b](y.png)']);
  });
});

describe('hasUnsupportedBlocks', () => {
  it('returns false for plain paragraphs', () => {
    const body = bodyWith([{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'hi' }] }]);
    expect(hasUnsupportedBlocks(body)).toBe(false);
  });

  it('returns true for a top-level block node', () => {
    const body = bodyWith([{ type: 'block', version: 2, fields: { blockType: 'image-row' } }]);
    expect(hasUnsupportedBlocks(body)).toBe(true);
  });

  it('returns true for a nested block node', () => {
    const body = bodyWith([
      { type: 'list', version: 1, children: [{ type: 'listitem', version: 1, children: [{ type: 'block', version: 2 }] }] },
    ]);
    expect(hasUnsupportedBlocks(body)).toBe(true);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/lib/mcp/markdown --project unit`
Expected: FAIL(モジュール未作成)

- [ ] **Step 3: 実装**

```ts
// src/lib/mcp/markdown/index.ts
import { convertLexicalToMarkdown, convertMarkdownToLexical } from '@payloadcms/richtext-lexical';

import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Blog } from '@payload-types';

export type MarkdownCodec = {
  toLexical: (markdown: string) => Blog['body'];
  toMarkdown: (data: Blog['body']) => string;
};

// editorConfig はグローバル editor 設定(BlocksFeature 込み)から
// `await editorConfigFactory.default({ config: payload.config })` で作る(呼び出し側の責務)。
export const createMarkdownCodec = (editorConfig: SanitizedServerEditorConfig): MarkdownCodec => ({
  toLexical: (markdown) => convertMarkdownToLexical({ editorConfig, markdown }) as Blog['body'],
  toMarkdown: (data) => convertLexicalToMarkdown({ editorConfig, data: data as SerializedEditorState }),
});

// UploadFeature のプレースホルダ `![media:<id>]()` は括弧が空。
// 括弧に中身がある画像参照 = サイト外 URL の直貼りなので入稿を弾く。
const RAW_IMAGE_REF = /!\[[^\]]*\]\([^)]+\)/g;

export const findRawImageRefs = (markdown: string): string[] => [...markdown.matchAll(RAW_IMAGE_REF)].map((match) => match[0]);

type LexicalNode = { type?: string; children?: LexicalNode[] };

const containsBlockNode = (nodes: LexicalNode[]): boolean =>
  nodes.some((node) => node.type === 'block' || node.type === 'inlineBlock' || containsBlockNode(node.children ?? []));

// image-row 等の独自 block は Markdown で表現できず、toMarkdown → toLexical の
// round-trip で消滅する。含まれる記事の本文上書きを拒否するための検出器。
export const hasUnsupportedBlocks = (body: Blog['body']): boolean => containsBlockNode(body.root.children as LexicalNode[]);
```

型メモ: `as Blog['body']` / `as SerializedEditorState` は構造互換なら外せる可能性がある。typecheck が通るなら外すこと(`satisfies` 優先ルール)。`SerializedEditorState` の import パスが `@payloadcms/richtext-lexical/lexical` に無い場合は `convertLexicalToMarkdown` の Parameters 型から取る: `type LexicalData = Parameters<typeof convertLexicalToMarkdown>[0]['data']`。

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm vitest run src/lib/mcp/markdown --project unit`
Expected: PASS(7 tests)

- [ ] **Step 5: Commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/mcp/markdown
git commit -m "feat: MCP 用 Markdown⇔Lexical 変換モジュールを追加"
```

---

### Task 3: MCP ツールハンドラ `src/lib/mcp/tools/`

**Files:**

- Create: `src/lib/mcp/tools/index.ts`
- Test: `src/lib/mcp/tools/tools.test.ts`(node unit)

**Interfaces:**

- Consumes: Task 2 の `MarkdownCodec` / `findRawImageRefs` / `hasUnsupportedBlocks`
- Produces:
  - `type BlogToolDeps = { payload: Payload; user: User; codec: MarkdownCodec }`
  - `createBlogToolHandlers(deps: BlogToolDeps)` — 6 ハンドラ(`listPosts` / `getPost` / `uploadMedia` / `createPost` / `updatePost` / `publishPost`)のオブジェクトを返す。各ハンドラは `(input) => Promise<ToolResult>`、`ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean }`
  - `registerBlogTools(server: McpServer, deps: BlogToolDeps): void` — zod shape + annotations 付きで `server.registerTool` に配線(Task 4 が使用)

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/mcp/tools/tools.test.ts
import { describe, expect, it, vi } from 'vitest';

import { createBlogToolHandlers } from '.';

import type { BlogToolDeps } from '.';
import type { Blog, User } from '@payload-types';

const user = { id: 1, email: 'dev@napochaan.com' } as User;

const paragraphBody = (): Blog['body'] =>
  ({ root: { type: 'root', children: [{ type: 'paragraph', version: 1 }], direction: null, format: '', indent: 0, version: 1 } }) as Blog['body'];

const blockBody = (): Blog['body'] =>
  ({ root: { type: 'root', children: [{ type: 'block', version: 2 }], direction: null, format: '', indent: 0, version: 1 } }) as Blog['body'];

const createDeps = () => {
  const payload = {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const codec = {
    toLexical: vi.fn((markdown: string) => paragraphBody()),
    toMarkdown: vi.fn(() => '# md'),
  };
  const deps = { payload, user, codec } as unknown as BlogToolDeps;
  return { payload, codec, deps };
};

describe('createPost', () => {
  it('creates a draft with overrideAccess: false', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    payload.create.mockResolvedValue({ id: 10, slug: 'hello' });

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 'hello',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: '# hi',
    });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'blog',
        draft: true,
        overrideAccess: false,
        user,
        data: expect.objectContaining({ _status: 'draft', slug: 'hello', thumbnail: 5 }),
      }),
    );
  });

  it('rejects raw image URLs with a recovery hint', async () => {
    const { payload, deps } = createDeps();
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 's',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: '![x](https://example.com/x.png)',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('upload_media');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects a missing thumbnail', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 's', excerpt: 'e', thumbnailMediaID: 99, bodyMarkdown: '# hi' });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('defaults publishedAt to today (Asia/Tokyo)', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 });
    payload.create.mockResolvedValue({ id: 10, slug: 'hello' });
    const handlers = createBlogToolHandlers(deps);
    await handlers.createPost({ title: 't', slug: 'hello', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown: '# hi' });

    const arg = payload.create.mock.calls[0]?.[0] as { data: { publishedAt: string } };
    expect(arg.data.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('updatePost', () => {
  it('rejects bodyMarkdown when the current body contains block nodes', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: blockBody() });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.updatePost({ id: 3, bodyMarkdown: '# rewrite' });

    expect(result.isError).toBe(true);
    expect(payload.update).not.toHaveBeenCalled();
  });

  it('updates non-body fields of a block-containing post', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: blockBody() });
    payload.update.mockResolvedValue({ id: 3, slug: 's' });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.updatePost({ id: 3, title: 'new title' });

    expect(result.isError).toBeUndefined();
    const arg = payload.update.mock.calls[0]?.[0] as { draft: boolean; data: Record<string, unknown> };
    expect(arg.draft).toBe(true);
    expect(arg.data).not.toHaveProperty('body');
    expect(arg.data).toHaveProperty('title', 'new title');
  });
});

describe('publishPost', () => {
  it('sets _status published and returns the public URL', async () => {
    const { payload, deps } = createDeps();
    payload.update.mockResolvedValue({ id: 3, slug: 'hello', _status: 'published' });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.publishPost({ id: 3 });

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'blog', id: 3, overrideAccess: false, user, data: { _status: 'published' } }),
    );
    expect(result.content[0]?.text).toContain('/blog/hello');
  });
});

describe('getPost', () => {
  it('flags block-containing posts as not body-editable', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, slug: 's', title: 't', publishedAt: '2026-07-16', excerpt: 'e', body: blockBody() });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.getPost({ id: 3 });

    expect(result.content[0]?.text).toContain('"bodyEditable": false');
    expect(codec.toMarkdown).not.toHaveBeenCalled();
  });
});

describe('uploadMedia', () => {
  it('creates media from base64 and returns the placeholder', async () => {
    const { payload, deps } = createDeps();
    payload.create.mockResolvedValue({ id: 42, url: '/api/media/file/x.png' });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.uploadMedia({ base64: Buffer.from('png-bytes').toString('base64'), alt: 'x', filename: 'x.png' });

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        overrideAccess: false,
        user,
        data: { alt: 'x' },
        file: expect.objectContaining({ mimetype: 'image/png', name: 'x.png' }),
      }),
    );
    expect(result.content[0]?.text).toContain('![media:42]()');
  });

  it('fails without url or base64', async () => {
    const { deps } = createDeps();
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.uploadMedia({ alt: 'x', filename: 'x.png' });
    expect(result.isError).toBe(true);
  });
});

describe('listPosts', () => {
  it('queries drafts with access control', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });
    const handlers = createBlogToolHandlers(deps);
    await handlers.listPosts({});

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'blog', draft: true, overrideAccess: false, user, sort: '-publishedAt' }),
    );
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/lib/mcp/tools --project unit`
Expected: FAIL(モジュール未作成)

- [ ] **Step 3: 実装**

```ts
// src/lib/mcp/tools/index.ts
import { ValidationError } from 'payload';
import { z } from 'zod';

import { dayjs } from '@utils/dayjs';
import { absoluteUrl } from '@utils/site-url';

import { findRawImageRefs, hasUnsupportedBlocks } from '../markdown';

import type { MarkdownCodec } from '../markdown';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Blog, User } from '@payload-types';
import type { Payload } from 'payload';

export type BlogToolDeps = {
  payload: Payload;
  user: User;
  codec: MarkdownCodec;
};

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

const ok = (value: unknown): ToolResult => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
const fail = (message: string): ToolResult => ({ content: [{ type: 'text', text: message }], isError: true });

// エラー文言は「LLM が次の一手を自己修正できる指示」として書く(spec のエラー処理方針)。
const toErrorResult = (error: unknown): ToolResult => {
  if (error instanceof ValidationError) {
    const details = (error.data.errors ?? []).map((item) => `- ${item.path ?? '(field)'}: ${item.message}`).join('\n');
    return fail(`Payload の入力検証に失敗しました:\n${details}\n該当フィールドを修正して再実行してください。`);
  }
  console.error('[mcp] tool error', error);
  return fail('内部エラーが発生しました。同一入力での再試行は避け、ユーザーに状況を報告してください。');
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MIME_BY_EXT: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const toSummary = (doc: Blog) => ({
  id: doc.id,
  slug: doc.slug,
  title: doc.title,
  publishedAt: doc.publishedAt,
  status: doc._status ?? 'draft',
  excerpt: doc.excerpt,
});

type UploadSource = { data: Buffer; mimetype?: string };

const resolveUploadSource = async (input: { url?: string; base64?: string }): Promise<UploadSource | string> => {
  if (input.url !== undefined) {
    const response = await fetch(input.url);
    if (!response.ok) return `画像の取得に失敗しました (HTTP ${response.status})。URL を確認して再実行してください。`;
    const contentType = response.headers.get('content-type');
    return {
      data: Buffer.from(await response.arrayBuffer()),
      mimetype: contentType !== null ? contentType.split(';')[0] : undefined,
    };
  }
  if (input.base64 !== undefined) return { data: Buffer.from(input.base64, 'base64') };
  return 'url か base64 のどちらかを指定してください。';
};

type BodyPatch = { kind: 'none' } | { kind: 'patch'; body: Blog['body'] } | { kind: 'error'; message: string };

const resolveBodyPatch = (current: Blog, bodyMarkdown: string | undefined, codec: MarkdownCodec): BodyPatch => {
  if (bodyMarkdown === undefined) return { kind: 'none' };
  if (hasUnsupportedBlocks(current.body)) {
    return {
      kind: 'error',
      message:
        'この記事の本文には MCP 非対応の block(image-row 等)が含まれるため、bodyMarkdown での上書きはできません(既存 block が破壊されます)。title/excerpt 等の他フィールドのみ更新するか、本文は admin UI で編集してください。',
    };
  }
  const rawRefs = findRawImageRefs(bodyMarkdown);
  if (rawRefs.length > 0) {
    return {
      kind: 'error',
      message: `本文に生 URL の画像参照があります: ${rawRefs.join(', ')}\n先に upload_media で画像を登録し、返された ![media:<id>]() を本文に使ってください。`,
    };
  }
  return { kind: 'patch', body: codec.toLexical(bodyMarkdown) };
};

export const createBlogToolHandlers = (deps: BlogToolDeps) => {
  const { payload, user, codec } = deps;

  const findPost = async (query: { id?: number; slug?: string }): Promise<Blog | null> => {
    if (query.id !== undefined) {
      return payload.findByID({ collection: 'blog', id: query.id, draft: true, disableErrors: true, overrideAccess: false, user });
    }
    if (query.slug !== undefined) {
      const { docs } = await payload.find({
        collection: 'blog',
        draft: true,
        where: { slug: { equals: query.slug } },
        limit: 1,
        overrideAccess: false,
        user,
      });
      return docs[0] ?? null;
    }
    return null;
  };

  const verifyMediaExists = async (id: number): Promise<boolean> => {
    const media = await payload.findByID({ collection: 'media', id, disableErrors: true, overrideAccess: false, user });
    return media !== null;
  };

  return {
    listPosts: async (input: { status?: 'draft' | 'published'; limit?: number }): Promise<ToolResult> => {
      try {
        const result = await payload.find({
          collection: 'blog',
          draft: true,
          sort: '-publishedAt',
          limit: input.limit ?? 20,
          overrideAccess: false,
          user,
          ...(input.status !== undefined ? { where: { _status: { equals: input.status } } } : {}),
        });
        return ok(result.docs.map(toSummary));
      } catch (error) {
        return toErrorResult(error);
      }
    },

    getPost: async (input: { id?: number; slug?: string }): Promise<ToolResult> => {
      try {
        if (input.id === undefined && input.slug === undefined) return fail('id か slug のどちらかを指定してください。');
        const doc = await findPost(input);
        if (doc === null) return fail('記事が見つかりません。list_posts で id / slug を確認してください。');
        const bodyEditable = !hasUnsupportedBlocks(doc.body);
        return ok({
          ...toSummary(doc),
          bodyEditable,
          ...(bodyEditable
            ? { bodyMarkdown: codec.toMarkdown(doc.body) }
            : { warning: '本文に MCP 非対応の block(image-row 等)が含まれます。bodyMarkdown での更新は不可。本文編集は admin UI で行ってください。' }),
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },

    uploadMedia: async (input: { url?: string; base64?: string; alt: string; filename: string }): Promise<ToolResult> => {
      try {
        const source = await resolveUploadSource(input);
        if (typeof source === 'string') return fail(source);
        const ext = input.filename.split('.').pop()?.toLowerCase() ?? '';
        const mimetype = source.mimetype ?? MIME_BY_EXT[ext];
        if (mimetype === undefined) {
          return fail('MIME type を特定できません。filename に拡張子(jpg/png/webp/gif/avif)を付けて再実行してください。');
        }
        const media = await payload.create({
          collection: 'media',
          data: { alt: input.alt },
          file: { data: source.data, mimetype, name: input.filename, size: source.data.byteLength },
          overrideAccess: false,
          user,
        });
        return ok({
          id: media.id,
          placeholder: `![media:${media.id}]()`,
          url: media.url ?? undefined,
          note: '本文に画像を入れる場合は placeholder をそのまま Markdown に貼る。thumbnail に使う場合は id を thumbnailMediaID に渡す。',
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },

    createPost: async (input: {
      title: string;
      slug: string;
      excerpt: string;
      thumbnailMediaID: number;
      bodyMarkdown: string;
      publishedAt?: string;
    }): Promise<ToolResult> => {
      try {
        const rawRefs = findRawImageRefs(input.bodyMarkdown);
        if (rawRefs.length > 0) {
          return fail(
            `本文に生 URL の画像参照があります: ${rawRefs.join(', ')}\n先に upload_media で画像を登録し、返された ![media:<id>]() を使ってください。`,
          );
        }
        const thumbnailExists = await verifyMediaExists(input.thumbnailMediaID);
        if (!thumbnailExists) {
          return fail(`thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。upload_media で作成した id を指定してください。`);
        }
        const created = await payload.create({
          collection: 'blog',
          draft: true,
          data: {
            title: input.title,
            slug: input.slug,
            excerpt: input.excerpt,
            thumbnail: input.thumbnailMediaID,
            publishedAt: input.publishedAt ?? dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD'),
            body: codec.toLexical(input.bodyMarkdown),
            _status: 'draft',
          },
          overrideAccess: false,
          user,
        });
        return ok({
          id: created.id,
          slug: created.slug,
          status: 'draft',
          adminURL: absoluteUrl(`/admin/collections/blog/${created.id}`),
          note: 'draft として作成済み。admin UI の Live Preview で確認後、publish_post で公開する。',
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },

    updatePost: async (input: {
      id: number;
      title?: string;
      slug?: string;
      excerpt?: string;
      thumbnailMediaID?: number;
      bodyMarkdown?: string;
      publishedAt?: string;
    }): Promise<ToolResult> => {
      try {
        const current = await findPost({ id: input.id });
        if (current === null) return fail('記事が見つかりません。list_posts で id を確認してください。');
        if (input.thumbnailMediaID !== undefined) {
          const thumbnailExists = await verifyMediaExists(input.thumbnailMediaID);
          if (!thumbnailExists) return fail(`thumbnailMediaID=${input.thumbnailMediaID} の media が存在しません。`);
        }
        const patch = resolveBodyPatch(current, input.bodyMarkdown, codec);
        if (patch.kind === 'error') return fail(patch.message);
        const updated = await payload.update({
          collection: 'blog',
          id: input.id,
          draft: true,
          data: {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.slug !== undefined ? { slug: input.slug } : {}),
            ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
            ...(input.thumbnailMediaID !== undefined ? { thumbnail: input.thumbnailMediaID } : {}),
            ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
            ...(patch.kind === 'patch' ? { body: patch.body } : {}),
          },
          overrideAccess: false,
          user,
        });
        return ok({
          id: updated.id,
          slug: updated.slug,
          status: 'draft version saved',
          adminURL: absoluteUrl(`/admin/collections/blog/${updated.id}`),
          note: '変更は draft version として保存済み。公開反映には publish_post が必要。',
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },

    publishPost: async (input: { id: number }): Promise<ToolResult> => {
      try {
        const updated = await payload.update({
          collection: 'blog',
          id: input.id,
          data: { _status: 'published' },
          overrideAccess: false,
          user,
        });
        return ok({
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          status: updated._status,
          url: absoluteUrl(`/blog/${updated.slug}`),
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },
  };
};

export const registerBlogTools = (server: McpServer, deps: BlogToolDeps): void => {
  const handlers = createBlogToolHandlers(deps);

  server.registerTool(
    'list_posts',
    {
      title: 'blog 記事一覧',
      description: 'blog の記事(draft 含む)を publishedAt 降順で一覧する。',
      inputSchema: {
        status: z.enum(['draft', 'published']).optional().describe('絞り込み。省略時は全件'),
        limit: z.number().int().min(1).max(50).optional().describe('最大件数(default 20)'),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.listPosts,
  );

  server.registerTool(
    'get_post',
    {
      title: 'blog 記事取得',
      description: '記事 1 件を取得し、本文を Markdown で返す。bodyEditable=false の記事は本文更新不可。',
      inputSchema: {
        id: z.number().int().optional(),
        slug: z.string().optional(),
      },
      annotations: { readOnlyHint: true },
    },
    handlers.getPost,
  );

  server.registerTool(
    'upload_media',
    {
      title: '画像アップロード',
      description:
        '画像を media コレクションに登録し、本文用プレースホルダ ![media:<id>]() と thumbnail 用の id を返す。本文への画像埋め込み・thumbnail 指定の前に必ずこれを使う。',
      inputSchema: {
        url: z.string().url().optional().describe('取得元 URL(url か base64 のどちらか必須)'),
        base64: z.string().optional().describe('画像バイナリの base64'),
        alt: z.string().min(1).describe('代替テキスト(必須)'),
        filename: z.string().min(1).describe('拡張子付きファイル名(例: cover.png)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.uploadMedia,
  );

  server.registerTool(
    'create_post',
    {
      title: 'blog 記事作成(draft)',
      description:
        '記事を必ず draft として作成する(公開は publish_post のみ)。本文 Markdown の画像は ![media:<id>]() 形式のみ。thumbnail は upload_media で作成した media の id。',
      inputSchema: {
        title: z.string().min(1),
        slug: z.string().regex(SLUG_PATTERN, '小文字英数字とハイフンのみ(先頭・末尾・連続ハイフン不可)'),
        excerpt: z.string().min(1).describe('本文冒頭の貼り付けではなく、記事を一言で説明する独立した要約'),
        thumbnailMediaID: z.number().int(),
        bodyMarkdown: z.string().min(1),
        publishedAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe('YYYY-MM-DD。省略時は今日(Asia/Tokyo)'),
      },
      annotations: { destructiveHint: false },
    },
    handlers.createPost,
  );

  server.registerTool(
    'update_post',
    {
      title: 'blog 記事更新(draft 保存)',
      description: '指定フィールドのみ部分更新し draft version として保存する。bodyMarkdown 省略時は本文に触らない。',
      inputSchema: {
        id: z.number().int(),
        title: z.string().min(1).optional(),
        slug: z.string().regex(SLUG_PATTERN).optional(),
        excerpt: z.string().min(1).optional(),
        thumbnailMediaID: z.number().int().optional(),
        bodyMarkdown: z.string().min(1).optional(),
        publishedAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      },
      annotations: { destructiveHint: false },
    },
    handlers.updatePost,
  );

  server.registerTool(
    'publish_post',
    {
      title: 'blog 記事公開',
      description: '記事を公開する(サイトに即反映される唯一の操作)。実行前にユーザーの明示的な意思を確認すること。',
      inputSchema: { id: z.number().int() },
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    handlers.publishPost,
  );
};
```

実装メモ:

- `ValidationError.data.errors` の要素型(`path` / `message`)が installed 版と食い違う場合は optional chaining で防御しつつ `JSON.stringify(error.data)` にフォールバック。
- `registerTool` の callback は `(args, extra)` の 2 引数で呼ばれるが、ハンドラは第1引数しか使わないためそのまま渡せる。型が合わない場合は `(args) => handlers.listPosts(args)` のようにラップ。

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm vitest run src/lib/mcp/tools --project unit`
Expected: PASS(12 tests)

- [ ] **Step 5: Commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/mcp/tools
git commit -m "feat: blog 入稿 MCP ツールハンドラを追加"
```

---

### Task 4: MCP route handler `src/app/api/mcp/route.ts`

**Files:**

- Create: `src/app/api/mcp/route.ts`
- Test: `src/app/api/mcp/route.test.ts`(node unit、依存は vi.mock)

**Interfaces:**

- Consumes: Task 2 `createMarkdownCodec` / Task 3 `registerBlogTools` / 既存 `getPayloadClient`
- Produces: `POST/GET/DELETE /api/mcp`。**`x-mcp-user-id` ヘッダーを無条件に信頼する**(Task 5 の Hono 遮断 + in-process forward が前提)

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/app/api/mcp/route.test.ts
import { describe, expect, it, vi } from 'vitest';

const findByID = vi.fn();

vi.mock('@lib/payload/client', () => ({
  getPayloadClient: async () => ({ findByID, config: {} }),
}));
vi.mock('@payloadcms/richtext-lexical', () => ({
  editorConfigFactory: { default: async () => ({}) },
  convertMarkdownToLexical: () => ({}),
  convertLexicalToMarkdown: () => '',
}));
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: class {
    registerTool(): void {}
    async connect(): Promise<void> {}
  },
}));
vi.mock('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js', () => ({
  WebStandardStreamableHTTPServerTransport: class {
    async handleRequest(): Promise<Response> {
      return new Response('{}', { status: 200 });
    }
  },
}));

const { POST } = await import('./route');

describe('POST /api/mcp', () => {
  it('returns 404 without the internal user header', async () => {
    const response = await POST(new Request('http://localhost/api/mcp', { method: 'POST' }));
    expect(response.status).toBe(404);
  });

  it('returns 401 for an unknown user', async () => {
    findByID.mockResolvedValue(null);
    const response = await POST(
      new Request('http://localhost/api/mcp', { method: 'POST', headers: { 'x-mcp-user-id': '999' } }),
    );
    expect(response.status).toBe(401);
  });

  it('delegates to the transport for a valid user', async () => {
    findByID.mockResolvedValue({ id: 1, email: 'dev@napochaan.com' });
    const response = await POST(
      new Request('http://localhost/api/mcp', { method: 'POST', headers: { 'x-mcp-user-id': '1' } }),
    );
    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/app/api/mcp --project unit`
Expected: FAIL(route 未作成)

- [ ] **Step 3: 実装**

```ts
// src/app/api/mcp/route.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { editorConfigFactory } from '@payloadcms/richtext-lexical';

import { createMarkdownCodec } from '@lib/mcp/markdown';
import { registerBlogTools } from '@lib/mcp/tools';
import { getPayloadClient } from '@lib/payload/client';

// Pair: worker/worker.ts の mcpAPIHandler が OAuth 検証後にこのヘッダーを付けて
// in-process forward する。外部からの /api/mcp は Hono 層(mcp-guard)で 404 に
// なるため、ここに届いた時点でヘッダーは信頼できる。
const MCP_USER_HEADER = 'x-mcp-user-id';

const handleMCPRequest = async (request: Request): Promise<Response> => {
  const userHeader = request.headers.get(MCP_USER_HEADER);
  if (userHeader === null) return new Response('Not Found', { status: 404 });

  const payload = await getPayloadClient();
  const user = await payload.findByID({
    collection: 'users',
    id: parseInt(userHeader, 10),
    disableErrors: true,
    overrideAccess: true,
  });
  if (user === null) return new Response('Unauthorized', { status: 401 });

  // MCP SDK 1.26+ はリクエストごとに server / transport を新規生成する必要がある
  // (共有すると "already connected" で throw する)。生成は安価。
  const editorConfig = await editorConfigFactory.default({ config: payload.config });
  const server = new McpServer({ name: 'napochaan-blog', version: '1.0.0' });
  registerBlogTools(server, { payload, user, codec: createMarkdownCodec(editorConfig) });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless モード
    enableJsonResponse: true, // SSE ではなく素の JSON 応答
  });
  await server.connect(transport);
  return transport.handleRequest(request);
};

export const POST = handleMCPRequest;
export const GET = handleMCPRequest;
export const DELETE = handleMCPRequest;
```

実装メモ: `WebStandardStreamableHTTPServerTransport` の import パス(`.../server/webStandardStreamableHttp.js`)が解決できない場合は `node_modules/@modelcontextprotocol/sdk/package.json` の `exports` を確認して合わせる(v1.29.0 に web-standard transport が存在することは確認済み)。

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm vitest run src/app/api/mcp --project unit`
Expected: PASS(3 tests)

- [ ] **Step 5: Commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/api/mcp
git commit -m "feat: /api/mcp に stateless Streamable HTTP の MCP サーバーを追加"
```

---

### Task 5: Hono 遮断ルート + OAuthProvider 配線(worker.ts)

**Files:**

- Create: `worker/routes/mcp-guard.ts`
- Test: `worker/routes/mcp-guard.test.ts`(workers pool)
- Modify: `worker/worker.ts`(全面書き換え、下記コード)

**Interfaces:**

- Consumes: Task 1 の `OAUTH_KV` binding / Task 4 の `/api/mcp` route
- Produces: `https://<host>/mcp`(OAuth 保護済み MCP エンドポイント)、`/oauth/token`・`/oauth/register`(ライブラリ処理)、`/oauth/authorize`(Task 6 の Next ページへフォールスルー)

- [ ] **Step 1: 失敗するテストを書く**

```ts
// worker/routes/mcp-guard.test.ts
import { describe, expect, it } from 'vitest';

import { mcpGuardRoutes } from './mcp-guard';

describe('mcpGuardRoutes', () => {
  it('blocks external POST /api/mcp', async () => {
    const response = await mcpGuardRoutes.request('/api/mcp', { method: 'POST' });
    expect(response.status).toBe(404);
  });

  it('blocks external GET /api/mcp', async () => {
    const response = await mcpGuardRoutes.request('/api/mcp');
    expect(response.status).toBe(404);
  });

  it('blocks nested paths under /api/mcp/', async () => {
    const response = await mcpGuardRoutes.request('/api/mcp/anything', { method: 'POST' });
    expect(response.status).toBe(404);
  });

  it('does not intercept unrelated /api routes', async () => {
    const response = await mcpGuardRoutes.request('/api/blog');
    expect(response.status).toBe(404); // Hono 未マッチのデフォルト 404(ルート未定義)
    // 未マッチであることはハンドラ数で担保: guard は /api/mcp 系しか登録しない
  });
});
```

補足: 最後のケースは Hono の「未定義ルートも 404」仕様と区別がつかないため、`mcpGuardRoutes.routes` の登録パスが `/api/mcp` と `/api/mcp/*` のみであることを assert する形にしてもよい:

```ts
  it('registers only /api/mcp paths', () => {
    const paths = mcpGuardRoutes.routes.map((route) => route.path);
    expect(new Set(paths)).toEqual(new Set(['/api/mcp', '/api/mcp/*']));
  });
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run worker/routes/mcp-guard --project workers`
Expected: FAIL(モジュール未作成)

- [ ] **Step 3: guard を実装**

```ts
// worker/routes/mcp-guard.ts
import { createFactory } from 'hono/factory';

type HonoEnv = {
  Bindings: Cloudflare.Env;
};

const factory = createFactory<HonoEnv>();
const app = factory.createApp();

// /api/mcp(Next の MCP route handler)への到達経路は worker.ts の mcpAPIHandler が
// OAuth 検証後に行う in-process forward(この Hono app を経由しない)のみに限定する。
// 公開インターネットからここに届いたリクエストは全て拒否する。
// Pair: src/app/api/mcp/route.ts はこの遮断を前提に x-mcp-user-id を信頼する。
app.all('/api/mcp', (c) => c.text('Not Found', 404));
app.all('/api/mcp/*', (c) => c.text('Not Found', 404));

export const mcpGuardRoutes = app;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm vitest run worker/routes/mcp-guard --project workers`
Expected: PASS

- [ ] **Step 5: worker.ts を OAuthProvider でラップ**

`worker/worker.ts` 全体を以下に置き換える:

```ts
import { OAuthProvider } from '@cloudflare/workers-oauth-provider';
import { cache } from 'hono/cache';
import { createFactory } from 'hono/factory';

// @ts-ignore - Generated at build time by OpenNext
import handler from '../.open-next/worker.js';

import { imageHandlers } from './handlers/images';
import { cursorRoutes } from './routes/cursors';
import { mcpGuardRoutes } from './routes/mcp-guard';

type HonoEnv = {
  Bindings: Cloudflare.Env;
};

const factory = createFactory<HonoEnv>();
const app = factory.createApp();

app
  .get(
    '/_next/image',
    cache({
      cacheName: 'opennextjs-cloudflare-images',
      cacheControl: 'public, max-age=3600, must-revalidate',
      vary: ['Accept', 'Accept-Encoding'],
    }),
    ...imageHandlers,
  )
  .route('/', cursorRoutes)
  .route('/', mcpGuardRoutes)
  .mount('/', handler.fetch as (request: Request, ...args: unknown[]) => Promise<Response>);

// OAuthProvider が Bearer token を検証し grant props を ctx.props に復号済み。
// Next の /api/mcp へ in-process forward する(Hono を経由しないので mcp-guard に
// 掛からない)。Pair: src/app/api/mcp/route.ts が x-mcp-user-id を読む。
const mcpAPIHandler = {
  fetch: async (request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> => {
    const props = (ctx as { props?: { userID?: number } }).props ?? {};
    if (props.userID === undefined) return new Response('Unauthorized', { status: 401 });
    const url = new URL(request.url);
    url.pathname = '/api/mcp';
    const forwarded = new Request(url, request);
    forwarded.headers.set('x-mcp-user-id', `${props.userID}`);
    return (handler.fetch as (request: Request, env: Cloudflare.Env, ctx: ExecutionContext) => Promise<Response>)(forwarded, env, ctx);
  },
};

// 最外殻。/mcp(API)と /oauth/token・/oauth/register はライブラリが処理し、
// それ以外(サイト本体・admin・/oauth/authorize ページ)は既存 Hono app に落ちる。
// KV binding "OAUTH_KV" 必須(ライブラリにハードコードされた名前)。
export default new OAuthProvider({
  apiRoute: '/mcp',
  apiHandler: mcpAPIHandler,
  defaultHandler: {
    fetch: (request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> => app.fetch(request, env, ctx),
  },
  authorizeEndpoint: '/oauth/authorize',
  tokenEndpoint: '/oauth/token',
  clientRegistrationEndpoint: '/oauth/register',
  scopesSupported: ['blog'],
});

// @ts-ignore - Generated at build time by OpenNext
export { DOQueueHandler } from '../.open-next/worker.js';
export { CursorRoom } from './durable-objects/cursor-room';
```

型メモ: `OAuthProvider` のジェネリクスは `Env = Cloudflare.Env` がデフォルト。`defaultHandler` / `apiHandler` の型(`ExportedHandlerWithFetch`)と噛み合わない場合はオブジェクトリテラルを `satisfies` で合わせる。`ctx.props` は型上 read-only なのでキャストで読む(ライブラリ側も `any` 扱い)。

- [ ] **Step 6: 全テスト + build で配線を検証**

```bash
pnpm lint && pnpm typecheck
pnpm vitest run --project workers
pnpm build
```

Expected: workers テスト green。`pnpm build`(OpenNext)が `worker.ts` の OAuthProvider import を含めて成功する。

- [ ] **Step 7: Commit**

```bash
git add worker/routes/mcp-guard.ts worker/routes/mcp-guard.test.ts worker/worker.ts
git commit -m "feat: worker を OAuthProvider でラップし /api/mcp の外部経路を遮断"
```

---

### Task 6: OAuth 認可ページ `/oauth/authorize`

**Files:**

- Create: `src/lib/mcp/oauth/index.ts` + `src/lib/mcp/oauth/oauth.test.ts`(node unit)
- Create: `src/app/(site)/oauth/authorize/page.tsx`
- Create: `src/app/(site)/oauth/authorize/styles.css.ts`
- Create: `src/app/(site)/oauth/authorize/_actions/authorize.ts`
- Create: `src/app/(site)/oauth/authorize/_components/authorize-form/index.tsx`
- Create: `src/app/(site)/oauth/authorize/_components/authorize-form/styles.css.ts`
- Create: `src/app/(site)/oauth/authorize/_components/authorize-form/authorize-form.test.tsx`(browser)

**Interfaces:**

- Consumes: `env.OAUTH_PROVIDER`(worker シェルが注入する `OAuthHelpers`)/ `payload.login` / Task 5 のエンドポイント設定(`/oauth/authorize`)
- Produces: ログイン+同意 UI。同意時に `completeAuthorization({ props: { userID, email } })` → クライアントへ redirect

- [ ] **Step 1: helpers アクセサの失敗するテストを書く**

```ts
// src/lib/mcp/oauth/oauth.test.ts
import { describe, expect, it } from 'vitest';

import { getOAuthHelpers } from '.';

describe('getOAuthHelpers', () => {
  it('returns undefined for env without OAUTH_PROVIDER', () => {
    expect(getOAuthHelpers({})).toBeUndefined();
    expect(getOAuthHelpers(undefined)).toBeUndefined();
    expect(getOAuthHelpers(null)).toBeUndefined();
  });

  it('returns the injected helpers object', () => {
    const helpers = { parseAuthRequest: async () => ({}) };
    expect(getOAuthHelpers({ OAUTH_PROVIDER: helpers })).toBe(helpers);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm vitest run src/lib/mcp/oauth --project unit`
Expected: FAIL

- [ ] **Step 3: アクセサを実装**

```ts
// src/lib/mcp/oauth/index.ts
import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';

// OAuthProvider(worker/worker.ts)はリクエスト処理前に env へ OAUTH_PROVIDER を
// 注入する。cloudflare-env.d.ts は wrangler.toml 由来の生成物なのでこの実行時
// メンバーを知らない — ここで runtime guard 付きで取り出す。
// `next dev`(worker シェル非経由)では undefined になる。
export const getOAuthHelpers = (env: unknown): OAuthHelpers | undefined => {
  if (typeof env !== 'object' || env === null) return undefined;
  if (!('OAUTH_PROVIDER' in env)) return undefined;
  const candidate = (env as { OAUTH_PROVIDER: unknown }).OAUTH_PROVIDER;
  if (typeof candidate !== 'object' || candidate === null) return undefined;
  return candidate as OAuthHelpers;
};
```

Run: `pnpm vitest run src/lib/mcp/oauth --project unit` → PASS

- [ ] **Step 4: Server Action を実装**

```ts
// src/app/(site)/oauth/authorize/_actions/authorize.ts
'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { redirect } from 'next/navigation';

import { getOAuthHelpers } from '@lib/mcp/oauth';
import { getPayloadClient } from '@lib/payload/client';
import { absoluteUrl } from '@utils/site-url';

import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';

export type AuthorizeState = {
  status: 'idle' | 'error';
  message?: string;
};

export const initialAuthorizeState: AuthorizeState = { status: 'idle' };

const readField = (fd: FormData, key: string): string => {
  const value = fd.get(key);

  return typeof value === 'string' ? value : '';
};

type LoginOutcome = { redirectTo: string } | AuthorizeState;

// redirect() は throw で制御するため try の外で呼ぶ必要がある。
// ここでは redirectTo を返すところまでを担い、throw しない。
const completeLogin = async (helpers: OAuthHelpers, email: string, password: string, query: string): Promise<LoginOutcome> => {
  try {
    const payload = await getPayloadClient();
    const { user } = await payload.login({ collection: 'users', data: { email, password } });
    if (user === undefined) return { status: 'error', message: 'ログインに失敗しました。' };

    const authRequest = await helpers.parseAuthRequest(new Request(absoluteUrl(`/oauth/authorize?${query}`)));
    const { redirectTo } = await helpers.completeAuthorization({
      request: authRequest,
      userId: `${user.id}`,
      metadata: { via: 'mcp-blog-authorize' },
      scope: authRequest.scope,
      props: { userID: user.id, email: user.email },
    });

    return { redirectTo };
  } catch (error) {
    console.error('[oauth] authorize failed', error);

    return { status: 'error', message: 'メールアドレスまたはパスワードが正しくありません。' };
  }
};

export const authorize = async (prev: AuthorizeState, formData: FormData): Promise<AuthorizeState> => {
  const email = readField(formData, 'email');
  const password = readField(formData, 'password');
  const query = readField(formData, 'authRequestQuery');

  const { env } = await getCloudflareContext({ async: true });
  const helpers = getOAuthHelpers(env);
  if (helpers === undefined) {
    return { status: 'error', message: 'OAuth プロバイダが初期化されていません。デプロイ済みの worker 経由でアクセスしてください。' };
  }

  const outcome = await completeLogin(helpers, email, password, query);
  if ('redirectTo' in outcome) redirect(outcome.redirectTo);

  return outcome;
};
```

- [ ] **Step 5: フォーム(client component)の失敗するテストを書く**

```tsx
// src/app/(site)/oauth/authorize/_components/authorize-form/authorize-form.test.tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { AuthorizeForm } from '.';

describe('AuthorizeForm', () => {
  it('renders email/password fields and the consent button', async () => {
    const screen = render(<AuthorizeForm authRequestQuery="client_id=abc" clientName="Claude" />);

    await expect.element(screen.getByLabelText(/email/i)).toBeVisible();
    await expect.element(screen.getByLabelText(/password/i)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: '許可する' })).toBeVisible();
  });
});
```

(browser project の render ユーティリティは既存の `contact-form.test.tsx` の import を確認して合わせる — `vitest-browser-react` でない場合はそちらの流儀に従うこと。)

- [ ] **Step 6: 失敗を確認**

Run: `pnpm vitest run src/app/\(site\)/oauth --project browser`
Expected: FAIL

- [ ] **Step 7: フォームとページを実装**

```tsx
// src/app/(site)/oauth/authorize/_components/authorize-form/index.tsx
'use client';

import { useActionState } from 'react';
import { Form } from 'react-aria-components';

import { Button } from '@components/button';
import { TextField } from '@components/text-field';

import { authorize, initialAuthorizeState } from '../../_actions/authorize';
import * as styles from './styles.css';

type Props = {
  authRequestQuery: string;
  clientName: string;
};

export const AuthorizeForm = ({ authRequestQuery, clientName }: Props) => {
  const [state, formAction, isPending] = useActionState(authorize, initialAuthorizeState);

  return (
    <Form action={formAction} className={styles.form}>
      <input type="hidden" name="authRequestQuery" value={authRequestQuery} />
      <p className={styles.lead}>
        {clientName} が blog 入稿ツール(記事の作成・更新・公開、画像アップロード)へのアクセスを要求しています。
      </p>
      <TextField name="email" type="email" label="email" isRequired autoComplete="email" />
      <TextField name="password" type="password" label="password" isRequired autoComplete="current-password" />
      {state.status === 'error' ? (
        <p role="alert" className={styles.error}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" isDisabled={isPending}>
        許可する
      </Button>
    </Form>
  );
};
```

```ts
// src/app/(site)/oauth/authorize/_components/authorize-form/styles.css.ts
import { css } from '@styled/css';

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  maxWidth: '[28rem]',
});

export const lead = css({
  color: 'text.primary',
  fontSize: 'sm',
});

export const error = css({
  color: 'state.error',
  fontSize: 'sm',
});
```

(`state.error` トークンが無ければ既存のエラー表示トークンを contact-form の styles.css.ts から流用する。無断で panda.config.ts にトークンを足さない。)

```tsx
// src/app/(site)/oauth/authorize/page.tsx
import { getCloudflareContext } from '@opennextjs/cloudflare';

import { getOAuthHelpers } from '@lib/mcp/oauth';
import { absoluteUrl } from '@utils/site-url';

import { AuthorizeForm } from './_components/authorize-form';
import * as s from './styles.css';

import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'authorize',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const toQueryString = (params: Record<string, string | string[] | undefined>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') search.set(key, value);
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    }
  }

  return search.toString();
};

const resolveClientName = async (helpers: OAuthHelpers, query: string): Promise<string> => {
  try {
    const authRequest = await helpers.parseAuthRequest(new Request(absoluteUrl(`/oauth/authorize?${query}`)));
    const client = await helpers.lookupClient(authRequest.clientId);

    return client?.clientName ?? '不明なクライアント';
  } catch {
    return '不明なクライアント';
  }
};

const AuthorizePage = async ({ searchParams }: Props) => {
  const query = toQueryString(await searchParams);
  const { env } = await getCloudflareContext({ async: true });
  const helpers = getOAuthHelpers(env);
  const clientName = helpers !== undefined ? await resolveClientName(helpers, query) : '不明なクライアント';

  return (
    <section className={s.root}>
      <h1 className={s.heading}>MCP アクセス許可</h1>
      <AuthorizeForm authRequestQuery={query} clientName={clientName} />
    </section>
  );
};

export default AuthorizePage;
```

```ts
// src/app/(site)/oauth/authorize/styles.css.ts
import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
  paddingBlock: '12',
});

export const heading = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.primary',
});
```

実装メモ:

- `(site)` グループなので SiteShell の chrome / heading 階層に乗る。既存下層ページ(contact 等)の見出しパターンと衝突する場合は `PageHeader` に置き換える(その場合 h1 は PageHeader が出す)。
- `TextField` が `type="password"` を透過しない場合は `@components/text-field` の実装を確認し、透過するよう props を通す(汎用性のある最小変更)。

- [ ] **Step 8: テストが通ることを確認**

Run: `pnpm vitest run src/app/\(site\)/oauth --project browser`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/mcp/oauth src/app/\(site\)/oauth
git commit -m "feat: OAuth 認可ページ(Payload ログイン + 同意)を追加"
```

---

### Task 7: runbook + フル検証 + staging E2E

**Files:**

- Create: `docs/mcp-blog-authoring.md`(接続・失効 runbook)
- 検証のみ: 全テスト / build / staging デプロイ

- [ ] **Step 1: runbook を書く**

`docs/mcp-blog-authoring.md`:

```markdown
# MCP blog 入稿 — 接続・運用 runbook

## エンドポイント

- 本番: `https://napochaan.com/mcp`
- staging: `https://stg.napochaan.com/mcp`(Cloudflare Access 配下のため要 Access 通過)

## クライアント接続

### Claude Code

    claude mcp add --transport http napochaan-blog https://napochaan.com/mcp

初回ツール実行時にブラウザが開き、Payload の email/password でログイン → 許可。

### claude.ai(Web / モバイル)

Settings → Connectors → Add custom connector → URL に `https://napochaan.com/mcp`。
認証は OAuth(Dynamic Client Registration)で自動。ログイン画面は Payload アカウント。

## 入稿ワークフロー

1. `upload_media`(thumbnail / 本文画像)→ 返る `id` と `![media:<id>]()` を控える
2. `create_post`(常に draft。slug は小文字英数字とハイフン)
3. admin UI の Live Preview で目視確認
4. `publish_post`(これが唯一の公開操作)

本文 Markdown の画像は `![media:<id>]()` 形式のみ。生 URL はツールが reject する。

## トークン失効(漏洩時)

grant は KV(`OAUTH_KV`)に保存されている。

    export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
    # 一覧(userId は Payload users の id)
    pnpm wrangler kv key list --binding OAUTH_KV --env production --prefix "grant:"
    # 失効(grant を消せば紐づく token も無効になる)
    pnpm wrangler kv key delete --binding OAUTH_KV --env production "<key>"

全失効したい場合は `token:` / `grant:` prefix のキーを全削除。

## 制約

- 本文に image-row 等の独自 block を含む記事は MCP から本文更新不可(get_post が bodyEditable: false を返す)
- `next dev`(localhost:3000)は worker シェルを経由しないため OAuth フローは動かない。動作確認は staging で行う
```

- [ ] **Step 2: フル検証**

```bash
pnpm lint && pnpm typecheck
pnpm vitest run
pnpm build
```

Expected: 全 green。build が `/api/mcp`(ƒ dynamic)と `/oauth/authorize` を含んで成功。

- [ ] **Step 3: staging デプロイ + E2E(手動・ユーザー同席推奨)**

staging-deploy-seed skill の手順で deploy した後:

1. `curl -X POST https://stg.napochaan.com/mcp` → **401** + `WWW-Authenticate` ヘッダー(OAuth 保護の確認)
2. `curl -X POST https://stg.napochaan.com/api/mcp -H 'x-mcp-user-id: 1'` → **404**(遮断の確認 — ヘッダー偽造が通らないこと)
3. `curl https://stg.napochaan.com/.well-known/oauth-authorization-server` → JSON メタデータ(endpoints が返る)
4. `claude mcp add --transport http napochaan-blog-stg https://stg.napochaan.com/mcp` → ブラウザで authorize → ログイン → 接続成功
5. Claude Code から `list_posts` → 既存記事が返る
6. `upload_media` → `create_post` → admin UI で draft 確認(Markdown→Lexical の見出し・リスト・画像が正しいか = round-trip 検証)
7. `publish_post` → `/blog/{slug}` が 200 で、**draft の最新内容が公開されている**こと(`update({ data: { _status: 'published' } })` が最新 draft を拾う挙動の確認 — 拾わない場合は publishPost を「最新 draft を read → 全フィールド再送」に修正)
8. claude.ai の Connectors に staging URL を登録 → 同じフローを 1 周
9. 記事に image-row block を admin で追加 → `get_post` が `bodyEditable: false` を返し、`update_post` の bodyMarkdown が reject されること

- [ ] **Step 4: Commit + PR**

```bash
git add docs/mcp-blog-authoring.md
git commit -m "docs: MCP blog 入稿の接続・運用 runbook を追加"
git push -u origin feat/mcp-blog-authoring
gh pr create --title "feat: 認証付き MCP サーバー(blog 入稿)" --body "..."
```

PR body には spec / plan へのリンクと staging E2E 結果を貼る。

---

## 既知のリスクと逃げ道

| リスク                                                                             | 逃げ道                                                                                                                     |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `WebStandardStreamableHTTPServerTransport` の import パス相違                      | `node_modules/@modelcontextprotocol/sdk/package.json` の exports を確認して修正(transport の存在自体は v1.29.0 で確認済み) |
| OAuthProvider の `defaultHandler` 型と Hono app の不整合                           | `{ fetch: (req, env, ctx) => app.fetch(req, env, ctx) }` のラップで吸収(プラン反映済み)                                    |
| `publish_post` が最新 draft を拾わない                                             | Task 7 Step 3-7 で検証。ダメなら findByID(draft:true) → 全フィールド + `_status: 'published'` を再送する実装に変更         |
| OpenNext の `WORKER_SELF_REFERENCE`(ISR revalidation)が OAuthProvider 経由で壊れる | 対象パスは apiRoute(/mcp)外なので defaultHandler にフォールスルーする設計。staging E2E の手順 6-7(ISR 反映)で確認          |
| `editorConfigFactory.default` のリクエスト毎呼び出しコスト                         | 気になる場合のみ module スコープで Promise を memoize(`getPayloadClient` と同じパターン)。初回実装では素直に毎回呼ぶ       |
