# Next.js 16 アップグレード調査 (2026-10-21)

対象: origin/main (PR #53 merge 後) / next 15.3.9 / payload 3.84.1 / @opennextjs/cloudflare 1.18.0 (aws 3.9.16) / wrangler 4.98.0 (installed) / react 19.2.7 / vitest 4.1.8 / node 24 (mise)

## 0. 結論 (TL;DR)

| パッケージ                                | 現在                       | 目標                                     | 根拠                                                                                        |
| ----------------------------------------- | -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `next`                                    | 15.3.9                     | **16.4.2** (latest, 2026-10-15)          | OpenNext 1.20.12 の peer が `>=16.4.1`。16.4.1/16.4.2 = 10/14 security update 追随          |
| `payload` / `@payloadcms/*` (8 pkg)       | 3.84.1                     | **3.91.0** (3.x latest, 2026-10-15)      | peer `next >=16.3.3 <17`。3.90.0 は critical security release                               |
| `@napolab/payload-cloudflare-access` peer | 3.84.1                     | 3.91.0 に追随                            | peer を `payload`/`@payloadcms/ui` 3.84.1 で固定しているため                                |
| `@opennextjs/cloudflare`                  | 1.18.0                     | **1.20.12** (→ `@opennextjs/aws` 4.1.11) | peer `next >=15.5.28 <16 \|\| >=16.4.1`, `wrangler ^4.148.0`                                |
| `wrangler`                                | ^4.78.0 (installed 4.98.0) | **^4.151.3**                             | OpenNext 1.20.12 の peer floor 4.148.0                                                      |
| `react` / `react-dom`                     | 19.2.7                     | 19.2.9 (19.2.x 最新)                     | Payload peer `^19.2.1`。19.3 も semver 上は可だが Payload テンプレは 19.2.6 固定 → 別作業に |
| `@types/react`                            | ^19                        | 19.x latest                              | 公式ガイドの指示                                                                            |
| build script                              | `next build`               | **`next build --webpack`**               | 後述 §1.1 / §2.3 (必須)                                                                     |

- **デプロイ失敗の原因**は `@opennextjs/aws` の `isNextVersionSupported` が「major リリース日 + 2 年」で判定していること (15 = 2024-10-21 → 2026-10-21 で失効)。major 単位なので **15.5.28 に上げても通らない**。16 は 2027-10-21 まで通る。
- 応急処置: 現行 1.18.0 にも `opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion` フラグがある (warn のみで継続)。ただし 15.3 系は 15.3.9 で打ち止め＝10/14 の security fix 未適用なので、あくまで当日しのぎ。
- Payload 3.84.1 の peer も `>=16.2.2 <17` を含むため「Next だけ先に 16」は peer 上は可能。ただし 3.84.1 は 16.3/16.4 リリース前の版で未検証 (3.87.1 で「Next バージョン別 dev HMR endpoint」修正あり)。推奨は Payload 先行 (§5)。

## 1. Next.js 16 の破壊的変更 × このリポジトリ

### 1.1 該当する (要対応)

| 変更                                                                                                                                                                                               | リポジトリの状況                                                                                                       | 対応                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`next build` が Turbopack 既定。`webpack` 設定があると build が失敗**                                                                                                                            | `next.config.ts` に独自 `webpack` (svgr + `applyClientAliases`)。さらに `withPayload` も `webpack` を注入              | `"build": "next build --webpack"`。OpenNext は `pnpm build` を実行する (`buildNextApp.js`: `config.buildCommand ?? \`${packager} build\``) ので script 変更だけで deploy/preview 系にも効く                                                                                                                                                                                                                  |
| **`revalidateTag(tag)` 1 引数形が deprecated → 型エラー**                                                                                                                                          | `src/collections/hooks/revalidate/index.ts` の 3 箇所 (`dispatch` / `dispatchTagsAndPaths` / `revalidateTagsAndPaths`) | **`revalidateTag(tag, { expire: 0 })`**。1 引数形は実行時 `{ expire: 0 }` 相当 (即時失効)。`'max'` にすると SWR (古い HTML を返しつつ裏で再生成) に意味が変わり、`open-next.config.ts` コメントの「CMS 更新が即時反映」前提が崩れる。`ignoreBuildErrors: true` で `next build` は通るが `pnpm typecheck` (husky) で落ちるのでブロッカー。`revalidatePath(path, type?)` は変更なし                            |
| **`eslint` config キー削除**                                                                                                                                                                       | `next.config.ts` に `eslint: { ignoreDuringBuilds: true }`                                                             | 削除 (16.4.2 の `NextConfig` 型に存在しない → typecheck エラー)。`next lint` は scripts に無いので他は影響なし                                                                                                                                                                                                                                                                                               |
| **scroll-behavior を Next が上書きしなくなった**                                                                                                                                                   | `src/themes/global-css.ts` で `html { scroll-behavior: smooth }` (reduced-motion 時以外)                               | ページ遷移でトップへ滑らかスクロールしてしまう。従来挙動を保つなら `src/app/(site)/layout.tsx` の `<html>` に `data-scroll-behavior="smooth"`                                                                                                                                                                                                                                                                |
| `--turbopack` フラグ不要 / dev 出力が `.next/dev`                                                                                                                                                  | `"dev": "next dev --turbopack"`。tsconfig は既に `.next/dev/types/**/*.ts` を include 済み                             | フラグ削除 (任意)。build と dev が別ディレクトリ + lockfile になる                                                                                                                                                                                                                                                                                                                                           |
| `next/image` 既定値: `imageSizes` から 16 削除 / `qualities` 既定 `[75]` / `minimumCacheTTL` 60s→4h / `maximumRedirects` 3 / local IP 禁止 / クエリ付きローカル src は `localPatterns.search` 必須 | `src/components/image` は `quality` prop を使わない (=75)。`formatBlurURL` は `/_next/image?...&q=30\|40` を手組み     | **本番は影響なし**: `worker/app.ts` が `/_next/image` を自前 Hono handler (`worker/handlers/images`, IMAGES binding) で処理しており OpenNext/Next の optimizer を通らない (本番で `q=31` → 200 を実測)。srcset から w=16 候補が消えるだけ。**`next dev`/`next start` では Next 本体の optimizer が `q=30/40` を 400 にする**ので、dev で blur placeholder を保つなら `images.qualities: [30, 40, 75]` を追加 |

### 1.2 確認済み・対応不要

- middleware/proxy: `middleware.ts` / `proxy.ts` なし (Workers 側 Hono middleware は Next 外)。
- async request API: `cookies()/headers()/draftMode()` の同期利用なし。`params`/`searchParams` は Promise 型。Payload 生成の admin page も async 済み。
- `opengraph-image.tsx` 3 本は既に `params: Promise` + `await`。`generateImageMetadata` / `generateSitemaps` なし。
- parallel routes (`@slot`) なし → `default.js` 要件なし。
- `unstable_cache` は 16.4.2 の `next/cache` に残存 (`export { unstable_cache }` を `cache.d.ts` で確認)。`cacheComponents` は有効化しない (公式も「upgrade のために有効化するな」)。
- `experimental.staleTimes` は 16 でも experimental のまま存続 (`{ static: 0, dynamic: 0 }` 維持)。Payload の `staleTimes.dynamic` 非ゼロ警告にも該当しない。
- `serverRuntimeConfig`/`publicRuntimeConfig`/AMP/`devIndicators` 旧オプション/`experimental.dynamicIO`/`ppr` 未使用。
- `next.config.ts` の `process.argv` 判定なし (dev 判定は `NODE_ENV` ゲート＝16 の推奨どおり)。
- Node: Next 16 は >=20.9、Payload 3.91 は >=20.18.1。mise の node 24 で OK。TypeScript >=5.1 OK。
- `turbopack.resolveAlias`/`rules` (svgr) は既にトップレベル (`experimental.turbopack` ではない)。dev は既に Turbopack。
- 16.3 で App Router のレンダリングが Web Streams → Node streams に変更、16.4 は React 19.3 を同梱 (App Router は Next 同梱の React canary を使う)。workerd 側の追随は OpenNext 1.20.x のパッチ群で対応済み (1.20.3/1.20.7 等)。

## 2. Payload CMS (3.84.1 → 3.91.0)

### 2.1 Next 16 対応バージョン

- `@payloadcms/next` の peer が Next 16 を含んだ最初の版は **3.73.0** (`>=16.1.1-canary.35 <16.2.0 || ^16.2.0`)。3.84.1 は `>=16.2.2 <17`、3.85.0–3.89.0 は `>=16.2.6`、**3.90.0 以降は `>=16.3.3 <17.0.0`**。
- 3.x latest = **3.91.0**。4.0 は beta/canary のみ (対象外)。
- `withPayload` は Next ≥16.2.2 で `experimental.turbopackServerFastRefresh: false` を自動付与 (3.84.1 にも実装あり) → dev script に `--no-server-fast-refresh` は不要。

### 2.2 3.84.1 → 3.91.0 の注意点

- **3.90.0 (critical security)**: リリースノート自体が「relational DB は `migrate:create` + `migrate` が必要」と明記。
  - users に `resetPasswordRequestedAt` 追加、upload collection に `_objectKey` 追加 (いずれも列追加 = expand のみ → `.claude/rules/payload-cms.md` の expand/contract 上は安全側)。
  - 手順: `pnpm payload migrate:create payload-3-91` → 生成 SQL を目視 (ADD COLUMN のみか) → `pnpm payload migrate` → `pnpm payload generate:types` → `pnpm payload:generate-importmap`。
  - SVG/XML upload の検証強化: `media.ts` は `mimeTypes: ['image/*', ...]` で SVG を含む。SVG を実際に上げるなら `allowRestrictedFileTypes: true` を検討。
  - multipart upload 既定上限 50MB (`upload.requestSizeLimit`)。動画 (R2 faststart MP4) を Payload multipart で上げているなら要確認 (署名 URL の `/api/media-upload` は Hono 側)。
  - API key は初回以外 read 不可 (`useAPIKey: { reveal: true }` で旧挙動)。users の `auth` 設定を確認。
  - External file fetch に trusted origin 必須 → `serverURL`/`cors`/`csrf` は既に `BASE_URL` 設定済み。
  - **Lexical bump (0.41.0 → 0.50.0)**: 「組み込み機能のみなら変更・データ移行不要」。ただしこのリポジトリはカスタム block/feature (code, image-row, video, table, link-embed, MCP markdown 変換) を多数持つ。直 `lexical` 依存は無く `@payloadcms/richtext-lexical/lexical` 再 export のみ (=公式要件を満たす)。editor HTML の snapshot/selector テスト、MCP round-trip テスト (`toMatchInlineSnapshot`) が落ちる可能性。
- 3.89.0: jobs のアクセス既定値強化 (BREAKING, jobs 未使用なら影響なし)。
- 3.91.0: Node 最小 20.18.1、`@payloadcms/drizzle` sqlite batch insert サイズ修正、seo plugin の生成権限修正。
- 3.87.1: 「Next.js のバージョンごとに正しい dev HMR endpoint へ接続」→ Next 16.3+ の dev には 3.87.1 以降が実質必要。

### 2.3 Turbopack build は使えない → `next build --webpack` 必須

- Payload 公式 `templates/with-cloudflare-d1` (3.x ブランチ, Next 16.3.3 / Payload 3.90.0 / OpenNext 1.20.1) は **`next build --webpack`**。
- 理由 (payload PR #17577): `@payloadcms/db-d1-sqlite` が `drizzle-kit` を通常 dependency に持ち、Turbopack が `drizzle-kit/api` を server bundle に trace → Workers 非対応の Node toolchain が入り build が壊れる。根本 issue **payloadcms/payload#16470 は OPEN**。
- `serverExternalPackages: ['drizzle-kit']` は Turbopack では効かない (直接依存でないパッケージは無視される旨が `withPayload.js` のコメントに明記)。
- 加えて独自 `webpack` 設定があるため Turbopack build はそもそも失敗する。dev (`next dev`) は Turbopack のままで可 (`turbopack.rules` で svgr、`resolveAlias` で linkedom 置換済み)。

## 3. @opennextjs/cloudflare (1.18.0 → 1.20.12)

- peer: `next >=15.5.28 <16 || >=16.4.1`、`wrangler ^4.148.0`、optional `rclone.js`。同梱 `@opennextjs/aws` 4.1.11 (aws 4.0.0 は誤 major で実質 3.10.5 相当、破壊的変更なし)。
- バージョンチェック: aws 4.1.11 でも同ロジック (`NEXT_RELEASE_DATES[16] = "2025-10-21"`) → **Next 16 は 2027-10-21 まで通過**。15.x は全滅。
- 関連 changelog:
  - 1.19.0: `revalidateTag` の SWR 対応。1.19.6: `populateCache` (deploy 時) が D1 tag cache `revalidations` に `stale` / `expire` 列を **ALTER TABLE で自動追加** (既存列ならエラー握りつぶし)。
  - 1.19.4: tag cache key の build id が `NEXT_BUILD_ID` → `OPEN_NEXT_BUILD_ID` (= `nextConfig.deploymentId ?? BUILD_ID`)。`deploymentId` 未設定なので `.next/BUILD_ID` と一致 → `scripts/bust-isr-cache.mjs` の `INSERT INTO revalidations (tag, revalidatedAt)` はそのまま有効 (stale/expire=NULL 行は従来どおり `revalidatedAt > lastModified` で判定)。**将来 `deploymentId` を設定すると bust script が無効化される**点は注意。
  - 1.20.0/1.20.1: R2 cache bucket provisioning / skew protection API の圧縮応答切り詰め修正 → memory にある「node 24 で deploy:staging の R2 チェックが落ちる」問題が解消している可能性 (要実測)。
  - 1.20.3: `proxy.ts` (Node middleware) 対応、Next 16.3 の Turbopack wasm helper patch。1.20.7: Next 16.3 の `loadCustomCacheHandlers` 書き換えに追随。1.20.9: Cache Components の cross-request I/O 修正。1.20.12: Next 16.4 対応。
- Cloudflare 固有の注意:
  - Turbopack build は OpenNext 的には対応済みだが、本リポジトリは §2.3 により webpack 固定。
  - `worker/worker.ts` が `../.open-next/worker.js` から `default` と `DOQueueHandler` を import/re-export するカスタム worker 構成 → **確認済み**: 1.20.12 の `templates/worker.js` も `DOQueueHandler` を export し、`compileDurableObjects` の出力先 (`.build/durable-objects`) も 1.18.0 と同じ (差分は define が `__OPEN_NEXT_BUILD_ID` になった点のみ)。wrangler.toml の DO binding (`DOQueueHandler` / `CursorRoom`) はそのままで良い。
  - `compatibility_date = "2025-08-15"`: 1.20.12 の build は 6 か月より古いと **warn のみ** (失敗しない)。必須の引き上げは無し。上げる場合は Workers ランタイム挙動が変わるので別 PR で。
  - `defineCloudflareConfig` の import 元: 1.20.12 の `exports` は `"."` と `"./*"`。テンプレは `@opennextjs/cloudflare/config` だが root import も引き続き解決可能。
  - 公式 docs トップ (opennext.js.org/cloudflare) の「Node Middleware 未対応」記述は古い (changelog 1.20.3 で対応)。本リポジトリは middleware 無しなので無関係。

## 4. vitest / Panda CSS / react-aria

- **vitest**: browser project は `next/image` `next/headers` `next/navigation` `next/cache` `@payloadcms/ui` を `src/__mocks__` に alias しているので Next 16 の実装変更は基本届かない。リスクは Lexical 0.50 で `@payloadcms/richtext-lexical/react` の依存グラフが変わり、Vite の mid-run reload (memory: CI clean-env gotchas) が再発すること → `optimizeDeps.include` の見直しが必要になり得る。`@cloudflare/vitest-pool-workers` ^0.13.5 は latest 0.23.0 (peer vitest ^4.1.0, installed vitest 4.1.8 で満たす)。wrangler を上げるなら同時に上げて揃えるのが安全。
- **Panda CSS**: PostCSS プラグイン経由で Next 非依存。build は webpack のまま、dev は既に Turbopack で動いているので新規リスクは小。`panda codegen` は `prepare` で実行。
- **react-aria-components**: peer `react ^16.8 || ... || ^19` で問題なし。`RouterProvider` は `next/navigation` の `useRouter` を使うだけ。Next 16 のルーティング刷新 (layout dedupe / incremental prefetch / 16.3 prefetch inlining) で prefetch リクエスト数が変わる程度。

## 5. 推奨アップグレード手順

`.claude/rules/git-workflow.md` に従い最新 main から branch。CLAUDE.md に従い小タスク分割 + difit review、commit は本人承認後。

### Step 0 (任意・当日しのぎ): デプロイ unblock

- `deploy:staging` / `deploy:production` / `preview` の `opennextjs-cloudflare build` に `--dangerouslyUseUnsupportedNextVersion` を付ける。Step 2 で必ず外す。

### Step 1 (PR-A): Payload 3.91.0 (Next 15.3.9 のまま)

Payload 3.91.0 の peer は `>=15.3.9 <15.4.0` を含むので、DB migration を Next 移行から切り離せる (revert 時に migrate:down と framework 差し戻しが絡まない)。

```bash
pnpm add payload@3.91.0 @payloadcms/next@3.91.0 @payloadcms/db-d1-sqlite@3.91.0 \
  @payloadcms/live-preview-react@3.91.0 @payloadcms/plugin-seo@3.91.0 \
  @payloadcms/richtext-lexical@3.91.0 @payloadcms/storage-r2@3.91.0 @payloadcms/translations@3.91.0
# packages/payload-cloudflare-access の peer (payload / @payloadcms/ui) を 3.91.0 へ
pnpm payload migrate:create payload-3-91   # 生成 SQL が ADD COLUMN のみか確認
pnpm payload migrate
pnpm payload generate:types
pnpm payload:generate-importmap
pnpm lint && pnpm typecheck && pnpm test
```

- stg: `deploy:database:check:staging` → `deploy:database:staging` → `deploy:staging` (Step 0 のフラグ要)。admin ログイン (Cloudflare Access 経路含む)・記事編集・画像 upload・MCP `get_post`/`update_post` round-trip を確認。

### Step 2 (PR-B): Next 16.4.2 + OpenNext 1.20.12 + wrangler

```bash
pnpm dlx @next/codemod@canary upgrade latest   # 2026-10-21 時点で latest = 16.4.2。実行後 diff を必ず精査 (下記を手で直す箇所が多い)
pnpm add next@16.4.2 react@19.2.9 react-dom@19.2.9 @opennextjs/cloudflare@1.20.12
pnpm add -D wrangler@^4.151.3 @types/react@latest @types/react-dom@latest
pnpm cf:types   # wrangler 更新後に CloudflareEnv 型を再生成 (memory: dev-vars-cf-types-regen)
```

手修正:

1. `package.json`: `"build": "next build --webpack"`、`"dev": "next dev"` (任意)、Step 0 のフラグを削除。
2. `next.config.ts`: `eslint` キー削除。dev parity のため `images.qualities: [30, 40, 75]` 追加 (任意)。
3. `src/collections/hooks/revalidate/index.ts`: `revalidateTag(tag, { expire: 0 })` ×3。`src/__mocks__/next/cache.ts` は vi.fn なので変更不要。
4. `src/app/(site)/layout.tsx`: `<html data-scroll-behavior="smooth">` (遷移時の即時トップ移動を維持する場合)。
5. codemod が `revalidateTag(tag, 'max')` を入れた場合は `{ expire: 0 }` に戻す。

検証:

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm build                                       # next build --webpack が通るか
CLOUDFLARE_ENV=staging pnpm exec opennextjs-cloudflare build --env staging   # バージョンチェック通過・bundle 生成
pnpm preview                                     # wrangler local preview (WS 502 は既知 miniflare バグ)
```

- stg deploy 後: ISR (home/list/detail) 表示、admin で publish → 即時反映 (D1 tag cache の `stale/expire` 列追加後も即時失効するか)、`bust-isr-cache.mjs` 後に一覧が埋まるか、`/_next/image` (blur 含む)、OG 画像 3 ルート、`.md` rewrites、`/logs` redirect、RSS/sitemap/llms.txt、MCP (`/mcp` OAuth)、Durable Objects (cursor presence WS)、Workers Cache HIT/ETag/圧縮 (PR#37/#45/#46 の挙動)、`next dev` で admin HMR。
- prod は stg で 1 日程度様子を見てから。deploy 直後の cold 524 対策 (`warm-cache.mjs`) も併せて確認。

### 代替案: Next 先行

Payload 3.84.1 の peer (`>=16.2.2 <17`) で Next 16.4.2 + OpenNext 1.20.12 を先に入れることも peer 上は可能。ただし 3.84.1 は Next 16.3/16.4 より前のリリースで、dev HMR 修正 (3.87.1) も未適用。Payload 3.90.0 の security fix も遅れるため非推奨。

## 6. リスク一覧

| #   | リスク                                                                              | 影響                                                         | 検証方法                                                                                                                 |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| R1  | Turbopack build で drizzle-kit が bundle され Workers で壊れる (payload#16470 OPEN) | build/実行時エラー                                           | `--webpack` 固定。`.open-next` bundle に `drizzle-kit/api` が入っていないか grep (memory: bundler-export-condition-trap) |
| R2  | `revalidateTag` の第 2 引数を `'max'` にして SWR 化                                 | CMS 更新が 1 回古いまま表示される                            | stg で publish 直後に詳細/一覧を 1 回目アクセスで新内容が出るか                                                          |
| R3  | D1 tag cache スキーマ変更 (`stale`/`expire` 列) と bust script                      | ISR 空スナップショットが残る                                 | deploy 後 `wrangler d1 execute napochaan-cache-staging --command "PRAGMA table_info(revalidations)"`、bust 後に一覧表示  |
| R4  | Payload 3.90 migration (users/media 列追加)                                         | admin/upload が D1_ERROR                                     | `migrate:create` の SQL 目視、`migrate:check-drift`、stg で upload                                                       |
| R5  | Lexical 0.41 → 0.50                                                                 | カスタム block/MCP 変換/snapshot テスト破損、editor 挙動変化 | `pnpm test` 全緑、admin で code/table/image-row/video/link-embed を編集・保存、MCP round-trip                            |
| R6  | Vite mid-run reload (依存グラフ変化)                                                | CI browser test フレーク                                     | clean checkout で `pnpm test`、`DEBUG=vite:deps` で `optimizeDeps.include` 追随                                          |
| R7  | scroll-behavior 上書き廃止                                                          | 遷移時スクロールの見た目変化                                 | `data-scroll-behavior` 有無で遷移を目視                                                                                  |
| R8  | 16.3 Node streams / 16.4 React 19.3 同梱 × workerd                                  | SSR/RSC ランタイムエラー                                     | stg で全ルート 200 + admin。OpenNext 1.20.12 必須 (peer が強制)                                                          |
| R9  | ルーティング刷新で prefetch リクエスト数増 + `staleTimes: 0`                        | Workers リクエスト数/課金・Workers Cache 挙動                | stg で Network タブ、Workers analytics                                                                                   |
| R10 | wrangler 4.98 → 4.151 / vitest-pool-workers                                         | `cf:types` 差分、worker テスト失敗                           | `pnpm cf:types` 後 typecheck、worker 系 test                                                                             |
| R11 | `@napolab/payload-cloudflare-access` の peer 固定                                   | pnpm peer 警告/重複 `@payloadcms/ui`                         | peer を 3.91.0 へ、`pnpm why @payloadcms/ui` で単一化                                                                    |
| R12 | SVG upload 検証強化 / multipart 50MB                                                | 既存運用の upload 失敗                                       | SVG・大きい動画を stg で upload                                                                                          |

## Sources

- Next.js 16 upgrade guide: https://nextjs.org/docs/app/guides/upgrading/version-16
- Next.js 16 release: https://nextjs.org/blog/next-16
- Next.js 16.3: https://nextjs.org/blog/next-16-3
- Next.js 16.4: https://nextjs.org/blog/next-16-4
- Next.js security update 2026-10-14: https://nextjs.org/blog/nextjs-security-update-october-14-2026
- revalidateTag API: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
- staleTimes: https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes
- Next.js support policy: https://nextjs.org/support-policy
- next@16.4.2 types: https://unpkg.com/next@16.4.2/cache.d.ts , https://unpkg.com/next@16.4.2/dist/server/web/spec-extension/revalidate.d.ts , https://unpkg.com/next@16.4.2/dist/server/config-shared.d.ts
- Payload releases: https://github.com/payloadcms/payload/releases/tag/v3.90.0 , https://github.com/payloadcms/payload/releases/tag/v3.91.0 , https://github.com/payloadcms/payload/releases/tag/v3.89.0 , https://github.com/payloadcms/payload/releases/tag/v3.87.1
- Payload Lexical bump: https://github.com/payloadcms/payload/pull/18148
- Payload installation (supported Next versions): https://payloadcms.com/docs/getting-started/installation
- Payload with-cloudflare-d1 template (3.x): https://github.com/payloadcms/payload/tree/3.x/templates/with-cloudflare-d1
- Payload PR #17577 (template `--webpack`): https://github.com/payloadcms/payload/pull/17577
- Payload issue #16470 (drizzle-kit in OpenNext output): https://github.com/payloadcms/payload/issues/16470
- OpenNext Cloudflare CHANGELOG: https://github.com/opennextjs/opennextjs-cloudflare/blob/main/packages/cloudflare/CHANGELOG.md
- OpenNext Cloudflare docs: https://opennext.js.org/cloudflare
- @opennextjs/aws v4.0.0 / v4.1.11: https://github.com/opennextjs/opennextjs-aws/releases/tag/v4.0.0 , https://github.com/opennextjs/opennextjs-aws/releases/tag/v4.1.11
- npm registry (peer/dist-tags を `npm view` で取得): https://www.npmjs.com/package/next , https://www.npmjs.com/package/@payloadcms/next , https://www.npmjs.com/package/@opennextjs/cloudflare , https://www.npmjs.com/package/wrangler
- ローカル確認: `node_modules/.pnpm/@opennextjs+aws@3.9.16*/.../dist/build/helper.js` (`isNextVersionSupported`)、`@opennextjs/cloudflare@1.20.12` tarball (`d1-next-tag-cache.js`, `populate-cache.js`, `compile-images.js`)、`@payloadcms/next@3.91.0` tarball (`withPayload.js`)、本番 `https://napochaan.com/_next/image?...&q=31` → 200
