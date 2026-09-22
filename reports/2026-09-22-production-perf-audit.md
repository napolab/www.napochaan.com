# 本番 (https://napochaan.com/) 表示速度監査 — 2026-09-22

計測: Chrome DevTools MCP (performance trace) / 本番ホーム `/`。
条件A = デスクトップ・無制限。条件B = モバイル 412×915 @2.625 / CPU 4x / Slow 4G。
どちらも UA は通常 Chrome(= bot 判定されない = 人間と同じ boot overlay を踏む)。

## Core Web Vitals (lab)

| 指標     | A: desktop                    | B: mobile throttled        | 判定                |
| -------- | ----------------------------- | -------------------------- | ------------------- |
| TTFB     | 196 ms                        | 98 ms                      | good (ISR HIT)      |
| LCP      | 1,259 ms                      | 893 ms                     | good                |
| LCP 内訳 | TTFB 196 + render delay 1,063 | TTFB 98 + render delay 794 | render delay が 85% |
| CLS      | 0.00                          | 0.01                       | good                |
| DOM      | 504 elements / depth 11       | —                          | 問題なし            |

LCP 要素はテキスト SPAN。render delay ≈ `BOOT_MIN_MS = 1000` の boot overlay 床。
つまり **LCP は設計上 1 秒に張り付いている**。bot UA では overlay が外れるので Lighthouse/PSI は実ユーザーより良く出る。

## コールドロード転送量 (条件B、`ignoreCache` reload)

合計 **3.52 MB** (転送、圧縮後)。

| 種別                 | 件数 | 転送                         | 備考                                                                                                                                                                                                                                                                               |
| -------------------- | ---- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typekit fonts        | 5    | **2,007 KB**                 | Ryo Gothic PlusN 500 = 959 KB, 700 = 976 KB (Slow 4G で各 13 s)。**home では ryo-gothic を使う要素が無い**(`ryoGothic` token の利用は page-header のみ)。Typekit JS embed は kit 内全 family を dynamic subsetting で取得するため、ページ全文字分の漢字 chunk が 2 weight 分落ちる |
| M PLUS 1 (next/font) | 30   | **630 KB**                   | JP unicode-range subset が 28 ファイル。`fonts.ts` のコメントは「JP は system font に落ちる」だが、実際は M PLUS 1 の JP glyph が 60 face ロードされている                                                                                                                         |
| JS                   | 21   | **424 KB** (decoded 1.17 MB) | 下記                                                                                                                                                                                                                                                                               |
| 画像 (本体)          | 3    | **342 KB**                   | works サムネ 38×38px 表示に `w=3840` を要求 (`sizes` 未指定 → 100vw × DPR 2.6)                                                                                                                                                                                                     |
| CSS                  | 3    | 86 KB (decoded 365 KB)       | Panda 出力                                                                                                                                                                                                                                                                         |
| HTML                 | 1    | 22 KB (decoded 428 KB)       | RSC flight 内包                                                                                                                                                                                                                                                                    |
| blur placeholder     | 9    | 5 KB                         | OK                                                                                                                                                                                                                                                                                 |

### JS チャンク内訳 (decoded)

| chunk                  | size    | 中身                                                                                                                                                                                          | 判定                           |
| ---------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 2820                   | 225 KB  | **linkedom (DOM 実装) + cssom** — `budoux` の `dist/dom.js` が `require('linkedom')` するのを webpack がクライアントに同梱。利用元 `src/utils/phrase` (PhrasedText, RSC) と OG の clamp-title | 完全に不要                     |
| 6282                   | 176 KB  | Next.js app-router runtime (+ Baseline polyfill 14 KB)                                                                                                                                        | 固定費                         |
| e4eead01               | 168 KB  | react-dom                                                                                                                                                                                     | 固定費                         |
| 1348 + 2494            | 150 KB  | react-aria-components                                                                                                                                                                         | Link/Button 全面採用のため常駐 |
| 977                    | 100 KB  | hono/client + **zod (331 hit)** + reconnecting-websocket — cursor-presence 経路 (`lib/cursor/protocol.ts` が zod)                                                                             | 遅延化可能                     |
| 8143 + 04763798        | 127 KB  | gsap + ScrambleText + ScrollTrigger + ScrollTo                                                                                                                                                | 遅延化可能                     |
| layout / page / その他 | ~100 KB |                                                                                                                                                                                               |                                |

