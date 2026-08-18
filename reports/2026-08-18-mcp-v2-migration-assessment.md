# MCP v2 (2026-07-28) 移行アセスメント — 自前 MCP 実装

- 日付: 2026-08-18
- 対象: `src/lib/mcp` / `src/app/api/mcp/route.ts` / `worker/worker.ts`
- 結論: **移行は現実的。しかも v2 の設計はうちのスタック(Hono + Workers)に寄っている。**
  最大のコストは MCP そのものではなく **zod 3 → 4** の波及。
- 前提: 公式 Payload plugin は採用不可と別途確定済み
  (`reports/2026-08-18-payload-plugin-mcp-workerd-evaluation.md`)。v2 移行はそれとは独立に進められる。

## 1. v2 は beta ではなく stable。パッケージは3分割された

当初「2.0.0 beta」と見えていたが、npm 実測では **stable が出ている**。

| パッケージ                     | 最新   | 備考                                                       |
| ------------------------------ | ------ | ---------------------------------------------------------- |
| `@modelcontextprotocol/sdk`    | 1.30.0 | v1 モノリス。**2.x は存在しない**(ここで打ち止め)          |
| `@modelcontextprotocol/core`   | 2.0.0  | 公開 Zod スキーマ(spec + OAuth/OpenID)。deps: `zod ^4.2.0` |
| `@modelcontextprotocol/server` | 2.0.0  | サーバ実装。deps: `zod ^4.2.0` + core                      |
| `@modelcontextprotocol/client` | 2.0.0  | クライアント実装                                           |
| `@modelcontextprotocol/hono`   | 2.0.0  | **Hono アダプタ**。deps ゼロ / peer: `hono ^4.11.4`        |

「v1 の `@modelcontextprotocol/sdk` を 2.x に上げる」という移行経路は存在しない。
**パッケージを差し替える**移行になる。

## 2. うちにとって有利な点(実測)

### 2-1. `WebStandardStreamableHTTPServerTransport` は v2 でも生きている

`@modelcontextprotocol/hono` の README より:

```ts
import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { createMcpHonoApp } from '@modelcontextprotocol/hono';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });
const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
await server.connect(transport);

const app = createMcpHonoApp();
app.all('/mcp', c => transport.handleRequest(c.req.raw, { parsedBody: c.get('parsedBody') }));
```

現行 `src/app/api/mcp/route.ts` の骨格(`new McpServer` → tool 登録 →
`new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })` →
`server.connect` → `transport.handleRequest(request)`)が **ほぼ 1:1 で移植できる**。
v1 で `StreamableHTTPServerTransport`(Node 版)を使っていたら書き直しだったが、
うちは最初から Web 標準側を選んでいたため、この選択が効いている。

### 2-2. Node 依存がほぼ無い

`@modelcontextprotocol/server@2.0.0` の dist が参照する Node ビルトインは `node:stream` のみ
(stdio 系)。v1 の `mcp-handler` 経路が引いていた `http` / `net` / `redis` は無い。

### 2-3. Workers 向けの validator が公式に用意されている

`@modelcontextprotocol/server/validators/cf-worker` は Ajv(コード生成 = workerd の CSP で禁止)
の代わりに `@cfworker/json-schema`(インタプリタ実装)を使う差し替え口。
Workers 前提のユーザーが想定されている証拠。

### 2-4. tool 登録は既に v2 の形

リポジトリは既に `server.registerTool(name, { title, description, inputSchema, annotations }, handler)`
を 12 箇所で使っている。v2 で削除されたのは可変長の `server.tool(...)` の方で、うちは非該当。
必要なのは `inputSchema` の生シェイプを `z.object({ ... })` で包むことだけ(12 箇所、機械的)。

## 3. 実際のコスト

### 3-1. 最大の波及は zod 3 → 4

v2 は **zod 3 を非サポート**。移行ガイドいわく zod@3 では
「ツールが最初に list されたときに初めてエラーになる」= **サイレントに壊れる**。

| 項目                  | 現状       | 必要                                      |
| --------------------- | ---------- | ----------------------------------------- |
| `zod`                 | `^3.25.76` | `^4.2.0`                                  |
| `@hono/zod-validator` | `^0.7.6`   | `^0.9.0`(peer: `zod ^3.25.0 \|\| ^4.0.0`) |

zod を import しているのは 6 ファイル。うち MCP 以外が 4 つあり、そこが本当の作業量:

