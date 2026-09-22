# 表示速度チューニング設計 — 2026-09-22

計測根拠: `reports/2026-09-22-production-perf-audit.md`(本番 `/` の DevTools trace / 転送量 / ヘッダ)。

## 0. 決定事項(ステークホルダー確認済み)

| 論点                                   | 決定                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| フレームワーク                         | **Next.js 維持**(Astro 化しない)。Payload admin・ISR tag 無効化・next/og・Live Preview の等価物が無く、計測上の無駄はどれもフレームワーク起因ではない |
| boot overlay の 1 秒床                 | **再訪時だけスキップ**(初回は 1 秒維持)                                                                                                               |
| Ryo Gothic PlusN(1.93 MB、home 未使用) | **Typekit kit を分割**し、PageHeader を持つページだけ読む                                                                                             |
| M PLUS 1 の JP subset(630 KB)          | **意図通り維持**(触らない)                                                                                                                            |
| Workers Cache                          | **導入する**。purge は CMS 書き込みごとに `purgeEverything`。**staging で検証してから production**                                                    |
| 実装順                                 | 1 画像 → 2 linkedom → 5 gsap/cursor 遅延 → 4 boot 再訪 → 3 kit 分割(kit ID 待ち)→ 6 Workers Cache                                                     |

## 1. 目標

本番 home、モバイル Slow 4G / CPU 4x、コールドロード。

| 指標           | 現状        | 目標                                                              |
| -------------- | ----------- | ----------------------------------------------------------------- |
| 転送量合計     | 3.52 MB     | **< 1.2 MB**(Ryo Gothic −1.93 MB、画像 −0.33 MB、JS −0.1 MB 転送) |
| 初回 LCP       | 0.9〜1.3 s  | 維持(1 秒床は演出)                                                |
| 再訪 LCP       | 0.9〜1.3 s  | **< 0.5 s**                                                       |
| HTML TTFB(HIT) | 100〜200 ms | **< 60 ms**(Workers Cache、Worker 非起動)                         |
| CLS            | 0.00〜0.01  | 維持                                                              |

計測は各タスク完了時に Chrome DevTools MCP の trace(同条件)で before/after を `reports/` に追記する。

## 2. タスク 1: 画像 `sizes`

**問題**: `next/image` に `width/height` だけ渡し `sizes` が無いため `sizes=100vw` 扱いになり、38×38 px 表示の works サムネで `w=3840` を要求している(3 枚で 342 KB)。

**変更**:

- 12 箇所の `Image` 呼び出しに実寸ベースの `sizes` を付ける。各サイトの CSS 幅(例: works-section `thumb` = 40px 固定 → `sizes="40px"`)から導出する。既に `sizes` があるのは gallery-archive のみ。
  - `src/app/(site)/_components/works-section/index.tsx`
  - `src/app/(site)/works/_components/works-archive/index.tsx`
  - `src/app/(site)/works/[slug]/_components/related-works/index.tsx`
  - `src/app/(site)/works/[slug]/_components/work-detail/index.tsx`
  - `src/app/(site)/blog/[slug]/_components/blog-hero/index.tsx`
  - `src/components/figure/index.tsx`
  - `src/components/gallery/index.tsx`
  - `src/components/gallery/lightbox/index.tsx`
  - `src/components/ambient-backdrop/index.tsx`
  - `src/components/rich-text/converters/upload/index.tsx`
  - `src/components/rich-text/converters/image-row/index.tsx`
- `next.config.ts` に `images.deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048]`(3840 を外す)。`imageSizes` は既定のまま(blur の `w=32` を含む)。
- `worker/handlers/images` は任意の `w` を受けるので変更不要。

**検証**: 本番相当ビルドの HTML で各 `<img>` の `srcset`/`sizes` を確認し、home の画像転送 342 KB → 数十 KB を trace で確認。

## 3. タスク 2: linkedom 排除

**問題**: `budoux/module/html_processor.js` → `dom.js` が無条件に `import { DOMParser } from 'linkedom'`。`TypewriterText`('use client')→ `PhrasedText` → `@utils/phrase` → `budoux` の経路でクライアント chunk 2820(225 KB decoded、cssom 含む)に同梱される。`phrase()` は `parser.parse(text)` のみで DOM を使わない。

**変更**: `next.config.ts` でクライアントバンドルの `linkedom` を空モジュールに解決する。

- `src/shims/empty-module.ts`(`export {}` のみ)を追加。
- webpack: `if (!isServer) config.resolve.alias.linkedom = false`
- turbopack: `turbopack.resolveAlias` に `{ linkedom: { browser: './src/shims/empty-module.ts' } }`(server 側は既定解決のまま。OG の `clamp-title` は server でのみ budoux を使う)

