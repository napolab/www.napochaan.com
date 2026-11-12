# CMS 分離: cms.napochaan.com と表示専用 www（Astro 移行の第一歩）

- 日付: 2026-11-12
- 状態: レビュー待ち（未承認・未 commit）
- 根拠調査: `reports/2026-11-12-cms-split-research.md`
- 参考実装: `autonomy-inc/www.prisma.com`（`apps/cms` / `apps/web` / RPC 契約）

## 1. 意図と理由

公開サイト（napochaan.com）から Payload CMS を切り離し、CMS を `cms.napochaan.com` の独立 Worker に移す。

- **公開サイトから Access で守るパスをなくしたい。** 今は www に `/admin*` と `/mcp` の Access path app があり、AUD を 2 つ持ち、path-policy / mcp-guard などで多層防御している。CMS をホストごと Access の内側に出せば、www は完全公開の表示専用 Worker になる。
- **Astro 移行の地ならし。** www が Payload に依存せず、型付き RPC 契約だけでデータを受け取る形にしておけば、次の段階で `apps/web` の中身を Astro に差し替えるだけで済む。
- **ISR をやめて SSR + Workers Cache に寄せる。** Astro には ISR がないため、Next 固有のキャッシュ機構（OpenNext incremental cache / tag cache / `revalidateTag`）を今のうちに外す。

## 2. ゴール

1. pnpm workspaces の monorepo: `apps/cms`（Payload + OpenNext）と `apps/web`（Next.js + OpenNext、表示専用）。
2. `cms.napochaan.com`（本番）/ `cms-stg.napochaan.com`（stg）をホスト全体で Cloudflare Access の内側に置く。admin・Payload REST・MCP はここ。
3. 本番 www（`napochaan.com`）は Access 保護パスを一切持たない。stg www（`stg.napochaan.com`）は今どおりホスト全体を Access の内側に置く（ユーザー決定）。path 単位の Access app や admin/mcp 用 AUD はどちらからも消す。
4. www → cms のデータ取得はすべて Service Binding の JS RPC。cms を HTTP fetch しない。
5. 画像の元データも RPC で受け取り、www 自身のパスで配信する（ブラウザが cms に画像を取りに行かない）。
6. www は SSR + Workers Cache。CMS 書込みで cms → www の RPC により www のキャッシュを全消しする。
7. MCP は cms に移す。

## 3. 非ゴール

- `apps/web` の Astro 化（次の段階）。今回 web は Next.js のまま。
- 画像最適化 Worker の分離（prisma の `apps/media` 相当）。今回は www の既存 `/_next/image` ハンドラ + `IMAGES` binding を使い続ける。
- キャッシュの細粒度パージ（Cache-Tag / pathPrefixes）。全消しのまま。
- コンテンツモデル（collections / blocks）の変更。
- 見た目・UI の変更。

## 4. アンチゴール（動いても失敗とみなすもの）

- 公開ページの URL や画像 URL が変わり、既存リンク・RSS・外部埋め込みが壊れる。
- www に Access 保護パス、あるいは Payload の value import が残る（`@payloadcms/richtext-lexical/react` と型 import を除く。§7.3）。
- CMS 書込み後、www のページが古いまま残り続ける（パージが届かない）。
- 本番の D1 / R2 データの欠損・複製。

## 5. 構成

```
                          Cloudflare Access（ホスト全体）
                         ┌──────────────────────────────────────────┐
 ブラウザ(自分) ────────▶ │ cms.napochaan.com / cms-stg.napochaan.com │
 Claude(MCP)   ────────▶ │  apps/cms: Payload admin, REST, /mcp      │
                         │  bindings: D1, R2, WEB(→ www)             │
                         └──────────────────────────────────────────┘
                             ▲ RPC (env.CMS)        │ RPC (env.WEB.purge)
                             │                      ▼
 閲覧者 ─────────────────▶  napochaan.com / stg.napochaan.com（Access なし）
                            apps/web: Next.js SSR + Workers Cache
                            bindings: CMS(→ cms), IMAGES, ASSETS, CURSOR_ROOM

 例外: cms の /api/media-upload のみ Access Bypass（HMAC 署名で認可）
```

