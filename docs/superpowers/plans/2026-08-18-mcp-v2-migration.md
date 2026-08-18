# MCP v2 移行 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 自前 MCP 実装を v1 モノリス `@modelcontextprotocol/sdk` から v2 の `@modelcontextprotocol/server` へ移行し、併せて zod を 4 系に上げる。

**Architecture:** 3 段階に分離する。(1) `@hono/zod-validator` を zod 3/4 両対応版に上げる → (2) zod 本体を 4 に上げる → (3) MCP SDK を差し替える。同時にやると破壊の切り分けが不能になるため、各段階を独立に検証する。MCP 側は `WebStandardStreamableHTTPServerTransport` が v2 でも同一 API で提供されるため、`src/app/api/mcp/route.ts` の骨格は変更しない。

**Tech Stack:** Next.js 15 (App Router) / Cloudflare Workers (workerd) / OpenNext / Hono / zod / `@modelcontextprotocol/server` 2.0.0 / vitest (`@cloudflare/vitest-pool-workers` 含む)

## Global Constraints

- `zod` は `^4.2.0` 以上（v2 SDK の要求。zod@3 では**ツールが最初に list されたときに初めて壊れる**＝サイレント破壊）
- `@hono/zod-validator` は `^0.9.0`（peer: `zod ^3.25.0 || ^4.0.0`）。zod 昇格より**先に**上げる
- `@modelcontextprotocol/server` は `^2.0.0`（peer/deps に `@modelcontextprotocol/core@2.0.0` と `zod ^4.2.0`）
- `@modelcontextprotocol/sdk`（v1 モノリス）は**削除する**。2.x は存在しない
- `hono` は `^4.12.23`（既存）で v2 アダプタの peer `^4.11.4` を満たす。変更不要
- 各タスク完了時に `pnpm lint && pnpm typecheck` を通すこと（`.claude/rules/coding-rules.md`）
- commit 運用: **タスク毎に commit してよい**（本人承認 2026-08-18。この決定が下の `CLAUDE.md` 既定を上書きする）。
  ただし **push と PR 作成はしない** — それらは difit レビュー承認後に別途判断する。
  （既定は `CLAUDE.md` の「勝手に commit しないこと」。本ブランチはローカル専用の feature branch であり、
  タスク単位で差分が分離されている方がレビュー精度と巻き戻しやすさで勝るため、本人が明示的に緩和した）
- 関数は arrow function、`let`/IIFE/非 null assertion/`forEach`/`any` 禁止（`.claude/rules/functional-programming.md`, `function-style.md`）

## 事前に実測済みの事実（推測ではない）

計画の前提はすべて 2026-08-18 に実物で確認済み。詳細は `reports/2026-08-18-mcp-v2-migration-assessment.md`。

| 確認事項                                                  | 結果                                                                                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `WebStandardStreamableHTTPServerTransport` の v2 での提供 | `@modelcontextprotocol/server` から export。オプション同一                                                             |
| `transport.handleRequest(request)` の第2引数              | `handleRequest(req: Request, options?: HandleRequestOptions)` = **省略可**                                             |
| `registerTool` の生シェイプ `inputSchema`                 | `InputArgs extends ZodRawShape` overload が存在（`auto-wrapped with z.object()`）= **12 箇所とも書き換え不要**         |
| zod 4 の `z` named / default export                       | 両方あり                                                                                                               |
| zod 4 の `.email({ message })` / `.min(1, { message })`   | 動作する                                                                                                               |
| zod 4 の `error.flatten().fieldErrors`                    | 動作し、出力も v3 と同一                                                                                               |
| zod 4 の `z.discriminatedUnion`                           | 動作する                                                                                                               |
| workerd での JSON Schema validator                        | `jsonSchemaValidator` の既定が**ランタイム自動判別**（Node=AJV / workerd=`@cfworker/json-schema`）。手動注入は原則不要 |

→ 想定される**ソース変更はごく小さい**。大半は依存の差し替えと検証。