### 主スレッド

- Forced reflow 合計 123 ms (うち 111 ms が `measure` @ chunk 7813 = TypographyBand/ScrollTrigger 計測)。
- 3rd party: Typekit JS 73 ms。

## キャッシュ層の現状 (質問「Workers Cache API は使えないか」への回答材料)

| 対象              | 現状ヘッダ                                                                                                                   | 実態                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| HTML `/`          | `cache-control: s-maxage=2297, stale-while-revalidate=2592000` / `x-nextjs-cache: HIT` / `vary: Sec-CH-Prefers-Color-Scheme` | OpenNext ISR (R2 incremental + regional cache, `enableCacheInterception`)。TTFB 100–200 ms                  |
| `/_next/image`    | `public, max-age=3600, must-revalidate` / 2 回目 `cf-cache-status: HIT`                                                      | **既に Workers Cache API 経由** (`worker/app.ts` の `hono/cache`, cacheName `opennextjs-cloudflare-images`) |
| `/_next/static/*` | `public, max-age=31536000, immutable` / `cf-cache-status: HIT`                                                               | OK                                                                                                          |

- 画像の問題はキャッシュ有無ではなく **要求サイズ** (w=3840)。Cache API は既に効いている。
- HTML を Cache API で包む案: Cache API は colo 単位で、`revalidateTag`/`revalidatePath` からのグローバル purge ができない (CMS hook 駆動の即時反映が壊れる)。TTFB は既に 100–200 ms なので、投資対効果は低い。ISR (R2 + regional cache) のままが妥当。
- `vary: Sec-CH-Prefers-Color-Scheme` は cache key を割る。用途要確認。

## Astro 置換の阻害要因 (リポジトリ棚卸し)

- Payload admin (`src/app/(payload)`) は Next App Router アプリそのもの。Astro に移すと admin を別 Next アプリとして残す必要がある。
- `unstable_cache` + `revalidateTag/Path` + OpenNext D1 tag cache + `scripts/bust-isr-cache.mjs` の on-demand 無効化系は Astro に等価物なし (自作)。
- `next/og` (Satori) OG 画像 3 ルート、`draftMode` Live Preview、Server Actions (contact / OAuth consent)。
- 一方 `worker/` 層 (Hono, DO, WS cursors, `/_next/image` 変換, OAuth wrapper)、`.md`/RSS/llms/security.txt ハンドラ、`src/lib/payload/*`、Panda CSS は移植可能。

## 結論 (計測ベース)

TTFB / CLS は既に good。LCP は boot overlay の 1 秒床で決まっており、フレームワークを変えても変わらない。
最大の無駄はバイト量 (3.5 MB 中 2.6 MB がフォント、うち 1.9 MB は home で未使用の Ryo Gothic) で、これも Astro 化では解決しない。
→ **Next.js のまま、フォント・画像・クライアント JS を削るのが正解**。

## After: Task 1

Task 1 (`sizes` on every `Image` call site) 実装後の検証。

- `pnpm build` は成功 (warning は既存の `linkedom`/`canvas` 未解決モジュールのみ、本変更と無関係)。
- ホーム `/` の静的出力は `.next/server/app/index.html`(route group はディレクトリを作らないため `(site)/(home)/page.html` は存在しない)。このワークツリーはローカル D1 が未 seed のため works セクションにサムネイルが無く、`<img>` 自体が 0 件 → `sizes` の実地確認はホームだけでは不可能だった。
- `pnpm next start -p 3001` を起動し、DB 非依存の静的デモ画像を持つ `/colophon`(Figure / image-row のデモを埋め込み済み) で確認:

  ```
  $ curl -s http://localhost:3001/colophon | grep -o 'sizes="[^"]*"' | sort | uniq -c
    1 sizes="(min-width: 1180px) 1180px, 100vw"
    2 sizes="(min-width: 480px) 50vw, 78vw"
    1 sizes="(min-width: 908px) 908px, 100vw"
    1 sizes="180x180"
    2 sizes="512x512"
  ```

  (`180x180` / `512x512` は favicon `<link>` の icon サイズで無関係。`<img>` 4 件全てに意図した `sizes` が付き、裸の `sizes="100vw"` は一件も無い。)