**検証**: `pnpm build` 後 `.next/static/chunks` を `grep -l "before-selector"`(cssom の状態機械名)して 0 件。`PhrasedText` の既存テストが緑のまま。

## 4. タスク 5: gsap / cursor の遅延読み込み

**問題**: 初期 JS 424 KB(transfer)のうち gsap+plugins 127 KB(decoded)、hono/client+zod+reconnecting-websocket 100 KB(decoded)が `SiteShell` 経由で全ページの初期 chunk graph に入る。

**変更**:

- `EchoText` / `ScrambleText` / `TypographyBand`: 静的 `import gsap` を effect 内の `await import('gsap')`(plugin も同様)に置換。`useGSAP` は `gsap.context` + cleanup の手書きに置き換える。`prefers-reduced-motion` または motion:off の時は import 自体を行わない。SSR のテキスト出力は不変。
- `CursorPresence`: `createVisitorPointerApp`(→ `adapters/client`、`lib/cursor/protocol`(zod)、durabcast)を既存の `START_DELAY_MS` タイマ内で `await import()` する。`CursorLayer` の描画契約は不変。
- 各 hook/handler は `.then` 禁止ルールに従い `async` で書く。

**検証**: ビルド後の `app/(site)/layout-*.js` の import graph に gsap / zod / hono が含まれない(`grep -c ScrambleText`、`grep -c "HMAC"` が 0)。既存の browser テストが緑。

## 5. タスク 4: boot 再訪スキップ

**現状**: `src/themes/typekit.ts` のインライン script が、人間には `max(font-load, BOOT_MIN_MS=1000)` 経過後に `html.boot` を外す。

**変更**(script 文字列内、vendor-shaped コードのまま):

- boot 完了時(`boot` を外した直後)に `localStorage['napochaan:boot-seen'] = Date.now()` を書く(try/catch)。
- 起動時に同キーを読み、**7 日以内**なら `BOOT_MIN_MS` を `0` にする。overlay 自体は残す(FOUT ゼロの保証は維持)。フォントは HTTP キャッシュ済みなので wf-active は数十 ms で来る。
- bot 判定・bfcache・3 s scriptTimeout の既存経路は不変。

**検証**: `loading-overlay.test.tsx` の隣に、script 文字列を fake document に対して評価するテストを追加し「初回は 1000 ms 待つ / seen 済みは wf-active 即時で boot が外れる / 8 日前の seen は無視」を pin する。

## 6. タスク 3: Ryo Gothic の kit 分割

**現状**: kit `vmz7pfu` に ryo-gothic-plusn n5/n7、digibop i4/n4、config-mono-vf n2 の 5 面。Typekit JS embed は kit 内全 family を dynamic subsetting で取得するため、ryo-gothic を使わない home でも 2 weight × 約 960 KB が落ちる。`ryoGothic` token の利用は `src/components/page-header` のみ。

**あなたの作業(Adobe Fonts)**: (a) 既存 kit から Ryo Gothic を外す、(b) Ryo Gothic n5/n7 だけの新 kit を作る。**2 つの kit ID** を実装前に共有してください。

**変更**:

- `src/themes/typekit.ts`: `SITE_KIT_ID`(既存)と `RYO_GOTHIC_KIT_ID`(新)を定数化。
- `PageHeader` に client island `<TypekitKitLoader kitId={RYO_GOTHIC_KIT_ID} />` を追加。module スコープのフラグで 1 回だけ `use.typekit.net/<kit>.js` を注入し `Typekit.load` を呼ぶ(ハード/ソフトナビ両対応。React はクライアント挿入のインライン script を実行しないため island が必要)。island は `<html data-typekit-extra="ryo-gothic">` のようなマーカーを同期で立てる。
- boot ゲート(インライン script)の解除条件を「site kit が `wf-active|inactive`」**かつ**「マーカーがある場合は `wf-ryo-gothic-plusn-n5-(active|inactive)` も揃う」に拡張。マーカーは wf-active 判定時点で読む(PageHeader は Suspense 外・first flush 内)。既存 3 s timeout は両 kit に効かせる。
- `fonts.ryoGothic` token の fallback は `sans-serif` のまま。

**検証**: home の Typekit 転送 2.0 MB → 約 70 KB(digibop/config-mono)。`/works/[slug]` では ryo-gothic が active になってから boot が外れる(browser テストで class 遷移を pin)。

## 7. タスク 6: Workers Cache