## File Structure

| ファイル                           | 役割                                                               | 本計画での扱い                   |
| ---------------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| `package.json`                     | 依存定義                                                           | Task 1/2/3 で変更                |
| `src/app/api/mcp/route.ts`         | MCP サーバのエントリ（transport 生成・tool 登録）                  | Task 3 で import 2 行のみ変更    |
| `src/app/api/mcp/route.test.ts`    | 上記のユニットテスト（SDK を `vi.mock` している）                  | Task 3 で mock パス 2 箇所を変更 |
| `src/lib/mcp/tools/index.ts`       | blog 系 tool 登録（`McpServer` を型としてのみ import）             | Task 3 で type import 1 行を変更 |
| `src/lib/mcp/tools/legal/index.ts` | legal 系 tool 登録（同上）                                         | Task 3 で type import 1 行を変更 |
| `worker/mcp-v2-runtime.test.ts`    | **新規**。workerd 実行環境で v2 SDK が動くことを固定する回帰テスト | Task 4 で新規作成                |

zod を import する 6 ファイル（`src/lib/mcp/tools/index.ts`, `src/lib/mcp/tools/legal/index.ts`, `src/app/api/media-upload/route.ts`, `src/lib/contact/schema.ts`, `src/lib/cursor/protocol.ts`, `worker/handlers/images/index.ts`）と `src/app/(site)/contact/_actions/submit-contact.ts`（`error.flatten()` 使用）は、実測上ソース変更不要の見込み。Task 2 のテストで実際に確認する。

---

### Task 1: `@hono/zod-validator` を zod 3/4 両対応版へ上げる

zod 本体はまだ動かさない。このタスク単体では**挙動が変わらない**ことを確認するのが目的。

**Files:**

- Modify: `package.json`（`"@hono/zod-validator": "^0.7.6"` → `"^0.9.0"`）
- Test: `src/app/api/media-upload/route.test.ts`, `worker/handlers/images/helpers.test.ts`

**Interfaces:**

- Consumes: なし（最初のタスク）
- Produces: `@hono/zod-validator@^0.9.0` がインストールされた状態。peer が `zod ^3.25.0 || ^4.0.0` になり、Task 2 の zod 4 昇格が peer 衝突なしに行える

- [ ] **Step 1: 変更前のベースラインを取る**

Run:

```bash
pnpm exec vitest run src/app/api/media-upload/route.test.ts worker/handlers/images/helpers.test.ts
```

Expected: PASS（現状の緑を記録する。ここが赤なら本計画とは無関係の既存不具合なので、先に報告して停止すること）

- [ ] **Step 2: バージョンを上げる**

Run:

```bash
pnpm add @hono/zod-validator@^0.9.0
```

- [ ] **Step 3: peer が zod 4 を受け入れることを確認**

Run:

```bash
pnpm why zod | head -20
node -e "console.log(require('./node_modules/@hono/zod-validator/package.json').peerDependencies)"
```

Expected: `{ hono: '>=4.11.2', zod: '^3.25.0 || ^4.0.0' }` が出力される

- [ ] **Step 4: 挙動不変を確認**

Run:

```bash
pnpm exec vitest run src/app/api/media-upload/route.test.ts worker/handlers/images/helpers.test.ts
pnpm lint && pnpm typecheck
```

Expected: すべて PASS（Step 1 と同じ結果）

---

### Task 2: zod を 4 系へ上げる

MCP には一切触らない。zod 単独の破壊があればここで顕在化させる。

**Files:**

- Modify: `package.json`（`"zod": "^3.25.76"` → `"^4.2.0"`）
- Test: `src/lib/contact/schema.test.ts`, `src/lib/cursor/protocol.test.ts`, `src/app/api/media-upload/route.test.ts`, `worker/handlers/images/helpers.test.ts`

**Interfaces:**

- Consumes: Task 1 の `@hono/zod-validator@^0.9.0`
- Produces: `zod@^4.2.0`。v2 SDK が要求する zod 4 環境が整う