- サムネイル (`works-section` 40px / `works-archive`・`related-works` 64px) と `Gallery` セルの実地確認は、ローカル D1 に works/gallery データが無いため未実施。各コールサイトの `sizes` 値は vitest コンポーネントテスト (`figure.test.tsx` / `gallery.test.tsx` / `works-archive.test.tsx` / `related-works.test.tsx`) で個別に固定済み。
- `next.config.ts` の `deviceSizes` から `3840` を削除 (最大候補 2048px)。

## After: Task 2

Task 2 (`linkedom` をクライアントバンドルから排除) 実装後の検証。

- 原因: `budoux/module/html_processor.js` が `linkedom`(→ `cssom`)を無条件 import。`TypewriterText`('use client') → `PhrasedText` → `@utils/phrase` の経路でクライアントに引き込まれ、chunk 2820 (225 KB decoded) の正体だった。`phrase()` は `parser.parse(text)` しか呼ばず DOM には触れないため、クライアント側では `linkedom` を空モジュールへ alias するだけで安全に外せる。OG (`clamp-title`) はサーバー側で budoux の DOM 経路を使うため、alias は **クライアントバンドルのみ** に適用 (webpack: `isServer` で分岐 / turbopack: `resolveAlias` の `browser` condition のみ)。
- 実装: `src/config/client-aliases.ts`(`applyClientAliases` + `TURBOPACK_RESOLVE_ALIAS`)、`src/shims/empty-module.ts`(turbopack 用の空シム)、`next.config.ts` の `webpack`/`turbopack` に配線。
- ビルド検証 (`pnpm build` 成功後):

  ```
  $ grep -l "before-selector" .next/static/chunks/*.js | wc -l
  0
  $ grep -rl "before-selector" .next/server | head -1
  .next/server/chunks/3889.js
  ```

  (`before-selector` は cssom の state machine 文字列で、旧 chunk 2820 の指紋として使用。クライアント chunk からは 0 件に減り、サーバー側 (OG 用) には残存 — 期待通り。)

- テスト: `pnpm vitest run src/config/client-aliases.test.ts` (4 tests, TDD RED→GREEN 確認済み) / `pnpm vitest run src/components/phrased-text src/components/typewriter-text` (4 tests, PASS)。
- `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`: lint/typecheck ともにクリーン。フルテストは 1548 passed / 2 failed(いずれも `motion-provider.test.tsx` の browser mode タイムアウトで本変更と無関係。単体再実行で 4/4 PASS、既知のフレーク)。

## After: Task 3

Task 3 (`gsap` + 3 プラグインを共有ローダー `@utils/gsap` の背後に遅延化) 実装後の検証。「8143 + 04763798 = 127 KB」として指摘した gsap 系チャンクが対象。