**仕様(公式 docs 2026-09-22 確認)**: `[cache] enabled = true` で有効。HIT は Worker 非起動、tiered、request collapsing。キー = path + query(順序込み)+ Worker version。Cookie/hostname はキーに含まれない。標準 `Cache-Control` に従い、ヘッダ無しの 200 は 2 h ヒューリスティック。`must-revalidate`/`s-maxage` があると SWR 無効。purge は `ctx.cache.purge({ purgeEverything: true })`(グローバル、Free tier のレート制限)。wrangler 4.69+(手元 4.98)。

**変更**:

1. `wrangler.toml`: まず `[env.staging.cache] enabled = true`。staging 検証後に `[env.production.cache]` を追加(別 PR でも可)。default env は無効のまま。
2. `worker/app.ts` に Cache-Control 付与 middleware:
   - `/_next/image`: `public, max-age=86400, stale-while-revalidate=604800`(`must-revalidate` を外す。hono/cache は残す)
   - `/api/media/file/*`: 同上
   - `/*/rss.xml`, `/llms.txt`, `/llms-full.txt`, `/*.md`, `/.well-known/security.txt`: `public, max-age=3600, stale-while-revalidate=86400`
   - HTML(ISR)は OpenNext が出す `s-maxage`/`swr` をそのまま使う。`private, no-store` の動的ルート(contact/admin/preview/oauth)は bypass されるので触らない。**Payload REST の `/api/*` は Cache-Control を出さない**(本番実測: `/api/users/me` `/api/news?limit=1` が header 無しの 200)。Workers Cache は Cookie をキーに含めず header 無し 200 を 2 h 保持するため、worker 層で `/api/`(`/api/media/file/` を除く)に `private, no-store` を付与して認証 JSON がエッジに乗らないようにする(最終レビュー Critical #1)。
3. `src/collections/hooks/revalidate`: `purgeWorkersCache()` を追加し、`revalidateTag`/`revalidatePath` を呼ぶ全経路(collections 7 + globals/profile + media)から併せて呼ぶ。実装は `getCloudflareContext().ctx` の `cache.purge({ purgeEverything: true })`。`ctx.cache` の型は wrangler 生成型に無い可能性があるため、局所的な構造型で narrow し、無ければ no-op。Worker 外(seed/migrate CLI)は既存パターン通り swallow。`disableRevalidate` を尊重。
4. `scripts/bust-isr-cache.mjs` は不変(Workers Cache は version キーなので deploy 後は自然に新鮮)。

**既知の制約(受容)**:

- `/news/[slug]` `/legal/[slug]` は draftMode を読まない(Live Preview は `/*/preview/[id]` 専用で no-store)。ただし Workers Cache の HIT は Worker に到達しないので、draft cookie 持ちの管理者が公開 URL を開いても公開版 HIT を見る。実害は小。必要なら後日 `Vary: Cookie` を検討。
- **production `[cache]` PR のゲート**: 本番は `accept-ch`/`critical-ch: Sec-CH-Prefers-Color-Scheme` と `vary: Sec-CH-Prefers-Color-Scheme` を全応答に返している(出所はリポジトリ内に無く Cloudflare 側設定の疑い)。staging はこのヘッダを返さないため staging 検証では検出できない。本番有効化の前に (a) Cloudflare 側でこの機能を止める、または (b) light/dark で HTML が同一バイトであることを確認する。
- 受容したトレード: `/_next/image` のブラウザ TTL が 1 h + must-revalidate → 24 h + SWR 7 d。purge はエッジのみなので、同一 URL で media を差し替えるとブラウザ側は最大 1 日古い画像を保持する。

**検証(staging)**: `curl -D -` 2 回で HTML `cf-cache-status: HIT`、`/contact` BYPASS、`/api/users/me` と `/api/news?limit=1` が `private, no-store` で BYPASS、`/_next/image` HIT、admin で publish → 直後 MISS、`/api/cursors` WS が張れる。トレースで TTFB を before/after 記録。

## 8. テスト方針

- 純関数・middleware・purge helper は vitest(node/workers pool)で TDD。
- boot script・kit loader・遅延 import はブラウザモードで class 遷移/呼び出しを pin。
- バンドル検証はビルド成果物 grep(`bundler-export-condition-trap` の教訓)。
- 各タスク完了時に difit でレビュー依頼。commit は本人が行う。

## 9. スコープ外

- M PLUS 1 の JP subset(意図通り)。
- react-aria-components の常駐(Link/Button 全面採用のため)。
- Panda CSS 出力(86 KB 転送)。
- Next.js polyfill 14 KB(browserslist は Next 既定のまま)。
