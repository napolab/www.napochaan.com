# 認証付き MCP サーバー(blog 入稿)設計

日付: 2026-07-16
ステータス: 承認待ち

## 目的

Claude Code(ローカル)と claude.ai(Web/モバイル)から、napochaan.com の blog を MCP 経由で入稿・推敲・公開できるようにする。認証は既存の Payload `users` アカウントに紐付け、既存の access 制御・ISR revalidation をそのまま生かす。

## スコープ

- blog の draft 作成・更新、公開(publish)、読み取り(一覧・取得)
- media アップロード(thumbnail・本文画像用)
- 本文は Markdown で受け取り、サーバー側で Lexical に変換

### スコープ外

- blog 以外のコレクション(works/news/logs/gallery)の書き込み
- 独自 block(image-row 等)の Markdown 記法対応(検出・防御のみ行う)
- token 失効の admin UI(runbook の手動手順のみ)
- ChatGPT 等その他クライアントの動作保証

## アーキテクチャ

既存の `napochaan-website` Worker 1つに統合する。新規 Worker は作らない。

```
                    napochaan-website Worker
┌──────────────────────────────────────────────────────────────────┐
│ OAuthProvider (@cloudflare/workers-oauth-provider) ← 最外殻       │
│ ├─ /mcp            → apiHandler(token 検証済み)                  │
│ │                     └→ props.userID をヘッダーに付けて          │
│ │                        .open-next handler.fetch を直接呼ぶ      │
│ ├─ /oauth/token    → ライブラリが処理                             │
│ ├─ /oauth/register → ライブラリが処理(Dynamic Client Reg.)      │
│ └─ それ以外        → defaultHandler = 既存 Hono app               │
│      ├─ app.all('/api/mcp/*') → 404(外部経路の遮断)            │
│      ├─ /_next/image, /api/cursors …(現状のまま)               │
│      ├─ /oauth/authorize → Next のログイン+同意ページ             │
│      └─ Next/OpenNext handler(サイト + Payload admin)           │
│           └─ /api/mcp route handler ← MCP サーバー本体            │
│                └─ getPayloadClient() → Local API(RSC と同じ)   │
└──────────────────────────────────────────────────────────────────┘
      + KV namespace `OAUTH_KV`(dev/staging/production の3環境)
```

### 設計判断

- **MCP 本体は Next の route handler**(`src/app/api/mcp/route.ts`)に置く。
  - `worker/worker.ts` から直接 `getPayload()` すると Payload 一式が OpenNext バンドルと二重バンドルになり、blog の `afterChange` hook が呼ぶ `revalidatePath()` が Next のリクエストコンテキスト外で壊れる。route handler 内なら RSC と同じ `getPayloadClient()`(`src/lib/payload/client`)を使え、hooks も正しく発火する。
- **transport は Streamable HTTP(stateless)**。Durable Object は使わない。
- **エンドポイントは `https://napochaan.com/mcp`**。claude.ai / Claude Code とも同じ URL を登録する。

### 内部経路の信頼境界

- 外部から `/api/mcp` への HTTP リクエストは Hono 層(defaultHandler)で 404 にする。
- OAuth 検証済みの apiHandler だけが `.open-next/worker.js` の `handler.fetch` を **in-process で直接呼ぶ**(Hono を経由しないため遮断に掛からない)。
- したがって `/api/mcp` に届いたリクエストの user ヘッダーは無条件に信頼できる。HMAC 署名・service binding は不要。
- 注意: OpenNext の `WORKER_SELF_REFERENCE` は最外殻(OAuthProvider シェル)から入り直すため内部経路には使わない・使えない。既存の ISR 用途のまま触らない。

## 認証フロー

1. クライアントが `POST /mcp`(token なし)→ 401 + `WWW-Authenticate`
2. クライアントが `/oauth/register`(DCR)→ ライブラリが自動処理
3. `GET /oauth/authorize` → Next 側の認可ページを表示
   - email/password を入力 → Server Action で `payload.login({ collection: 'users' })`(Local API)
   - 成功したら同意画面 → `env.OAUTH_PROVIDER.completeAuthorization()` で grant 作成
   - grant props に `{ userID, email }` を保存(ライブラリが暗号化して KV へ)
4. authorization code → access token 交換(ライブラリ)
5. 以後 `POST /mcp` + Bearer token → props 復元 → 内部 forward

### ツール実行時の権限

- apiHandler が `ctx.props.userID` をヘッダーで `/api/mcp` に渡す
- route handler は `payload.findByID({ collection: 'users', id })` でユーザーを復元し、**すべての Local API 呼び出しに `{ user, overrideAccess: false }`** を渡す
- つまり blog/media の access 制御(認証済みユーザーなら create/update 可)がそのまま効く
- `users` コレクションのスキーマ変更(`useAPIKey` 等)は不要。migration なし

### クライアント別の前提(調査済み)

- claude.ai カスタムコネクタ: OAuth 2.1 + PKCE + DCR 必須。redirect URI は `https://claude.ai/api/mcp/auth_callback`。`resource` パラメータを送ってくるので `aud` 検証が必要(workers-oauth-provider が追従)
- Claude Code: loopback redirect(localhost の可変ポート)。ポート非依存の loopback マッチが必要(ライブラリ側の対応を実装時に確認)

## MCP ツール定義(6個)

すべて zod で入力検証。名前は snake_case。