- 実装: `src/utils/gsap/index.ts`(`loadGsap()`、`Promise.all` で `gsap`/`ScrambleTextPlugin`/`ScrollTrigger`/`ScrollToPlugin` を dynamic import しメモ化、`registerPlugin` は初回のみ)。`EchoText` / `ScrambleText` / `TypographyBand` の3コンポーネントからモジュールトップレベルの `import gsap from 'gsap'` ＋ `@gsap/react` の `useGSAP` を撤去し、`useEffect` 内で `await loadGsap()` してから gsap 本体の副作用(`gsap.context` / `matchMedia` / `ScrollTrigger.create` / `ticker.add` 等、挙動は変更なし)を組み立てる形に書き換え。`@gsap/react` は `src` 内の全参照が消えたので `pnpm remove` し `vitest.config.ts` の `optimizeDeps.include` からも削除。
- ビルド検証 (`pnpm build` 成功後、Turbopack ビルド):

  ```
  $ grep -l "ScrambleTextPlugin\|scrambleText" ".next/static/chunks/app/(site)/layout-"*.js ".next/static/chunks/app/(site)/(home)/page-"*.js | wc -l
  1   # ← home page 自身の `scrambleText:` という tween-vars のプロパティキー(EchoText 自前コード内の文字列)に一致するだけで、ライブラリ本体ではない
  $ grep -l "GreenSock" ".next/static/chunks/app/(site)/layout-"*.js ".next/static/chunks/app/(site)/(home)/page-"*.js | wc -l
  0   # gsap-core の著作権バナー(ライブラリ本体の指紋)は layout/home page チャンクに 0 件
  $ grep -l "GreenSock" .next/static/chunks/*.js
  .next/static/chunks/04763798.931a331d44fb0aba.js   # gsap-core + registerPlugin (51,813 B)
  $ grep -o "ScrambleTextPlugin\|ScrollTrigger\|ScrollToPlugin" .next/static/chunks/200.b9ad5de77f924fb6.js | sort -u
  ScrambleTextPlugin                                  # (11,151 B)
  $ grep -o "ScrambleTextPlugin\|ScrollTrigger\|ScrollToPlugin" .next/static/chunks/3795-407b2a901fb31142.js | sort -u
  ScrambleTextPlugin
  ScrollToPlugin
  ScrollTrigger                                        # (7,307 B)
  ```

  gsap 本体 + 3 プラグインの合計 70,271 B (≈ 68.6 KiB decoded) は非同期チャンク (`04763798` / `200` / `3795`) にのみ存在し、`layout` / `(home)/page` などの同期チャンクからは検出されない。

- **JS delta (実測 before/after ビルド比較)**: `git checkout --` で3コンポーネントを旧(静的 import)状態に一時的に戻し `pnpm build` → 新(ローダー)状態に戻して再度 `pnpm build`、`First Load JS` を比較(SiteShell 配下の全ページが対象、`TypographyBand`/`ScrambleText` がグローバル chrome にあるため)。

  | route                         | before | after  | delta      |
  | ----------------------------- | ------ | ------ | ---------- |
  | `/`                           | 256 kB | 186 kB | **-70 kB** |
  | `/about`                      | 256 kB | 187 kB | -69 kB     |
  | `/blog`, `/blog/page/[num]`   | 202 kB | 132 kB | -70 kB     |
  | `/blog/[slug]`                | 259 kB | 189 kB | -70 kB     |
  | `/colophon`                   | 294 kB | 224 kB | -70 kB     |
  | `/contact`                    | 206 kB | 137 kB | -69 kB     |
  | `/gallery/preview`            | 255 kB | 185 kB | -70 kB     |
  | `/legal/[slug]`               | 255 kB | 186 kB | -69 kB     |
  | `/news`, `/news/page/[num]`   | 195 kB | 126 kB | -69 kB     |
  | `/news/[slug]`                | 259 kB | 189 kB | -70 kB     |
  | `/works`, `/works/page/[num]` | 203 kB | 133 kB | -70 kB     |
  | `/works/[slug]`               | 261 kB | 191 kB | -70 kB     |

  一貫して **-69〜-70 kB**(= 実測の非同期チャンク合計 70,271 B と一致)。`/log` のみ 123→124 kB で ±1 kB(誤差範囲、`TypographyBand` を使わないページ)。

- テスト (TDD RED→GREEN):
  - `src/utils/gsap/gsap.test.tsx` を先に書いて `pnpm vitest run src/utils/gsap/gsap.test.tsx` が `Failed to resolve import "./index"` で RED になることを確認 → `src/utils/gsap/index.ts` 実装後に GREEN(2 tests)。
  - ブリーフのテスト案は `gsap.plugins.scrollTrigger` を検証していたが、実際の gsap ランタイムでは `ScrollTrigger` はツイーン系プラグインではないため `gsap.plugins` には載らず(`registerPlugin` は代わりに `gsap.core.globals()` へ core global として登録する)、literal のままでは恒久的に red になると判明。gsap 公式 d.ts も `ScrollToPlugin`/`ScrollTrigger` の `gsap.plugins` 拡張を欠いている。テストは `gsap.plugins.scrambleText`(型付き)はそのまま、`ScrollToPlugin`/`ScrollTrigger` の検証のみ `as unknown as Record<string, unknown>` 境界キャスト+コメントで実挙動を検証する形に調整(`src/utils/gsap/gsap.test.tsx`)。
  - `EchoText` / `ScrambleText` / `TypographyBand` の既存テストは無改修のまま全 green(`pnpm vitest run src/components/echo-text src/components/scramble-text src/components/typography-band src/utils/gsap` → 5 files / 17 tests PASS)。同期的なツイーン開始を仮定したアサーションは元々無かったため `expect.poll` への置き換えは不要だった。