### 5.1 Worker 名と環境

| | 本番 | stg |
| --- | --- | --- |
| web | 既存 `napochaan-website-production`（名前維持） | 既存 `napochaan-website-staging`（名前維持） |
| cms | 新規 `napochaan-cms-production` | 新規 `napochaan-cms-staging` |
| ホスト | web `napochaan.com` / cms `cms.napochaan.com` | web `stg.napochaan.com` / cms `cms-stg.napochaan.com` |
| D1 / R2 | 既存 `napochaan-cms-production` を cms に付け替え | 既存 `napochaan-cms-staging` を cms に付け替え |

- web が既存 Worker 名を引き継ぐのは、`CursorRoom` DO の状態とカスタムドメインを維持するため（私の判断）。
- D1 / R2 は新規作成せず付け替えるだけ。データ移行なし（私の判断）。
- 設定ファイルは参考実装に合わせて各 app の `wrangler.jsonc`（形式は builder に任せる）。

## 6. RPC 契約

### 6.1 方式（Hono RPC。ユーザー決定 2026-11-12）

- request-invite-system の `shared/callable` 方式を採る。shared パッケージ `@napochaan/cms-api` に `createApp(services: CMSServices)`（Hono のルート定義 + zod 検証）とサービス interface・DTO 型を置き、`export type CMSAppType = ReturnType<typeof createApp>`。shared は実装（Payload / Cloudflare）を持たない。
- cms は Payload でサービスを実装して注入し、named entrypoint `CMS` の `fetch` で `createApp(services).fetch(request)` を返す（default fetch は admin の OpenNext）。
- web は `hc<CMSAppType>(dummyOrigin, { fetch: env.CMS.fetch.bind(env.CMS) })` で呼ぶ。Service Binding の fetch なので公開経路は増えない。
- 応答は DTO。Lexical の editor state は `JSON.stringify` した string（深い再帰型の推論を避ける）。
- RPC 内の Payload 利用は OpenNext の `runWithCloudflareRequestContext` で包む（参考実装 `local-payload.ts`）。
- cms → web の purge は JS RPC のまま（§6.3）。web の default fetch は公開入口なので Hono ルートにしない。

### 6.2 ルート（現 `src/lib/payload/*` を 1:1 で移す）

| ルート | 現関数 | 備考 |
| --- | --- | --- |
| `GET /blog`, `/blog/:slug` | `findBlogList`, `findBlogBySlug` | `index` 序数は cms 側でソート順どおりに付与 |
| `GET /news`, `/news?limit=`, `/news/:slug` | `findNewsList` ほか | pinned 優先ソート維持。`limit` 省略で全件、指定で最新 N 件（`/news/:slug` がすべての slug を扱えるよう `/latest` セグメントは持たない） |
| `GET /works`, `/works/:slug` | `findWorksList` ほか | depth 1、`no` 序数 |
| `GET /gallery`, `/logs`, `/profile` | `findGalleryList` ほか | |
| `GET /drafts/{blog,news,works}/:id`, `/drafts/gallery`, `/drafts/logs` | `find*Draft*` | ヘッダ `x-preview-secret` 必須、不一致 403 |
| `GET /media/:filename` | （新規） | R2 元画像をストリーム応答 |

- DTO は現在のドメイン型（`Post` / `NewsItem` / `WorkRow` / `GalleryPhoto` / `LogManualItem` / `Profile`）と同形で、`body` 等を string 化したもの。
- 投影の depth は現行と同じにする（blog/news/profile=2、works/gallery=1）。

### 6.3 web 側の entrypoint（cms → web）

