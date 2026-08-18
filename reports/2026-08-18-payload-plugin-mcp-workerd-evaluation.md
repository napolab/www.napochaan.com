# `@payloadcms/plugin-mcp` 評価 — Cloudflare Workers 上で採用可能か

- 日付: 2026-08-18
- 目的: 公式 MCP plugin を `logs` collection で試し、自前 MCP 実装(`src/lib/mcp`, 約 4,800 行)を
  どこまで置き換えられるかを評価する
- 結論: **現時点では採用不可**。技術的な良し悪し以前に、Cloudflare Workers(workerd)上で
  リクエストが処理できない。`payload` の 3.88.0 への bump も行っていない(不要と判明したため)。

## 検証環境

リポジトリ本体には一切変更を加えていない。scratchpad に最小 Worker を作り、
`wrangler.toml` の compat 設定だけ本体と一致させた。

```toml
compatibility_date = "2025-08-15"
compatibility_flags = ["nodejs_compat"]
```

プローブは `plugin-mcp` の `endpoints/mcp.js` と同じ呼び出し形
(`createMcpHandler` をモジュールトップレベルではなくリクエストハンドラ内で生成)を再現した。
この差は結果を分けるので重要 —— トップレベル生成では workerd の
「グローバルスコープで乱数生成・非同期 I/O 禁止」に触れて起動すらしない。

## 結果

| 段階 | 結果 | 備考 |
| --- | --- | --- |
| バンドル (`wrangler deploy --dry-run`) | ✅ | 2,323 KiB / gzip 459 KiB。`redis` `http` `net` は nodejs_compat の polyfill に解決される |
| 起動 (module evaluation) | ✅ | ハンドラ内生成なら通る |
| リクエスト処理 (`initialize`) | ❌ | **ハング**。7ms で workerd が打ち切り 500 |

```
[wrangler:info] POST /   404 Not Found (16ms)     ← ルーティングは生きている
[wrangler:info] POST /mcp 500 Internal Server Error (7ms)
✘ [ERROR] Uncaught Error: The Workers runtime canceled this request because it
  detected that your Worker's code had hung and would never generate a response.
```

### 原因

`mcp-handler@1.0.7` のエントリが静的 import している外部モジュール:

```
assert  async_hooks  events  http  net  stream  redis
@modelcontextprotocol/sdk/server/streamableHttp.js   ← Node 版 transport
@modelcontextprotocol/sdk/server/sse.js
```

`server/streamableHttp.js` は `http.ServerResponse` に書き込む Node 専用 transport。
`nodejs_compat` の `node:http` にはサーバ側(`createServer` / `ServerResponse`)の
実体がないため、レスポンスが完成せずハングする。

本リポジトリの自前実装が `server/webStandardStreamableHttp.js`
(Web 標準 Request/Response ベース)を直接使っているのは、まさにこれを避けるため。
plugin 側に `withRestoredWebGlobals`(*"Restores globals replaced by @hono/node-server"*
と書かれ、`globalThis.Request/Response` を書き戻すヘルパ)が存在すること自体が、
Node サーバ前提の設計であることを示している。

## 併せて判明した阻害要因

### 1. endpoint パスが固定で、既存ルートと衝突する

`dist/index.js` でパスはハードコードされており、設定できるのは `disabled` のみ:

```js
config.endpoints.push({ handler: initializeMCPHandler(pluginOptions), method: 'post', path: '/mcp' })
config.endpoints.push({ handler: initializeMCPHandler(pluginOptions), method: 'get',  path: '/mcp' })
```

Payload が `/api` を前置するので `/api/mcp` 固定。本リポジトリには明示ルート
`src/app/api/mcp/route.ts` があり、App Router では明示セグメントが
`(payload)/api/[...slug]` より優先されるため、plugin の endpoint には到達しない。
共存には自前ルートの退避が必要。

### 2. `payload` の peerDependency が完全一致ピン

```json
"peerDependencies": { "payload": "3.88.0" }
```

本リポジトリは `payload` / `@payloadcms/*` が全て `3.84.1`。試用するだけでも
4 マイナー分の bump が前提になる。

### 3. plugin 自身の依存ツリーに peer 不整合がある

`mcp-handler@1.0.7` の peer は `@modelcontextprotocol/sdk@"1.25.2"`(完全一致ピン)
だが、plugin は `1.30.0` を dependencies に持つ。npm では `--legacy-peer-deps` 無しに
インストールできない。

## MCP v2 (2026-07-28) との関係

「公式 plugin に寄せる」と「MCP v2 に移行する」は**別方向の話**である。

- plugin が使う SDK は `1.30.0` = v1 系(protocol `2025-11-25`)。
- v2 対応は TS SDK **2.0.0 beta** から(スキーマが `@modelcontextprotocol/core` に分離)。
  npm の `latest` は現在も 1.30.0。
- したがって plugin に寄せることは、v2 対応を Payload 側の bump 待ちにする選択になる。

一方、v2 の中心であるステートレス化(`initialize` ハンドシェイク廃止、`Mcp-Session-Id` 廃止、
method/tool 名を HTTP ヘッダへ出してゲートウェイで認可)は、本リポジトリでは
**既に手で到達している**:

- `src/app/api/mcp/route.ts` — `sessionIdGenerator: undefined` / `enableJsonResponse: true`
- 認可は前段の Hono ガード(`worker/app.ts` の `mcpGuardRoutes`)が持つ

v2 移行は Payload とは独立に進められる。

## 判断

- **公式 plugin は現状採用しない。** 理由はランタイム互換であり、tool 設計の良し悪しではない。
- 採用可能になる条件は `mcp-handler` が Web 標準 transport に移行すること
  (もしくは plugin が `mcp-handler` 依存をやめること)。それまで再評価しても結果は変わらない。
- `payload` 3.88.0 への bump は、この件を理由に急ぐ必要はない。
- `logs` に MCP ツールが欲しい場合は、既存の自前 MCP(`src/lib/mcp/tools`)に追加するのが唯一の道。
  `logs` は richText を持たないフラットな collection なので、Markdown codec 層は不要で、
  `legal` ツール(`src/lib/mcp/tools/legal`)が最も近い雛形になる。

## 再現手順

```bash
# scratchpad/stage0 に最小 Worker を作り、本体の compat 設定に揃える
npm install --legacy-peer-deps           # mcp-handler@1.0.7 + @modelcontextprotocol/sdk@1.30.0
npx wrangler deploy --dry-run --outdir=dist   # ← 通る
npx wrangler dev --port 8799 --local          # ← 起動する
curl -X POST http://127.0.0.1:8799/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}'
# ← ハングして 500
```