- `grep -rn "@gsap/react" src` は空 → `pnpm remove @gsap/react` 実施、`vitest.config.ts` の `optimizeDeps.include` からも削除。
- `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`: lint/typecheck ともにクリーン。フルテストは 1552 passed / 1 skipped(全 green、既知の `motion-provider` フレークも今回は発生せず)。

## After: Task 4

Task 4(カーソル WebSocket クライアントの遅延読み込み)実装後の検証。`SiteShell` が全ページで静的 import している `CursorPresence`(`src/components/cursor-presence/index.tsx`)が `createVisitorPointerApp()` を `useMemo` 内で同期生成しており、`visitor-pointer-app.ts → src/adapters/client.ts` の import チェーンが `hono/client`(HMAC cookie 署名含む)+ `reconnecting-websocket` + `durabcast/helpers/client` + `zod`(`./protocol`)を全ページの初期スクリプトグラフに引き込んでいた。

- 実装: `src/lib/cursor/lazy-visitor-pointer-app.ts`(`createLazyVisitorPointerApp(): VisitorPointerApp`)。`VisitorPointerApp` と同一インターフェースを維持したまま、実体(`createVisitorPointerApp`)を `start()` 発火時の `import('./visitor-pointer-app')` に遅延。`generation` カウンタで `end()` が import 中に競合しても実体を起動しない(StrictMode の使い捨て mount 対策も含む)。dynamic import 失敗時は try/catch で握りつぶす(カーソル presence は装飾機能のため、chunk 読み込み失敗時はそのページでは無表示になるだけ)。`CursorPresence`(`index.tsx:8,32`)は `createVisitorPointerApp` の直接 import を `createLazyVisitorPointerApp` に置き換え。
- ビルド検証 (`pnpm build` 成功後):

  ```
  $ grep -l '"HMAC"' ".next/static/chunks/app/(site)/layout-"*.js | wc -l
  0
  $ grep -c "reconnecting" ".next/static/chunks/app/(site)/layout-"*.js
  0
  ```

  ブリーフ指定の両 grep とも期待通り 0 件。実体コードの行き先を特定:

  ```
  $ grep -rl '"HMAC"' .next/static/chunks/
  .next/static/chunks/3506.3a67d38b3d3ad02c.js   (80,215 B)
  ```

  `hc()`(HMAC cookie 署名)+ `reconnecting-websocket` + `durabcast`(`pingWebSocket` 等)は非同期チャンク `3506` 1 個にまとまり、`layout` はもちろん他のどの同期チャンクからも検出されない。

- **実ページの `<script>` タグでの直接検証(Next の `First Load JS` 集計列だけに頼らない)**: `next build` の表側 `First Load JS` 列はタスク実施前後で `/` = 186 kB のまま変化しなかった(Next のこの集計列がこの種の非同期チャンクを合算に含めていない模様)。数字だけでは実体が本当に初期グラフから抜けたか確証が持てないため、`git checkout --`/ファイル退避で3コンポーネント変更前(task 4 適用前)の状態に一時的に戻して再ビルドし、実際に配信される `.next/server/app/index.html` の `<script src>` 参照を before/after で直接比較した:

  ```
  # BEFORE(task 4 適用前、createVisitorPointerApp を同期生成)
  $ grep -o '/_next/static/chunks/[^"]*\.js' .next/server/app/index.html | sort -u
  ...
  /_next/static/chunks/2691-b32c59999bb156d6.js   ← HMAC/reconnecting-websocket チャンク、本文に含まれる
  ...
  (計17ファイル)

  # AFTER(task 4 適用後、createLazyVisitorPointerApp)
  $ grep -o '/_next/static/chunks/[^"]*\.js' .next/server/app/index.html | sort -u
  ...
  (2691/3506 相当のチャンクは一覧から完全に消失、計17ファイルのまま他は同一)
  ```

  `/` の初期 HTML が参照するスクリプトタグから該当チャンク(約80KB decoded)が完全に消えたことを実ファイルレベルで確認。ビルド後に一時退避したファイルは全て元(task 4 適用後)の内容に復元し、`diff` で内容一致を確認済み。