- web は `purge()` RPC を公開し、`ctx.cache.purge({ purgeEverything: true })` を実行する。
- **注意**: purge は呼び出した entrypoint のキャッシュしか消さない。ページは web の default entrypoint（OpenNext の fetch）でキャッシュされるため、`purge()` も default entrypoint 上で呼ばれる必要がある。
  - 第一案: web の default export を `WorkerEntrypoint` クラスにして、`fetch()` は OpenNext に委譲し、同じクラスに `purge()` を置く。cms は `entrypoint` を指定せずに binding する。
  - この挙動は公式ドキュメントに明記がないので、**最初の spike で確認する**（§11）。
  - **spike で成り立たない場合のフォールバック（ユーザー決定）**: 反映遅延は 1 分程度まで許容。purge をやめ、CMS 由来ページを短い TTL（60 秒前後）+ `stale-while-revalidate` にする（参考実装と同じ）。
- cms 側の Payload フック（現 `src/collections/hooks/revalidate`）は `revalidateTag` / `revalidatePath` / `purgeWorkersCache` をやめ、`env.WEB.purge()` を `ctx.waitUntil` で best-effort で呼ぶだけにする。

## 7. www（apps/web）の変更

### 7.1 キャッシュ

- OpenNext の ISR 部品を外す: `NEXT_INC_CACHE_R2_BUCKET`、`NEXT_TAG_CACHE_D1`、`NEXT_CACHE_DO_QUEUE`(`DOQueueHandler`)、`WORKER_SELF_REFERENCE`、`unstable_cache`、`revalidateTag/Path`、`scripts/bust-isr-cache.mjs`、`.claude/rules/isr-revalidation.md`（置き換え）。
  - `DOQueueHandler` の削除には `deleted_classes` migration が要る。
  - 不要になった R2 / D1（`napochaan-cache-*`）の削除は別作業（今回は unbind のみ）。
- 全ページ SSR。Workers Cache の保持は `Cache-Control` で制御する:

| ページ種別 | 方針 |
| --- | --- |
| CMS のみ由来のページ・RSS・`.md`・llms・sitemap | 長めの `max-age` + `stale-while-revalidate`。鮮度は purge で担保 |
| home・log（外部 RSS / 現在時刻依存） | 短い `max-age`（現行の revalidate 秒数相当）+ SWR |
| preview・`/next/*` | `no-store` |
| `/_next/image`・`/api/media/file/*` | 現行ポリシー維持 |

- 具体的な秒数は builder 判断。`s-maxage` / `must-revalidate` は SWR を殺すので使わない（参考実装の知見）。

### 7.2 画像

- media URL は今と同じ相対 `/api/media/file/<filename>` のまま（公開 URL は変えない）。
- www に `/api/media/file/:filename` ルートを残し、中身を `env.CMS.mediaFile()` のストリームを返す実装に差し替える。
- `/_next/image` ハンドラと OG 画像ローダーは、`WORKER_SELF_REFERENCE` 経由の自己 fetch をやめ、`env.CMS.mediaFile()` から直接ストリームを受けて `IMAGES` / data URL 化する。
- `Image` コンポーネント・`formatBlurURL`・`.claude/rules/images.md` の運用はそのまま。
- `api/media/file` 以外の `/api/*`（REST・GraphQL）は www から消える。

### 7.3 Payload 依存の扱い

- www に残してよいもの: `@payloadcms/richtext-lexical/react`（`RichText` 描画）と、`@payloadcms/richtext-lexical/lexical` などの型 import。
- runtime value import として許すもの: 上記に加え `@payloadcms/live-preview-react`（postMessage を受けるだけの小さなクライアント部品。私の判断）。
- `@payloadcms/richtext-lexical` が peer dependency として `payload` などを要求する場合は、依存として入れておくのは許す。ただし web のコードから value import はしない（私の判断。builder が実際の peer 要件を確認する）。
- 取り除くもの（value import と、peer 要件がなければ依存も）: `payload`、`@payloadcms/next`、`@payloadcms/db-d1-sqlite`、`@payloadcms/storage-r2`、`@payloadcms/plugin-seo`、`withPayload`、`(payload)` ルートグループ、`components/admin/*`（cms へ移す）。
- `utils/lexical/to-markdown`・`extract-plain-text` は Payload 非依存なので web に置いたままでよい。両 app から使う共有コードが出てきたら `packages/*` に切り出す（builder 判断）。

