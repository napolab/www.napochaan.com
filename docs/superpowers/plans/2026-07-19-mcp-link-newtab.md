# MCP リンク newTab 自動導出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MCP (create_post / update_post) 経由の本文リンクについて、外部ホストの URL は自動で `newTab: true` になるようにする（サイト方針「内部=同タブ・外部=別タブ」の自動適用）。

**Architecture:** Payload の markdown→lexical 変換は `newTab: false` をハードコードしているため、MCP 層で変換後の Lexical tree を歩いて link/autolink ノードの `newTab` を URL から再導出する純粋関数 `applyLinkNewTabPolicy` を挟む。read 側 (get_post) は変更しない — newTab は URL から決定的に導出されるので Markdown にマーカーは不要。

**Tech Stack:** TypeScript (tsgo), vitest (node env — `.test.ts`), neverthrow, Payload lexical types (`Blog['body']`)

**Spec:** `docs/superpowers/specs/2026-07-19-mcp-link-newtab-design.md`

## Global Constraints

- 関数は arrow function のみ (`func-style`)。`let` / IIFE / `forEach` / non-null `!` / `any` 禁止。
- `Boolean()` / `String()` / `Number()` ラッパー禁止。真偽判定は明示比較。
- colocation: `src/lib/mcp/markdown/link-newtab/index.ts` + `link-newtab.test.ts`。
- テストは `.test.ts` (node env)。window / DOM を触らない。
- 各タスク終了時に `pnpm lint && pnpm typecheck` が通ること（pre-commit hook が両方走る）。
- commit message 末尾: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01BnB9YC6BjSFPQTBCdMqZAo`
- 判定ルール（spec より）: `https?://` 絶対 URL でホスト名 ≠ 自サイトホスト → `true`。自ホスト / 相対 / `#` / `mailto:` / `tel:` / パース不能 → `false`。ホスト名は完全一致（サブドメインは別ホスト）。

---

### Task 1: `resolveNewTab` 純粋関数 (TDD)

**Files:**

- Create: `src/lib/mcp/markdown/link-newtab/index.ts`
- Test: `src/lib/mcp/markdown/link-newtab/link-newtab.test.ts`

**Interfaces:**

- Consumes: なし（純粋関数、依存ゼロ）
- Produces: `resolveNewTab(url: string, siteBaseUrl: string): boolean` — Task 2 が使う

- [ ] **Step 1: Write the failing test**

`src/lib/mcp/markdown/link-newtab/link-newtab.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { resolveNewTab } from '.';

const SITE = 'https://napochaan.com';

describe('resolveNewTab', () => {
  it.each([
    ['https://booth.pm/ja/items/1', true],
    ['http://example.com/page', true],
    ['https://napochaan.com/blog/v3', false],
    ['https://NAPOCHAAN.COM/blog/v3', false], // URL が hostname を小文字正規化するので自ホスト
    ['https://stg.napochaan.com/blog/v3', true], // サブドメインは別ホスト扱い（spec 承認済み）
    ['/blog/v3', false],
    ['#section', false],
    ['mailto:hi@napochaan.com', false],
    ['tel:+81-90-0000-0000', false],
    ['not a url', false],
    ['', false],
  ])('resolveNewTab(%j) === %j', (url, expected) => {
    expect(resolveNewTab(url, SITE)).toBe(expected);
  });

  it('siteBaseUrl がパース不能でも throw せず false に落ちる', () => {
    expect(resolveNewTab('https://example.com', 'not a url')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/mcp/markdown/link-newtab/link-newtab.test.ts`
Expected: FAIL — `Failed to resolve import "."` （index.ts 不在）

- [ ] **Step 3: Write minimal implementation**

`src/lib/mcp/markdown/link-newtab/index.ts`:

