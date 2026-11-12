# CMS 分離（cms.napochaan.com）事前調査

2026-11-12。`docs/superpowers/specs/2026-11-12-cms-split-design.md` の根拠。

## 参考: autonomy-inc/www.prisma.com

- pnpm workspaces monorepo。`apps/cms`（Payload + OpenNext, `cms.projectprisma.club`）、`apps/web`（Astro）、`apps/media`（画像 Worker）。
- web → cms は Service Binding `env.CMS`（named entrypoint `CMS`）の JS RPC のみ。cms を HTTP fetch しない。
- RPC 契約は型のみの `apps/cms/src/rpc/contract.ts`。Payload 生ドキュメントは返さず DTO に projection する。
  - `Service<T>` は `unknown` を含む戻り値を `never` に潰す（`payload-types.ts` の `[k: string]: unknown`）。
  - Lexical の SerializedEditorState は RPC 型を通すと TS2589 になるため `JSON.stringify` した string で渡す。
- RPC メソッド内で Payload を使うには OpenNext の `runWithCloudflareRequestContext` で包む（`apps/cms/src/rpc/local-payload.ts`）。RPC は OpenNext の fetch handler を通らないため。
- 下書きは `findDraftByID({ previewSecret })`。secret のみで認可。
- prisma は cms→web の purge 経路を持たず、60 秒 TTL + SWR を採用（purge は entrypoint スコープで cms から呼べないため）。
- ローカル: `wrangler dev`（cms）を先に起動、dev registry で接続。registry は Worker 名単位でマシン全体共有のため、worktree 間で同名 Worker が衝突した実例あり → `WRANGLER_REGISTRY_PATH` / `MINIFLARE_REGISTRY_PATH` を worktree ごとに固定。
- 参照コピー: scratchpad `prisma/`（セッション一時領域）。

## Cloudflare 仕様

| 項目 | 結論 | 出典 / 確度 |
| --- | --- | --- |
| `ctx.cache.purge()` スコープ | 呼んだ **entrypoint** のキャッシュのみ。他 Worker・他 entrypoint には届かない | developers.cloudflare.com/workers/cache/purge/ 確定 |
| RPC メソッド内の `ctx.cache` | どの entrypoint にスコープされるか未記載 | **未確認 → spike** |
| キャッシュキーと version | 既定で Worker version を含む。deploy で空になる | workers/cache/configuration/ 確定 |
| RPC メソッドのキャッシュ | `fetch()` 以外は Workers Cache を通らない | prisma report |
| 循環 Service Binding | 公式記載なし。初回は片側の binding なしで deploy するのが安全 | **未確認** |
| RPC で ReadableStream | 可（byte stream のみ、32MiB 制限を回避） | workers/runtime-apis/rpc/ 確定。R2 body が byte stream かは **未確認** |
| `IMAGES.input(stream)` | ReadableStream 可、入力 20MB 上限 | images/transform-images/bindings/ 確定 |
| `next dev`(getPlatformProxy) → 別 `wrangler dev` の named entrypoint | service binding 自体はサポート、entrypoint+RPC は未記載 | **未確認 → spike** |
| Access: 単一パスの Bypass | 別 app（より具体的なパス）に Bypass policy で可。具体パスが優先 | cloudflare-one/.../app-paths/ 確定 |
| Managed OAuth と同一ホストの Bypass app 併用 | 未記載 | **未確認 → stg で検証** |

## 現リポジトリの事実

- 本番・stg とも Workers Cache 有効済み（`wrangler.toml` `[env.*.cache]`）。CMS 書込みで `purgeEverything`（`src/collections/hooks/revalidate/purge-workers-cache.ts`）。
- 公開サイトの Payload アクセスは `src/lib/payload/*` に集約（例外: `/next/preview` の `payload.auth`、`/api/mcp`、`/api/media-upload`、admin コンポーネント）。
- `worker/` は Payload を import しない。`/api/media/file/*` は `WORKER_SELF_REFERENCE` 経由で自己 fetch（`/_next/image`、OG 画像）。
- media URL は相対 `/api/media/file/<filename>`（`serverURL` 未設定）。
- `utils/lexical/to-markdown` は site の `.md` ルート専用（MCP は Payload の `convertLexicalToMarkdown`）。
- `components/rich-text` は `@payloadcms/richtext-lexical/react` の `RichText` を value import（分離後も web が依存）。
- rich text 内の upload/image-row ノードは populate 済み Media を含む（depth: blog/news/profile=2、works=1）。
- contact フォーム・外部 RSS 取得は Payload 非依存。