- テスト (TDD RED→GREEN): `src/lib/cursor/lazy-visitor-pointer-app.test.ts` を先に書いて `pnpm vitest run src/lib/cursor/lazy-visitor-pointer-app.test.ts` が `Cannot find module` で RED(4 tests failed)になることを確認 → `src/lib/cursor/lazy-visitor-pointer-app.ts` 実装後に GREEN(4 tests)。`pnpm vitest run src/components/cursor-presence src/lib/cursor` → 8 files / 34 tests PASS(`cursor-presence.test.tsx` は `@lib/cursor/visitor-pointer-app` を mock していないため無改修)。
- `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`: lint/typecheck ともにクリーン。フルテストは 258 files / 1556 passed / 1 skipped(全 green、`motion-provider` フレークも今回は発生せず)。

## After: Task 5

Task 5(リターン訪問者の boot floor スキップ)実装後の検証。`src/themes/typekit.ts` のブート待ちスクリプトは、フォント読み込み完了後も `BOOT_MIN_MS`(1000ms)固定の演出フロアを人間の全訪問に一律で課していた。初回訪問ではブランドの boot 演出として意味があるが、7日以内のリピート訪問はフォントが HTTP キャッシュから数十msで解決するため、同じ1秒フロアが LCP を素通しで押し下げていた。

- 実装: `BOOT_SEEN_KEY`('napochaan:boot-seen') / `BOOT_SEEN_TTL_MS`(7日 = 604,800,000ms)の2定数をエクスポートし、ローダースクリプト文字列(テンプレートリテラル)に補間。スクリプト側は起動時に `localStorage[SEEN_KEY]` を `try/catch` で読み、`Date.now() - stamp < SEEN_TTL` なら `BOOT_MIN_MS = 0` に上書き(以降のフロア計算・MutationObserver・pageshow(bfcache)・scriptTimeout・BOT 判定のロジックは無改修)。boot 除去が完了するたび(人間パスのみ)に `localStorage.setItem(SEEN_KEY, String(Date.now()))` を同じく `try/catch` でスタンプ。private mode 等でストレージ例外が出た場合は `seen` が `false` のまま(=デフォルトの1sフロア)にフォールバックする。
- ヘッダーコメントに「To tune the floor…」パラグラフの直後、Bots パラグラフの直前として新パラグラフを追加し、リターン訪問の0msフロアと2エクスポート定数の役割を明記(既存の「vendor-shaped code につき lint 対象外」の注記は維持)。
- テスト (TDD RED→GREEN): `src/themes/typekit.test.tsx`(browser project、`document`/`localStorage`/timers を使うため `.tsx` 拡張子だが JSX なし)をブリーフの指定コードのまま先に作成 → `pnpm vitest run src/themes/typekit.test.tsx` が `does not provide an export named 'BOOT_SEEN_KEY'` で RED(import エラーで 0 tests)になることを確認 → `typekit.ts` 実装後に GREEN(4/4 tests, holds-floor-on-first-visit / drops-immediately-on-return-visit / TTL-expiry-treated-as-first-visit / storage-throws-falls-back-to-floor)。
- ブリーフに書かれていない環境衝突を1件発見・対処: このリポジトリの browser project(`headless: true`, Playwright Chromium)が報告する `navigator.userAgent` には実際に `HeadlessChrome/…` が含まれており、ローダー内の(今回無改修の)BOT 判定正規表現 `/…|headlesschrome|…/i` に一致してしまう。素のブリーフ通りのテストをそのまま実行すると、`runLoader()` 実行直後に BOT 分岐が同期的に `boot` クラスを剥がしてしまい、4 tests 中 3 tests が「first-visit でも即座に boot が消える」という偽の失敗になることを実測で確認済み(`navigator.userAgent` を直接 assert して "…HeadlessChrome/148.0.7778.96…" を確認)。対処として `Navigator.prototype.userAgent` を `beforeEach`/`afterEach` で人間相当の UA に差し替える最小限のスタブをテストファイルに追加(元の記述子を保存して復元)。これはテスト専用の環境ワークアラウンドであり、BOT 判定ロジック自体は本文差分の対象外のまま。ブリーフが挙げていた2つの代替ワークアラウンド(rAF 16ms 先送り / `Storage.prototype` の代わりに `window.localStorage` を `defineProperty` でスタブ)はこの環境では不要だった(`Storage.prototype.getItem` の spy はそのまま Chromium 上の `localStorage` に効いた)。
- `src/components/loading-overlay/loading-overlay.test.tsx`(3 tests)は無改修のまま green を確認。
- `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`: lint/typecheck ともにクリーン。フルテストは 259 files / 1560 passed / 1 skipped(全 green、既知の `motion-provider` フレークも今回は発生せず)。
- Step 5(`pnpm build && pnpm next start -p 3001` での実ブラウザ確認)は未実施 — vitest によるゲートで完了とした(controller のディスパッチ指示で optional 指定。ブリーフ自体には optional の記載はない)。