```typescript
// MCP write path のリンク newTab 導出。サイト方針「内部リンク=同タブ・外部リンク=別タブ」を
// URL から決定的に導出する（Markdown には newTab を表現する構文がなく、Payload の
// markdown→lexical 変換は newTab: false 固定のため）。設計は
// docs/superpowers/specs/2026-07-19-mcp-link-newtab-design.md を参照。
const HTTP_ABSOLUTE = /^https?:\/\//i;

export const resolveNewTab = (url: string, siteBaseUrl: string): boolean => {
  if (!HTTP_ABSOLUTE.test(url)) return false;
  try {
    return new URL(url).hostname !== new URL(siteBaseUrl).hostname;
  } catch {
    return false;
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/mcp/markdown/link-newtab/link-newtab.test.ts`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/mcp/markdown/link-newtab
git commit -m "feat(mcp): add resolveNewTab URL policy function"
```

---

### Task 2: `applyLinkNewTabPolicy` tree transform (TDD)

**Files:**

- Modify: `src/lib/mcp/markdown/link-newtab/index.ts`
- Test: `src/lib/mcp/markdown/link-newtab/link-newtab.test.ts`（追記）

**Interfaces:**

- Consumes: `resolveNewTab` (Task 1)
- Produces: `applyLinkNewTabPolicy(body: Blog['body'], siteBaseUrl: string): Blog['body']` — Task 3 の `prepareBody` が使う。immutable（入力 tree を変更しない）。

- [ ] **Step 1: Write the failing tests**

`link-newtab.test.ts` に追記（import に `applyLinkNewTabPolicy` と `Blog` 型を追加）:

```typescript
import { applyLinkNewTabPolicy, resolveNewTab } from '.';

import type { Blog } from '@payload-types';
```

```typescript
type NodeRecord = Record<string, unknown>;

const linkNode = (fields: NodeRecord): NodeRecord => ({
  type: 'link',
  version: 3,
  fields,
  children: [{ type: 'text', text: 'x', version: 1 }],
});

// 段落 1 つに inline ノード群を入れた最小 body。tools.test.ts の paragraphBody と
// 同じ「テストでは as で lexical 形を作る」流儀。
const bodyWith = (...nodes: NodeRecord[]): Blog['body'] =>
  ({
    root: { type: 'root', children: [{ type: 'paragraph', version: 1, children: nodes }], direction: null, format: '', indent: 0, version: 1 },
  }) as unknown as Blog['body'];

const inlineNodesOf = (body: Blog['body']): NodeRecord[] => {
  const [paragraph] = body.root.children;
  return (paragraph as { children: NodeRecord[] }).children;
};