```
src/lib/mcp/tools/index.ts          ← MCP
src/lib/mcp/tools/legal/index.ts    ← MCP
src/app/api/media-upload/route.ts   ← 非 MCP
src/lib/contact/schema.ts           ← 非 MCP
src/lib/cursor/protocol.ts          ← 非 MCP
worker/handlers/images/index.ts     ← 非 MCP
```

`@hono/zod-validator` 0.9.0 が zod 3/4 両対応なので、**先に validator だけ上げておけば
zod 本体の切替を独立したステップに分離できる**。

### 3-2. その他の差分(移行ガイドより)

- ハンドラの第2引数が `extra` → 構造化された `ctx`(`extra.signal` → `ctx.mcpReq.signal` 等)
- `setRequestHandler` が Zod スキーマ → メソッド文字列(`'tools/call'`)
- エラー階層が `McpError` → `ProtocolError` / `SdkError` / `SdkHttpError`
- ヘッダ読み出しが Web 標準 `.get()` に統一
- 自動 codemod あり: `npx @modelcontextprotocol/codemod@latest v1-to-v2 .`

### 3-3. OAuth 層は独立

`worker/worker.ts` の `@cloudflare/workers-oauth-provider@0.8.1` は MCP SDK に依存しないので、
v2 移行で強制される変更はない。ただし v2 の認可強化で **Dynamic Client Registration が
正式に deprecated**(CIMD へ移行、サポート期間 12 ヶ月)。うちは `/oauth/register` = DCR を
公開しているので、これは「今すぐ壊れないが期限のある watch item」。

## 4. 未検証の項目(実装前に潰すべきもの)

> 2026-08-18 追記: 1〜3 は型定義と実測で解消済み。残るは 4 のみ(実装時に検証)。

1. ~~workerd 上でデフォルト validator のままで動くか~~ → **解消**。`jsonSchemaValidator` の既定は
   型定義に _"Runtime-selected validator (AJV-backed on Node.js, `@cfworker/json-schema`-backed on
   browser/workerd runtimes)"_ と明記。**SDK がランタイムを自動判別する**ので手動注入は原則不要。
   `validators/cf-worker` はカスタマイズ用の口であって必須ではない。
2. ~~`transport.handleRequest(request)` の第2引数が省略可能か~~ → **解消**。
   `handleRequest(req: Request, options?: HandleRequestOptions)` で optional。
3. ~~非 MCP 4 ファイルの zod 4 影響~~ → **ほぼ解消**。zod4 実測で `z` named / default export /
   `.email({message})` / `.min(1,{message})` / `discriminatedUnion` / `error.flatten().fieldErrors`
   がすべて v3 と同一に動作。ソース変更は不要の見込み(テストで最終確認)。
4. v2 のステートレス化に伴い `Mcp-Method` / `Mcp-Name` ヘッダが増えることで、
   `worker/app.ts` の `mcpGuardRoutes` や OAuth の `apiRoute: '/mcp'` 判定に影響が出ないか。
   → **未検証**。実装計画の Task 5 で確認する。

実装計画: `docs/superpowers/plans/2026-08-18-mcp-v2-migration.md`

## 5. 推奨する進め方

zod の切替と MCP の切替を**同時にやらない**のが要点。片方が壊れたときに切り分けられなくなる。

```
Step 1  @hono/zod-validator を 0.9.0 へ(zod 3/4 両対応になるだけ。挙動不変)
Step 2  zod 3 → 4。6 ファイル + テスト。MCP には触らない
Step 3  @modelcontextprotocol/sdk → @modelcontextprotocol/server + core。
        codemod 実行 → inputSchema を z.object() で包む → 型を通す
Step 4  workerd 実測(validators/cf-worker の要否、ガード/OAuth の疎通)
Step 5  staging で実 OAuth 経路の E2E(既存の cloudflared 手順)
```

## 6. 急ぐ理由はあるか

薄い。v1 の `@modelcontextprotocol/sdk@1.30.0` は現役で、うちのサーバは既に
v2 の中心思想であるステートレス構成(`sessionIdGenerator: undefined` +
Hono ガードによる前段認可)に到達している。ただし v1 モノリスは 1.30.0 で
打ち止めの可能性が高く(2.x が別パッケージに移ったため)、**セキュリティ修正の供給が
細る前に移る**というのが実際の動機になる。