## After: Task 7 (staging 検証待ち)

Task 7(staging 限定 Workers Cache + write 時 purge-everything)実装完了。Cloudflare の Workers Cache(`[cache] enabled = true`)は 200 応答を public な `Cache-Control` 付きで返すと、エッジが Worker を一切起動せずキャッシュから直接配信する。Next.js が `Cache-Control` を付けないルート(RSS/llms.txt/`.md`/media file/security.txt)向けに worker 層で明示的なポリシーを付与し、CMS の全 write で cache 全体を purge することで staleness を防ぐ構成。

- 実装(3スライス、すべて TDD RED→GREEN):
  1. `worker/middleware/cache-control.ts` — `resolveCacheControl(pathname)` が正規表現テーブルでパスを判定し、`cacheControlHeaders()` Hono middleware が upstream に `Cache-Control` が無い・`Set-Cookie` が無い・status 200 の応答にだけポリシーを追記(upstream の既存ヘッダーは常に優先)。`worker/app.ts` に `.use('*', weakenETag())` の直後・`/_next/image` ルートより前で登録。`/_next/image` 専用の `hono/cache` の `cacheControl` も `must-revalidate` → `stale-while-revalidate=604800` に緩和(Workers Cache が invoke なしで hit を返すため `must-revalidate` が SWR を無効化してしまう)。
  2. `src/collections/hooks/revalidate/purge-workers-cache.ts` — `purgeWorkersCache()` が `getCloudflareContext().ctx` から `cache.purge` を構造的に narrow(型未対応のため `unknown` 経由の最小限の `as` 1箇所、ブリーフ通り)し、存在すれば `ctx.waitUntil(cache.purge({ purgeEverything: true }))`。Worker 外(CLI seed/migrate)では `getCloudflareContext()` が throw するため catch で no-op、cache binding が無い場合(cache 無効時)も no-op。
  3. `src/collections/hooks/revalidate/index.ts` の `dispatch` / `dispatchTagsAndPaths` / `revalidateTagsAndPaths` の3経路すべての末尾で `purgeWorkersCache()` を呼び出し。前2者は既存の `disableRevalidate` early-return より後に配置されるため、フラグ有効時は purge もスキップされる。