describe('applyLinkNewTabPolicy', () => {
  it('外部ホストの custom link は newTab: true になる', () => {
    const body = bodyWith(linkNode({ linkType: 'custom', newTab: false, url: 'https://booth.pm/x' }));
    const [link] = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect((link?.fields as NodeRecord).newTab).toBe(true);
  });

  it('自ホスト絶対 URL と相対 URL は newTab: false のまま', () => {
    const body = bodyWith(
      linkNode({ linkType: 'custom', newTab: true, url: 'https://napochaan.com/blog/v3' }),
      linkNode({ linkType: 'custom', newTab: true, url: '/blog/v3' }),
    );
    const nodes = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect(nodes.map((node) => (node.fields as NodeRecord).newTab)).toEqual([false, false]);
  });

  it('autolink ノードにも適用される', () => {
    const body = bodyWith({ ...linkNode({ linkType: 'custom', newTab: false, url: 'https://example.com' }), type: 'autolink' });
    const [link] = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect((link?.fields as NodeRecord).newTab).toBe(true);
  });

  it('linkType: internal の doc リンクは fields を触らない', () => {
    const fields = { linkType: 'internal', newTab: false, doc: { relationTo: 'blog', value: 1 } };
    const body = bodyWith(linkNode(fields));
    const [link] = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect(link?.fields).toEqual(fields);
  });

  it('ネストした構造（list > listitem > link）でも適用される', () => {
    const nested = {
      root: {
        type: 'root',
        direction: null,
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'list',
            version: 1,
            children: [{ type: 'listitem', version: 1, children: [linkNode({ linkType: 'custom', newTab: false, url: 'https://booth.pm/x' })] }],
          },
        ],
      },
    } as unknown as Blog['body'];
    const result = applyLinkNewTabPolicy(nested, SITE);
    const [list] = result.root.children;
    const [item] = (list as { children: NodeRecord[] }).children;
    const [link] = (item.children as NodeRecord[]);
    expect((link?.fields as NodeRecord).newTab).toBe(true);
  });

  it('link 以外のノードと無関係な fields は保存される', () => {
    const text = { type: 'text', text: 'plain', version: 1, format: 1 };
    const body = bodyWith(text, linkNode({ linkType: 'custom', newTab: false, url: 'https://booth.pm/x', id: 'abc' }));
    const [kept, link] = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect(kept).toEqual(text);
    expect((link?.fields as NodeRecord).id).toBe('abc');
  });

  it('入力 body を mutate しない', () => {
    const body = bodyWith(linkNode({ linkType: 'custom', newTab: false, url: 'https://booth.pm/x' }));
    const snapshot = structuredClone(body);
    applyLinkNewTabPolicy(body, SITE);
    expect(body).toEqual(snapshot);
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `pnpm vitest run src/lib/mcp/markdown/link-newtab/link-newtab.test.ts`
Expected: FAIL — `applyLinkNewTabPolicy` is not exported（resolveNewTab の 12 件は PASS のまま）

- [ ] **Step 3: Write the implementation**

`index.ts` に追記:

```typescript
import type { Blog } from '@payload-types';

type BodyNode = Blog['body']['root']['children'][number];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// lexical の子ノードは payload-types では index signature 越しの unknown。
// type を持つレコードだけを変換対象にする（他は素通し — 落とさない）。
const isBodyNode = (value: unknown): value is BodyNode => isRecord(value) && typeof value.type === 'string';

const transformChildren = (children: unknown, siteBaseUrl: string): unknown => {
  if (!Array.isArray(children)) return children;
  return children.map((child) => (isBodyNode(child) ? transformNode(child, siteBaseUrl) : child));
};

const transformNode = (node: BodyNode, siteBaseUrl: string): BodyNode => {
  const withChildren = 'children' in node ? { ...node, children: transformChildren(node.children, siteBaseUrl) } : node;
  if (node.type !== 'link' && node.type !== 'autolink') return withChildren;
  const fields = isRecord(node.fields) ? node.fields : {};
  // internal doc リンクは admin 専用の形（URL を持たない）— ポリシー対象外。
  if (fields.linkType === 'internal') return withChildren;
  const url = typeof fields.url === 'string' ? fields.url : '';
  return { ...withChildren, fields: { ...fields, newTab: resolveNewTab(url, siteBaseUrl) } };
};

// Lexical tree を再帰的に歩き、link/autolink ノードの newTab を URL から常に再導出する。
// update_post の round-trip でも毎回適用される（「常に再導出」 — spec の承認済み決定）。
export const applyLinkNewTabPolicy = (body: Blog['body'], siteBaseUrl: string): Blog['body'] => ({
  ...body,
  root: { ...body.root, children: body.root.children.map((node) => transformNode(node, siteBaseUrl)) },
});
```

注意: `transformChildren` と `transformNode` は相互参照する。arrow function の `const` はホイストされないため、**`transformNode` を `transformChildren` より先に定義できない**（`transformChildren` が参照する時点では実行時解決なので上記の順序で動くが、oxlint の `no-use-before-define` が実行時参照を許すか確認し、警告される場合は `transformNode` を先に定義して `transformChildren` をその上に置く並べ替えで対応する）。

- [ ] **Step 4: Run tests to verify all pass**

Run: `pnpm vitest run src/lib/mcp/markdown/link-newtab/link-newtab.test.ts`
Expected: PASS (19 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/mcp/markdown/link-newtab
git commit -m "feat(mcp): add applyLinkNewTabPolicy lexical tree transform"
```

---

### Task 3: `prepareBody` への組み込み + deps 注入

**Files:**

- Modify: `src/lib/mcp/tools/index.ts`（`BlogToolDeps`・`createBlogToolHandlers` 冒頭・`prepareBody`・`BODY_MARKDOWN_HELP`）
- Modify: `src/app/api/mcp/route.ts:55`（deps 注入）
- Test: `src/lib/mcp/tools/tools.test.ts`（`createDeps` + 統合テスト追加）

**Interfaces:**

- Consumes: `applyLinkNewTabPolicy(body, siteBaseUrl)` (Task 2)
- Produces: `BlogToolDeps` に `siteBaseUrl: string` が増える（route.ts が渡す）

- [ ] **Step 1: Write the failing integration test**

`src/lib/mcp/tools/tools.test.ts` の `createDeps` に `siteBaseUrl` を追加:

```typescript
  const deps = { payload, user, codec, signingSecret: SIGNING_SECRET, siteBaseUrl: 'https://napochaan.com' } as unknown as BlogToolDeps;
```

`describe('createPost', ...)` 内に統合テストを追加:

```typescript
  it('本文リンクの newTab を URL から導出して保存する', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    payload.create.mockResolvedValue({ id: 12, slug: 'links' });
    codec.toLexical.mockReturnValue({
      root: {
        type: 'root',
        direction: null,
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              { type: 'link', version: 3, fields: { linkType: 'custom', newTab: false, url: 'https://booth.pm/x' }, children: [] },
              { type: 'link', version: 3, fields: { linkType: 'custom', newTab: false, url: '/blog/v3' }, children: [] },
            ],
          },
        ],
      },
    } as unknown as Blog['body']);

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 'links',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: '[a](https://booth.pm/x) と [b](/blog/v3)',
    });

    expect(result.isError).toBeUndefined();
    const data = payload.create.mock.calls[0]?.[0]?.data as Blog;
    const [paragraph] = data.body.root.children;
    const links = (paragraph as { children: { fields: { newTab: boolean } }[] }).children;
    expect(links.map((link) => link.fields.newTab)).toEqual([true, false]);
  });