| ツール         | 入力                                                                            | 動作                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `list_posts`   | `status?`(draft/published), `limit?`                                            | `payload.find({ collection: 'blog', draft: true, ... })`。id/slug/title/publishedAt/\_status/excerpt を返す                |
| `get_post`     | `id` または `slug`                                                              | 1件取得。body は Lexical→Markdown 逆変換して返す。Markdown で表現できない block ノードを検出したら警告フラグを付ける       |
| `upload_media` | `url` または `base64`、`alt`、`filename`                                        | `payload.create({ collection: 'media', file })`。media ID と `![media:<id>]()` スニペットを返す                            |
| `create_post`  | `title`, `excerpt`, `thumbnailMediaID`, `bodyMarkdown`, `slug?`, `publishedAt?` | **常に draft** で作成。`publishedAt` 省略時は今日(Asia/Tokyo、`@utils/dayjs`)。admin URL + preview URL を返す              |
| `update_post`  | `id` + 各フィールド任意                                                         | 部分更新、draft version として保存。`bodyMarkdown` 省略時は本文に触らない。block 入り記事への `bodyMarkdown` 更新は reject |
| `publish_post` | `id`                                                                            | `_status: 'published'` に変更。唯一の公開操作(destructive annotation 付き)。公開 URL(`/blog/{slug}`)を返す                 |

### 設計判断

- **公開は独立ツール**: `create_post` / `update_post` はどう転んでも draft 止まり。LLM の誤操作で即公開される事故が構造的に起きない。
- **画像ワークフロー**: 先に `upload_media` → 返ってきた `![media:<id>]()` を Markdown に埋めて本文に使う。thumbnail も同じ流れで ID を渡す。
- **round-trip 防御**: admin UI で作った既存記事には Markdown で表現できない独自 block が入りうる。`get_post` が警告し、その記事の本文更新は reject(title/excerpt 等のみの更新は可)。MCP 経由の編集が既存 block を破壊しない。

## Markdown ⇔ Lexical 変換

- `src/lib/mcp/markdown-to-lexical/`(colocation、テスト同居)の純関数モジュール
- `convertMarkdownToLexical` + `editorConfigFactory.default({ config })`(`@payloadcms/richtext-lexical` 公式 API)
- 画像は `![media:<mediaID>]()` プレースホルダのみ対応(UploadFeature の組み込み transformer)。生 URL の `![alt](url)` が来たら「先に upload_media を使え」というエラーで LLM に自己修正させる
- 逆方向は `convertLexicalToMarkdown`(`get_post` 用)+ block ノード検出

## エラー処理

方針: エラーメッセージは「LLM が次の一手を自己修正できる指示」として書く(`isError: true` + 回復手順)。

- Payload の `ValidationError` はフィールド単位に整形。collection の admin description を流用(例: excerpt は「記事を一言で説明する独立した要約」)
- 生 URL 画像 / 存在しない `thumbnailMediaID` / block 入り記事への本文更新 → 回復手順つき reject
- `publish_post` は対象の title/slug と公開 URL をレスポンスに含める
- 予期しない例外は一般化メッセージのみ返し、詳細は Worker の observability ログへ

## セキュリティ

- OAuth 2.1 + PKCE + DCR は workers-oauth-provider に委譲。token は KV にハッシュのみ、grant props は暗号化保存
- 認可ページのログインは `payload.login()` 経由なので Payload 標準の lockout(maxLoginAttempts)を継承
- token 失効: workers-oauth-provider の grant 削除を使う手動 runbook を用意
- 新規 secret は不要(`PAYLOAD_SECRET` 等は既存)。KV namespace `OAUTH_KV` を3環境に追加

## テスト戦略(vitest TDD)

| 対象                                                   | プロジェクト | 方法                                                                                         |
| ------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------- |
| markdown-to-lexical / lexical-to-markdown / block 検出 | unit (node)  | 純関数。プレースホルダ・見出し・リスト・エッジケースを Red→Green                             |
| 各ツールハンドラ                                       | unit (node)  | `Payload` を interface 注入(DI)でモック。draft 固定・publish 分離・reject 経路を検証         |
| Hono 遮断ルート                                        | workers      | `worker.test-entry.ts` の流儀で外部 `/api/mcp` が 404 になることを検証                       |
| OAuth E2E                                              | 手動         | staging deploy → Claude Code `claude mcp add` → claude.ai コネクタ登録 → 入稿1本(runbook 化) |

ツールハンドラは `(deps: { payload, user }) => handlers` のファクトリで DI する(CQS/OCP)。workers-oauth-provider の内部はテストしない。

## 変更ファイル一覧(見込み)

| ファイル                          | 変更                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `wrangler.toml`                   | KV namespace `OAUTH_KV` ×3環境                            |
| `worker/worker.ts`                | OAuthProvider ラップ + `/api/mcp` 遮断ルート + apiHandler |
| `src/app/api/mcp/route.ts`        | MCP サーバー本体(Streamable HTTP)                         |
| `src/app/(site)/oauth/authorize/` | 認可ページ(ログイン + 同意、Server Action)                |
| `src/lib/mcp/`                    | 変換モジュール + ツールハンドラ(colocation)               |
| `docs/`                           | 接続・失効 runbook                                        |

依存追加: `@cloudflare/workers-oauth-provider`、`@modelcontextprotocol/sdk`、(必要なら)`agents` — transport は実装時に `createMcpHandler` 流用か自前かを判断する。

## 未解決事項(実装時に確認)

- workers-oauth-provider の loopback redirect(Claude Code)対応状況
- `@modelcontextprotocol/sdk` の Streamable HTTP transport を Next route handler(workerd)で動かす最小構成 — `agents` の `createMcpHandler` を route handler 内で使えるかを最初のスパイクで検証する
- 認可ページの `env.OAUTH_PROVIDER` アクセス(`getCloudflareContext().env` 経由)の動作確認