- [ ] **Step 1: バージョンを上げる**

Run:

```bash
pnpm add zod@^4.2.0
```

- [ ] **Step 2: 型を通す**

Run:

```bash
pnpm typecheck
```

Expected: エラーなし。

もしエラーが出た場合の既知の対処（実測で不要と判明しているが、環境差で出た場合のみ適用）:

- `z.string().email({ message })` が型エラー → `z.email({ message })` に置換（`src/lib/contact/schema.ts:5`）
- `error.flatten()` が型エラー → `z.flattenError(error)` に置換（`src/app/(site)/contact/_actions/submit-contact.ts:45`）

いずれも**動作は実測で確認済み**なので、型エラーが出ない限り書き換えないこと（YAGNI）。

- [ ] **Step 3: zod を使う全テストを走らせる**

Run:

```bash
pnpm exec vitest run src/lib/contact/schema.test.ts src/lib/cursor/protocol.test.ts src/app/api/media-upload/route.test.ts worker/handlers/images/helpers.test.ts
```

Expected: PASS

- [ ] **Step 4: 全テストを走らせる**

Run:

```bash
pnpm test
```

Expected: PASS。MCP 系テスト（`src/lib/mcp/**`）もこの時点ではまだ v1 SDK のまま緑であること

- [ ] **Step 5: lint / typecheck**

Run:

```bash
pnpm lint && pnpm typecheck
```

Expected: PASS

---

### Task 3: MCP SDK を v2 パッケージへ差し替える

**Files:**

- Modify: `package.json`（`@modelcontextprotocol/sdk` を削除し `@modelcontextprotocol/server@^2.0.0` を追加）
- Modify: `src/app/api/mcp/route.ts:4-5`
- Modify: `src/app/api/mcp/route.test.ts:19,25`
- Modify: `src/lib/mcp/tools/index.ts:35`
- Modify: `src/lib/mcp/tools/legal/index.ts:17`
- Test: `src/app/api/mcp/route.test.ts`, `src/lib/mcp/tools/tools.test.ts`, `src/lib/mcp/tools/legal/legal.test.ts`

**Interfaces:**

- Consumes: Task 2 の `zod@^4.2.0`
- Produces: `McpServer` と `WebStandardStreamableHTTPServerTransport` が `@modelcontextprotocol/server`（サブパスなしのメイン export）から供給される状態。`registerTool` / `server.connect` / `transport.handleRequest` の呼び出し形は変更しない

- [ ] **Step 1: テストの mock パスを先に v2 へ書き換える（失敗させる）**

`src/app/api/mcp/route.test.ts` の 19 行目と 25 行目、2 つの `vi.mock` の対象パスを 1 つに統合する。

変更前（19-31 行目、2 ブロック）:

```ts
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
```

変更後（v2 は両方ともメイン export なので 1 ブロックに統合する）:

```ts
vi.mock('@modelcontextprotocol/server', () => ({
  McpServer: class {
    registerTool(): void {}
    async connect(): Promise<void> {}
  },
  WebStandardStreamableHTTPServerTransport: class {
    async handleRequest(): Promise<Response> {
      return new Response('{}', { status: 200 });
    }
  },
}));
```

- [ ] **Step 2: テストを走らせて失敗することを確認**

Run:

```bash
pnpm exec vitest run src/app/api/mcp/route.test.ts
```

Expected: FAIL（`@modelcontextprotocol/server` が未インストールのため解決できない旨のエラー）

- [ ] **Step 3: パッケージを差し替える**

Run:

```bash
pnpm remove @modelcontextprotocol/sdk
pnpm add @modelcontextprotocol/server@^2.0.0
```

- [ ] **Step 4: 実装側の import を書き換える**

`src/app/api/mcp/route.ts:4-5` — 2 行を 1 行にまとめる。