- `wrangler.toml` に `[env.staging.cache]\nenabled = true` を `[env.staging.vars]` 直後・`[[env.staging.routes]]` 直前に追加。production block・top-level `[cache]` は追加せず。
- テスト: `worker/middleware/cache-control.test.ts`(19 tests)、`worker/app.test.ts` に2ケース追加(計 74 tests / 9 files)、`src/collections/hooks/revalidate/purge-workers-cache.test.ts`(3 tests)、`src/collections/hooks/revalidate/revalidate.test.ts` に6ケース追加(計 28 tests / 2 files)。全 RED→GREEN 確認済み(詳細は task-7-report.md)。
- wrangler config 検証: `node_modules/wrangler/config-schema.json` の `RawEnvironment.properties.cache`/`CacheOptions` に `enabled: boolean` が定義済みであることを確認。`wrangler deploy --dry-run --env staging` は `.open-next/assets` 未ビルド(本セッションではビルドしない指示のため)による `ERROR` のみで、`cache` 関連の警告・エラーは無し。加えて `confbox` 同梱の `smol-toml` で `wrangler.toml` を実パースし、`env.staging.cache = {"enabled":true}` / `env.production.cache = undefined` / top-level `cache = undefined` を構造的に確認。
- `pnpm fmt && pnpm lint && pnpm typecheck && pnpm test`: lint/typecheck ともにクリーン。フルテストは 261 files / 1590 passed / 1 skipped(全 green、`motion-provider` フレークも今回は発生せず)。
- Step 13(staging deploy + curl 検証)は担当外 — owner が `pnpm deploy:staging` 後に以下を実行:

  ```bash
  for p in / /works /blog/rss.xml /llms.txt /contact /api/users/me "/api/news?limit=1" "/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fzero-to-dj-vol01-flyer.jpg&w=640&q=75"; do
    for i in 1 2; do printf "%-70s " "$p#$i"; curl -s -o /dev/null -D - "https://stg.napochaan.com$p" | grep -i "^cf-cache-status\|^cache-control" | tr -d '\r' | tr '\n' ' '; echo; done
  done
  ```

  期待値: `/`, `/works`, rss, llms, image は2回目のリクエストで `cf-cache-status: HIT`。`/contact` は両方とも `BYPASS`(Next の `private, no-store` が優先されるため)。`/api/users/me` と `/api/news?limit=1` は両方とも `cache-control: private, no-store` + `BYPASS`(worker 層の `/api/` deny ポリシー。これが無いと Payload REST の header 無し JSON が匿名訪問者に replay される)。`/api/media/file/*.jpg` は 2 回目 `HIT`。staging admin で任意の draft を publish → `/works` を再 curl → `MISS`(purge が効いた証拠)→ その次のリクエストで再び `HIT`。ブラウザで `/` を開き、cursor presence(`/api/cursors` の WebSocket upgrade)が Workers Cache に横取りされず引き続き接続できることも確認。DevTools trace で前後の TTFB を記録。production 有効化(`[env.production.cache] enabled = true`)は staging 数値の owner 承認後、別の1行 PR とする。

## 残作業(owner)と本番再計測の手順

最終レビュー(opus, 全ブランチ)→ 修正 5 件(`/api/*` を `private, no-store` で deny / reduced-motion 時は gsap を import しない / Figure intrinsic の 85 % キャップ / image-row の sizes / purge の try-catch)→ 再レビュー clean。commit は未実施(working tree のまま)。

1. **commit** — `git diff` を difit で確認してから本人が commit。
2. **staging**: `pnpm deploy:staging` → 上の「After: Task 7」の curl ループを実行。`/api/users/me` `/api/news?limit=1` が `private, no-store` + `BYPASS`、`/contact` BYPASS、HTML/画像/RSS が 2 回目 HIT、admin publish 後に MISS。home の `<img>` の `sizes` と実際に選ばれる `w=` を DevTools で確認(local は D1 未 seed のため未確認)。
3. **production `[cache]` PR のゲート**: `accept-ch`/`vary: Sec-CH-Prefers-Color-Scheme` の出所(Cloudflare 側)を止めるか、light/dark で HTML が同一バイトであることを確認してから `[env.production.cache] enabled = true` を入れる。
4. **Task 6(Ryo Gothic kit 分割)**: Adobe Fonts で kit を 2 つに分け、`SITE_KIT_ID` / `RYO_GOTHIC_KIT_ID` を渡す → plan の Task 6 を実装。home の Typekit 2.0 MB → 約 70 KB はこれで初めて効く。
5. **本番再計測**: deploy 後に Chrome DevTools MCP で `/` を desktop / mobile(Slow 4G, CPU 4x)の同条件で trace し、この文書の冒頭の表と同じ行(TTFB / LCP / CLS / 転送量 / 種別別バイト)を「After(production)」として追記する。期待: 画像 342 KB → 数十 KB、初期 JS −約 150 KB(decoded)、再訪 LCP < 0.5 s、Ryo Gothic 分割後に転送量 < 1.2 MB。
