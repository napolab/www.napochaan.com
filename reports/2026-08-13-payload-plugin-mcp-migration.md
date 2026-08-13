# 自作 MCP → `@payloadcms/plugin-mcp` 置き換え調査

対象: `@payloadcms/plugin-mcp@3.88.0`（payload 本体モノレポ / MIT）
調査日: 2026-08-13

## 結論

**器（transport / 認証 / tool 登録 / API Key 管理 UI）だけをプラグインへ寄せる方針は成立する。**
ただしバンドルサイズに実測 +2.27 MB（gzip）のコストが乗り、Cloudflare Workers の
10 MB 上限に対する残り余裕が 3.8 MB → 1.5 MB へ縮む。採用するなら `redis` の
alias 除去（後述）をセットで入れること。

変換・検証層（`src/lib/mcp/markdown/**`, `errors/**`, `upload-url/**`）は
プラグインでは代替されないため温存する。プラグインの自動 CRUD が生やす
`updateBlog` は body を **raw Lexical JSON** で受け渡すだけで、Markdown 変換・
`![media:<id>](alt)` 正規化・block フェンス検証・alt 往復同期は一切持たない。

## 前提条件

| 項目             | 実測値                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| peerDependencies | `payload: "3.88.0"`（範囲ではなく完全固定）                                     |
| 使用 API         | `definePlugin`（payload 3.88 で追加）                                           |
| 実行基盤         | `mcp-handler@^1.0.7`（実解決 1.1.0）                                            |
| MCP SDK          | plugin dep は `1.30.0` / mcp-handler の peer は `1.26.0` 固定 → peer 警告が出る |
| zod              | `^3.25.50`（本プロジェクト `^3.25.76` と互換）                                  |

payload 一式（`payload` / `db-d1-sqlite` / `live-preview-react` / `next` /
`plugin-seo` / `richtext-lexical` / `storage-r2` / `translations`）を
3.84.1 → 3.88.0 に揃える必要がある。この upgrade 自体は別 commit で検証済み
（typecheck / lint / 1130 tests / next build / opennext build / migrations 10 件適用、
`generate:types` と `generate:importmap` はいずれも差分なし）。

## バンドルサイズ実測

`mcp-handler` の ESM entry が `import { createClient } from 'redis'` を
**トップレベル static import** している。`disableSse: true`（プラグインの既定）でも
import はバンドルに残るため、node-redis が丸ごと Worker に載る。

最小構成（`mcpPlugin({ collections: { blog: { enabled: { find: true } } } })`）で
`opennextjs-cloudflare build` → `wrangler deploy --dry-run` を実行した結果:

|             | handler.mjs (raw) | Total Upload | **gzip**              |
| ----------- | ----------------- | ------------ | --------------------- |
| plugin なし | 21,568,254 B      | 30,606 KiB   | **6,328 KiB**         |
| plugin あり | 30,394,829 B      | 42,458 KiB   | **8,648 KiB**         |
| 差分        | +8.8 MB           | +11.6 MB     | **+2,320 KiB (+37%)** |

バンドル内に `node:net` / `node:tls` 参照が 45 件、`redisUrl is required` が 2 件、
`createClient` が 11 件残っていることを確認済み。ビルド自体は成功する
（compatibility_date 2025-08-15 + `nodejs_compat`）。

### 緩和策

`redis` は `disableSse: true` の経路では一切実行されない完全な dead code なので、
`next.config.ts` の webpack alias で `redis: false` に潰して +2.27 MB を回収できる
見込み。`open-next.config.ts` には esbuild の alias フックが無いため、Next 側の
resolve alias で落とすのが筋。**PR 2 で実測して確認すること。**

## 認証

既定は `payload-mcp-api-keys` collection の静的 Bearer トークン
（`crypto.createHmac('sha256', payload.secret)` で `apiKeyIndex` を照合）。

現行の OAuth 2.1（`@cloudflare/workers-oauth-provider` + 動的クライアント登録）は
`overrideAuth(req, getDefault)` フックで維持できる。worker 層が付ける
`x-mcp-user-id` を読んで access settings を返す実装に差し替えればよい。

```ts
mcpPlugin({
  overrideAuth: async (req, getDefault) => {
    const id = req.headers.get('x-mcp-user-id');
    if (id === null) throw new UnauthorizedError();
    // user を引いて capability 許可済みの settings を返す
  },
});
```

なお capability は 2 段構えで、config の `enabled` に加えて管理画面の
**MCP → API Keys** で鍵ごとに ON にしないと使えない。`overrideAuth` を使う場合は
この settings オブジェクトを自前で組み立てることになる。

## エンドポイント衝突

プラグインは payload endpoint として `POST /api/mcp` と `GET /api/mcp` を生やす
（`src/app/(payload)/api/[...slug]/route.ts` が捌く）。現行の
`src/app/api/mcp/route.ts` は Next の route として**そちらが優先される**ため、
プラグイン採用時は削除が前提。

## 移植対象

`mcp.tools` のハンドラ signature は `(args, req, extra)`。既存 8 tools
（`list_posts` / `list_media` / `get_post` / `upload_media` / `create_upload_url` /
`create_post` / `update_post` / `publish_post`）と legal 系 tools は
`src/lib/mcp/tools/**` の `createBlogToolHandlers` をそのまま流用でき、
`registerBlogTools` の `server.registerTool` 呼び出しを `mcp.tools` の配列定義に
書き換えるだけで済む。`inputSchema` は zod の `.shape` を渡す。

## 既知の別件（本調査で発見、payload バージョンとは無関係）

`migrations/20260720_155000_legal_documents_autosave.ts` に対応する
`.json` スキーマスナップショットが存在しない（他の migration にはすべてある）。
このため `payload migrate:create` を実行すると毎回この migration と
byte 単位で同一の差分が再生成される。3.84.1 でも 3.88.0 でも同じ挙動。