変更前:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
```

変更後:

```ts
import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
```

`src/lib/mcp/tools/index.ts:35` と `src/lib/mcp/tools/legal/index.ts:17` — 型 import を書き換える。

変更前:

```ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
```

変更後:

```ts
import type { McpServer } from '@modelcontextprotocol/server';
```

`new McpServer({ name: 'napochaan-blog', version: '1.0.0' })`、`server.connect(transport)`、`transport.handleRequest(request)`、`new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })`、および 12 箇所の `server.registerTool(...)` は**いずれも変更しない**（v2 で同一 API であることを実測済み）。

- [ ] **Step 5: テストが通ることを確認**

Run:

```bash
pnpm exec vitest run src/app/api/mcp/route.test.ts src/lib/mcp/tools/tools.test.ts src/lib/mcp/tools/legal/legal.test.ts
```

Expected: PASS

- [ ] **Step 6: 残存参照がないことを確認**

Run:

```bash
grep -rn "@modelcontextprotocol/sdk" src worker package.json
```

Expected: 出力なし（1 件でも残っていたら書き換え漏れ）

- [ ] **Step 7: 全テスト + lint + typecheck**

Run:

```bash
pnpm test && pnpm lint && pnpm typecheck
```

Expected: PASS

---

### Task 4: workerd 実行環境で v2 SDK が動くことを固定する

`route.test.ts` は SDK を `vi.mock` しているため、**実物の SDK が workerd で動く保証にならない**。v1 で Payload plugin がハングした場所がまさにここなので、workerd 実行環境の回帰テストを新設する。

`worker/**/*.test.ts` は vitest の worker project（`@cloudflare/vitest-pool-workers`, `wrangler.toml` の `environment: 'test'`）で走るため、**実際の workerd 上で実行される**。

未検証項目だった「`validators/cf-worker` への差し替えが必要か」も、このテストで判明する。

**Files:**

- Create: `worker/mcp-v2-runtime.test.ts`
- Test: 同上

**Interfaces:**

- Consumes: Task 3 の `@modelcontextprotocol/server@^2.0.0`
- Produces: workerd 上で `McpServer` + `WebStandardStreamableHTTPServerTransport` が `tools/list` を返せることを保証する回帰テスト

- [ ] **Step 1: 失敗するテストを書く**

Create `worker/mcp-v2-runtime.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';

// v1 では mcp-handler が Node 版 transport を掴んでいたため workerd 上でリクエストが
// ハングした(reports/2026-08-18-payload-plugin-mcp-workerd-evaluation.md)。
// route.test.ts は SDK を vi.mock しているのでこの層を守れない。ここだけが
// 「実物の SDK が workerd で動く」ことを保証している。消さないこと。
const buildRequest = (body: unknown): Request =>
  new Request('https://example.test/api/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify(body),
  });

const handle = async (body: unknown): Promise<Response> => {
  const server = new McpServer({ name: 'runtime-probe', version: '1.0.0' });
  server.registerTool(
    'echo',
    { title: 'echo', description: 'workerd 実行確認用', inputSchema: { value: z.string() } },
    ({ value }) => ({ content: [{ type: 'text' as const, text: value }] }),
  );
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(buildRequest(body));
};