### 7.4 プレビュー

- cms の admin の Live Preview は www の `/next/preview?path=…&previewSecret=…` を開く（URL は cms の `BASE_URL` 相当の var で www のオリジンを指す）。
- admin のセッション cookie は別ホストの www には届かないため、`payload.auth` による確認は廃止し、**`previewSecret` のみで認可**する（参考実装と同じ。私の判断）。
- 下書きページは `env.CMS.*Draft({ previewSecret })` で読む。draft mode cookie の運用は今のまま。
- `LivePreviewListener`（`RefreshRouteOnSave`）の `serverURL` を cms のオリジンにする。
- www の frame ヘッダ（path-policy の `admin-frame` 系）は「cms のオリジンからの iframe を preview パスで許可」に置き換える。admin 関連のプラグインは削除。

### 7.5 www から消えるもの

`/admin*`、`/api/*`（`/api/media/file/*` を除く）、`/mcp`・`/api/mcp`・OAuth metadata ルート・`mcp-guard`、`/api/media-upload`、Cloudflare Access 関連の var（`CF_ACCESS_*`）とコード、`@napolab/*cloudflare-access*` 依存。

### 7.6 www に残るもの

公開ページ一式、RSS / `.md` / llms / sitemap / OG 画像（データは RPC 経由）、contact フォーム（Turnstile・メール・Discord）、`CursorRoom` DO と `/cursors`、`/_next/image`。

## 8. cms（apps/cms）

- 現リポジトリの Payload 部分をそのまま移す: `payload.config.ts`、`collections`、`globals`、`blocks`、`migrations/`、seed bin（`seed`、`seed:export`、`seed:import` など）、`migrate-drift`、`(payload)` ルート、`components/admin/*`、`lib/mcp`、`api/media-upload`、`@napolab/payload-cloudflare-access`。
- admin パスは host の root（`/`、`routes.admin = '/'`）。当初は `/admin` のままの予定だったが、cms ホストは admin 専用なので root 直下に変更した（ユーザー判断、2026-11-13）。
- MCP は `cms.napochaan.com/mcp`。Access はホスト全体の app 1 つに Managed OAuth を有効にする（stg の現構成と同じ。AUD は 1 つ）。
- `/api/media-upload` だけ、より具体的なパスの別 Access app に Bypass policy を付ける。認可は今の HMAC 署名のみ。`create_upload_url` が発行する URL のホストは cms に変わる。
- `RPC: CMS` entrypoint（§6）と `WEB` binding（§6.3）を持つ。
- `.claude/rules/payload-cms.md`、`docs/migration-rollback.md`、`staging-deploy-seed` skill、`CLAUDE.md` の「opennext では ISR を利用すること」（→ SSR + Workers Cache。CLAUDE.md の変更はユーザーの確認を取ってから）、`.github/workflows/deploy.yml` のパスとコマンドを cms 用に更新する。

## 9. デプロイと切り替え

- deploy 順は cms → web（binding 先を先に）。循環 binding（cms→web, web→cms）は公式ドキュメントに記載がないため、初回は cms を `WEB` binding なしで deploy → web を deploy → cms を `WEB` 付きで再 deploy、を想定する（spike で確認）。
- 移行はまず stg で行い、検証してから本番に進む。
- 切り替え期間は、旧 www（Payload 入り）と新 cms が同じ D1 / R2 を指す。旧 www の deploy は新 web に置き換わるまで止める。admin での編集は切り替え中は控える。
- 移行時の migrations の drift check（`payload migrate:check-drift`）は cms 側で継続する。