```

（`Blog` 型が未 import なら `import type { Blog } from '@payload-types';` を追加。既存 import を確認して重複させない。）

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/mcp/tools/tools.test.ts`
Expected: 新テストのみ FAIL — `newTab` が `[false, false]` のまま（transform 未接続）。既存テストは PASS。

- [ ] **Step 3: Wire the transform**

`src/lib/mcp/tools/index.ts`:

1. import 追加（`../markdown` の import 行の近く）:

```typescript
import { applyLinkNewTabPolicy } from '../markdown/link-newtab';
```

2. `BlogToolDeps` に追加:

```typescript
export type BlogToolDeps = {
  payload: Payload;
  user: User;
  codec: MarkdownCodec;
  signingSecret: string;
  siteBaseUrl: string;
};
```

3. `createBlogToolHandlers` の destructure に追加:

```typescript
  const { payload, user, codec, signingSecret, siteBaseUrl } = deps;
```

4. `prepareBody` の末尾に `.map` を追加:

```typescript
  const prepareBody: PrepareBody = (bodyMarkdown) =>
    validateBodyMarkdown(bodyMarkdown, verifyMediaExists, findMediaByFilename)
      .andThen(() => validatePlaceholderAlts(bodyMarkdown))
      .andThen((writtenAltByID) => syncMediaAlts(writtenAltByID))
      .andThen(() => toLexicalSafe(stripPlaceholderAlts(bodyMarkdown)))
      .map((body) => applyLinkNewTabPolicy(body, siteBaseUrl));
```

5. `BODY_MARKDOWN_HELP` の配列（リンク説明のある冒頭ブロック）に 1 行追加（画像説明の後、空行 `''` の前）:

```typescript
  '外部サイトへのリンクは自動で別タブ（newTab）になる。サイト内リンクは相対 URL（/blog/... 等）で書くと同タブになる。target 指定の構文はない。',
```

`src/app/api/mcp/route.ts` の `registerBlogTools` 呼び出しに追加:

```typescript
  registerBlogTools(server, {
    payload,
    user,
    codec: createMarkdownCodec(editorConfig),
    signingSecret: env.PAYLOAD_SECRET,
    siteBaseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
  });
```

（`create-preview-url-factory` / `@utils/site-url` と同じ「BASE_URL + localhost fallback」規約。）

- [ ] **Step 4: Run tests to verify all pass**

Run: `pnpm vitest run src/lib/mcp/tools/tools.test.ts src/lib/mcp/markdown/link-newtab/link-newtab.test.ts`
Expected: PASS（既存 + 新規全件）

- [ ] **Step 5: Run lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: いずれも exit 0

- [ ] **Step 6: Commit**