describe('MCP v2 SDK on workerd', () => {
  it('responds to tools/list without hanging', async () => {
    const response = await handle({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { result?: { tools?: { name: string }[] } };
    expect(payload.result?.tools?.map((tool) => tool.name)).toContain('echo');
  });

  it('executes a tool call', async () => {
    const response = await handle({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'echo', arguments: { value: 'ok' } } });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { result?: { content?: { text?: string }[] } };
    expect(payload.result?.content?.[0]?.text).toBe('ok');
  });
});
```

- [ ] **Step 2: 走らせて結果を確認**

Run:

```bash
pnpm exec vitest run worker/mcp-v2-runtime.test.ts
```

分岐:

- **PASS** → `validators/cf-worker` への差し替えは不要。Step 3 を飛ばして Step 4 へ
- **FAIL**（`new Function` / `eval` / CSP 由来のエラー、あるいはハング）→ Step 3 を実施

- [ ] **Step 3: (Step 2 が FAIL の場合のみ) Workers 向け validator に差し替える**

SDK の型定義によれば `jsonSchemaValidator` の既定値は
_"Runtime-selected validator (AJV-backed on Node.js, `@cfworker/json-schema`-backed on browser/workerd runtimes)"_
＝ **workerd は SDK 側が自動判別する**ため、通常この Step は不要（Step 2 は PASS するはず）。
自動判別が効かなかった場合のみ、`McpServer` の第 2 引数（`ServerOptions`）で明示注入する。

```ts
import { McpServer } from '@modelcontextprotocol/server';
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/server/validators/cf-worker';

const server = new McpServer(
  { name: 'napochaan-blog', version: '1.0.0' },
  { jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
);
```

差し替えが必要だった場合は、**`src/app/api/mcp/route.ts` 側にも同じ注入を入れる**こと（テストだけ通っても本番が落ちる）。

- [ ] **Step 4: 全テスト + lint + typecheck**

Run:

```bash
pnpm test && pnpm lint && pnpm typecheck
```

Expected: PASS

---

### Task 5: ガード境界の疎通確認とレビュー依頼

v2 はステートレス化に伴い `Mcp-Method` / `Mcp-Name` ヘッダが増える。うちのセキュリティ境界（`worker/routes/mcp-guard.ts` の外部遮断、`worker/worker.ts` の `apiRoute: '/mcp'` 判定）がこれに影響を受けないことを確認する。

**Files:**

- Test: `worker/app.test.ts`, `worker/routes/mcp-guard.test.ts`
- Modify: なし（想定。影響が出た場合のみ該当ファイル）

**Interfaces:**

- Consumes: Task 4 までの全変更
- Produces: レビュー可能な差分

- [ ] **Step 1: ガード境界のテストを走らせる**

Run:

```bash
pnpm exec vitest run worker/app.test.ts worker/routes/mcp-guard.test.ts
```

Expected: PASS。`/api/mcp` が外部から 404 で遮断され続けていること（ガードの登録順序がセキュリティ境界そのものであるため、ここが赤なら移行を止めて報告すること）

- [ ] **Step 2: 本番相当ビルドが通ることを確認**

Run:

```bash
pnpm build
```

Expected: 成功。v2 SDK が OpenNext のバンドルに乗ることを確認する（`worker/**` の vitest は workerd だが、Next 側のバンドル経路は別）

- [ ] **Step 3: 最終の全体検証**

Run:

```bash
pnpm test && pnpm lint && pnpm typecheck
```

Expected: すべて PASS

- [ ] **Step 4: difit でレビュー依頼**

Run:

```bash
pnpm difit
```

差分を提示してレビューを依頼する。**この時点では commit しない**（`CLAUDE.md`「勝手に commit しないこと」）。

- [ ] **Step 5: (レビュー承認後) commit**

承認を得てから実施する。段階が切り分けられるよう、Task 1-2（依存昇格）と Task 3-4（MCP v2 移行）で commit を分けること。

---

## 本計画の範囲外

- **staging への deploy と実 OAuth 経路の E2E**: 外部に出る操作なので本計画には含めない。ローカル workerd での確認（Task 4）まで完了させ、deploy の可否は別途判断する。
- **DCR → CIMD 移行**: v2 で Dynamic Client Registration が deprecated（サポート期間 12 ヶ月）。`worker/worker.ts` の `clientRegistrationEndpoint: '/oauth/register'` は当面動作するため、本計画では扱わない。期限付きの watch item として `reports/2026-08-18-mcp-v2-migration-assessment.md` に記録済み。
- **`@modelcontextprotocol/hono` の導入**: 現行は Next の route handler で完結しており、Hono アダプタを挟む必要がない。将来 MCP を worker の Hono 層へ移す場合の選択肢として記録するに留める。