### 9.1 手作業（Cloudflare ダッシュボード / wrangler）チェックリスト

1. Access app: `cms-stg.napochaan.com`（ホスト全体、Managed OAuth ON、自分のみ）と `cms-stg.napochaan.com/api/media-upload`（Bypass）を作る。本番も同様に作る。
2. cms Worker の secret を設定する: `PAYLOAD_SECRET`、`PREVIEW_SECRET`、MCP 用の署名鍵など（現 www の secret 一覧から cms に必要なものを移す）。
3. www の旧 Access app（`napochaan.com/admin*`、`napochaan.com/mcp`）を削除する。stg www のホスト全体 Access app（`stg.napochaan.com`）は残すが、MCP 用 Managed OAuth は不要になる。www の不要な secret を消す。
4. Claude の MCP コネクタ（napochaan / napochaanstg）の URL を cms ホストに付け替えて再登録する。
5. 不要になった `napochaan-cache-*` の R2 / D1 は、安定稼働を確認してから削除する（別作業）。

## 10. テスト方針

- vitest TDD。RPC の projection（Payload doc → DTO）は純関数として単体テストする（現在の `to-blog-post` などを流用）。
- 契約と実装の同期は型（`implements`）で担保する。Collection 一覧などリテラルを複製する箇所は `.claude/rules/cross-module-sync-test.md` に従ってテストで固定する。
- web 側は `env.CMS` をフェイク実装に差し替えてページ・ルートをテストする。
- stg www は Access の内側なので、stg での確認は Access ログイン済みのブラウザで行う（cms-stg の admin プレビュー iframe も同じ）。
- stg で次を確認する: 全ページの表示、画像（`/_next/image`、OG、RSS enclosure、`.md` の画像 URL）、preview、admin での更新 → www に反映（purge）、MCP の読み書きと `create_upload_url` によるアップロード。

## 11. 最初の spike（計画の前提を確かめる）

計画の前に、使い捨ての検証で次を確認する:

1. web の default entrypoint を `WorkerEntrypoint` クラスにして OpenNext の fetch に委譲し、そこに置いた `purge()` RPC が、その entrypoint でキャッシュしたレスポンスを消せるか。
2. cms ↔ web の循環 Service Binding が deploy できるか、およびその順序。
3. R2 の `body` を RPC の戻り値として受け取り、そのまま `IMAGES.input()` に渡せるか（byte stream かどうか）。
4. `next dev`（getPlatformProxy）から、別プロセスの `wrangler dev`（cms）の named entrypoint を RPC で呼べるか。呼べない場合のローカル開発手順（例: web も `opennextjs-cloudflare preview` で動かす）。dev registry のパスは worktree ごとに固定する。
5. ホスト全体の Access app（Managed OAuth）と、パス単位の Bypass app を同じホストで併用できるか（stg で確認）。

spike の結果、方式が成り立たない項目があれば設計を見直してから計画に進む。

## 12. builder に任せること

- monorepo のディレクトリ詳細、`packages/*` に切り出す範囲、契約ファイルの置き場所。
- `wrangler.toml` と `wrangler.jsonc` のどちらを使うか、vars の命名。
- `Cache-Control` の具体的な秒数。
- タスクの分割と順序（ただし stg を先に通し、小さなタスクごとに difit でレビュー依頼すること）。

## 13. 私（Claude）の判断として入れたもの

- web が既存 Worker 名を引き継ぐこと（DO 状態とドメインを維持するため）。
- D1 / R2 は付け替えのみで、データ移行はしないこと。
- パージは全消しのまま。
- 画像の公開 URL `/api/media/file/*` を www で維持すること。
- web に `@payloadcms/live-preview-react` の value import と、richtext-lexical の peer 依存を残すのを許すこと。
- プレビューの認可を `previewSecret` のみにすること（`payload.auth` を廃止）。
- admin パスは host の root（`/`）。
- Access は cms ホストごとに 1 つの app（stg と本番で同じ構成）。