```bash
git add src/lib/mcp/tools/index.ts src/lib/mcp/tools/tools.test.ts src/app/api/mcp/route.ts
git commit -m "feat(mcp): derive link newTab from URL in post body pipeline"
```

---

### Task 4: 全体検証 + live E2E

**Files:**

- なし（検証のみ。修正が出た場合は該当タスクの流儀で直してコミット）

**Interfaces:**

- Consumes: Task 1-3 の全成果物
- Produces: 検証済みブランチ（レビュー依頼可能な状態）

- [ ] **Step 1: Full test suite**

Run: `pnpm vitest run`
Expected: 全件 PASS（baseline は 1285 passed | 1 skipped + 本 feature 追加分）

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: exit 0

- [ ] **Step 3: Live E2E — ローカル D1 準備 + production build**

worktree ローカルの `.wrangler` state（使い捨て）に対して:

```bash
pnpm payload migrate
pnpm seed:import   # worktree ローカル D1 のみ。dev admin (id=1) と media が入る
pnpm build
```

Expected: migrate/seed/build いずれも成功。
（`pnpm dev` は禁止（deny 設定）。検証ルートは memory の worktree-live-verification-path に従い `next start`。）

- [ ] **Step 4: Live E2E — server 起動 + MCP create_post**

```bash
pnpm exec next start -p 3001 &   # background で起動（`pnpm start -- -p` は罠なので使わない）
sleep 5
# media id を確認（seed 済みの適当な id を thumbnail に使う）
curl -s -X POST http://localhost:3001/api/mcp \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -H 'x-mcp-user-id: 1' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_media","arguments":{}}}'
# ↑ の結果から media id を 1 つ選び <MEDIA_ID> に入れて:
curl -s -X POST http://localhost:3001/api/mcp \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -H 'x-mcp-user-id: 1' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_post","arguments":{"title":"newTab E2E","slug":"newtab-e2e","excerpt":"e2e","thumbnailMediaID":<MEDIA_ID>,"bodyMarkdown":"[Booth](https://booth.pm/ja) と [過去記事](/blog/v3) と https://example.com"}}}'
```

Expected: create_post が成功 JSON を返す（`isError` なし）。

- [ ] **Step 5: Live E2E — D1 の lexical JSON で newTab を確認**

```bash
sqlite3 "$(ls .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite | head -1)" \
  "SELECT version__body FROM _blog_v ORDER BY id DESC LIMIT 1;" | python3 -m json.tool | grep -B2 -A2 newTab
```

Expected: `https://booth.pm/ja` のリンクと `https://example.com` の autolink が `"newTab": true`、`/blog/v3` が `"newTab": false`。
（カラム名/テーブル名が違う場合は `.schema _blog_v` で確認して読み替える。draft は versions テーブル `_blog_v` に入る。）

- [ ] **Step 6: get_post round-trip 確認**

```bash
curl -s -X POST http://localhost:3001/api/mcp \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -H 'x-mcp-user-id: 1' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_post","arguments":{"slug":"newtab-e2e"}}}'
```

Expected: `bodyMarkdown` がプレーンな `[Booth](https://booth.pm/ja)` 形（マーカーなし）で返る — newTab は export に漏れない。

- [ ] **Step 7: server 停止 + 結果報告**

`next start` プロセスを kill し、E2E 結果（newTab true/false の実測値）をまとめてユーザーに報告。difit / review 依頼へ進む。

---

## Self-Review Notes

- spec の全セクションをタスクへ対応付け済み: 判定ルール→Task 1、tree transform→Task 2、prepareBody/deps/route→Task 3、テスト計画 4 項目→Task 1-4。
- 型整合: `resolveNewTab(url: string, siteBaseUrl: string): boolean` / `applyLinkNewTabPolicy(body: Blog['body'], siteBaseUrl: string): Blog['body']` / `BlogToolDeps.siteBaseUrl: string` で全タスク一貫。
- BODY_MARKDOWN_HELP への 1 行追加は spec に明記がないが、「LLM が構文を探して HTML を書こうとする」誤用防止のための write 側ドキュメント整備で、spec の趣旨（自動判定・構文なし）の記述そのもの。
