# 動的 OG 画像生成 — 設計書

- 日付: 2026-06-11
- 対象: napochaan.com (Next.js 15 + OpenNext Cloudflare + Payload)
- ステータス: 設計合意待ち

## 1. ゴールと範囲

詳細ページの og:image を、レコード内容（タイトル・区分・サムネイル）から
ランタイムで動的生成したブランドカードに差し替える。

### 対象（スコープ内）

- `blog/[id]`
- `works/[id]`
- `news/[id]`

### スコープ外（今回やらない）

- セクション一覧（about / works / news / blog / log）— 引き続き静的 `og-default.png`
- home / about — 専用静的カードのまま
- 静的事前生成（ビルド/seed 時 R2 出力）方式

## 2. ライブラリ決定: `next/og`（`ImageResponse`）

| 候補         | 判定    | 理由                                                                                                                                                                                                            |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **next/og**  | ✅ 採用 | Next.js 公式。file-convention で既存メタデータ生成に統合。OpenNext Cloudflare が現行サポート（esbuild が `.wasm` を external 化し wrangler が precompile）。wrangler に ttf/otf の `type="Data"` ルールが既存。 |
| workers-og   | ✗       | HTML 文字列 API で型安全性が低い。正式リリース無し。OpenNext が WASM 問題を解決済みで利点が薄い。                                                                                                               |
| 静的事前生成 | ✗       | 動的タイトルを反映できない。                                                                                                                                                                                    |

### 技術前提（調査で確認）

- OpenNext Cloudflare は **Node.js runtime on workerd**（Edge runtime 不要）。
- `next/og` は内部で Satori + `resvg.wasm`。worker バンドルに ~800KB JS + wasm を追加。
- `wrangler.toml` に既存:
  ```toml
  [[rules]]
  type = "Data"
  globs = ["**/*.ttf", "**/*.otf"]
  fallthrough = true
  ```
  → フォントを ArrayBuffer として import できる土台が既にある。

### 検証ステップ（実装前スパイク）

本実装前に、最小の `opengraph-image.tsx`（テキストのみ・フォント1枚）を1ルートに置き、
`pnpm build`（opennextjs-cloudflare build）→ ローカル wrangler preview で
PNG が 200 で返ること、worker バンドルサイズが上限内であることを確認する。
ここが通らなければ workers-og へ方針転換する判断点とする。

## 3. カードデザイン（確定: 非対称「情報柱 + field」）

1200×630。確定ビジュアル: `reports/og-mockups/final-gol-boost.png`（画像なし）/
`reports/og-mockups/final-img2.png`（画像あり）。

```
┌────────────┬───────────────────────────────┐
│ napochaan… │  ⌐ ALIVE 120        field      │  左: 情報柱 (width 432, border-right 2px ink)
│            │   ░▓ ▓░  ▓   ▓▓   ░            │  右: field
│ [NEWS]     │   ▓  Game of Life 盤面 (boost) │
│ 大見出し    │     ▓▓   ░   ▓  ▓▓   ░          │  ← 画像なし = 本番 life.ts の生盤面
│ (BudouX)   │   ░   ▓▓     ▓    ▓   ▓▓        │     画像あり = 矩形サムネ cover (clip無)
│            │     ▓   ░  ▓▓   ▓     ░         │
│ napochaan. │   ▓▓   ▓    ░   ▓▓   ▓          │
│ (digibop)  │  2026.06.11        gen 0042 ⌐  │
└────────────┴───────────────────────────────┘
```

### レイアウト

- **左: 情報柱**（width 432px = 18×24 グリッド, `border-right: 2px ink`, 背景 canvas）
  - `napochaan.com`（mono, muted, 上）
  - 区分ラベル `NEWS` / `WORKS` / `BLOG`（英大文字, electric-blue ベタ地に白文字チップ）
  - 見出し（LINE Seed JP Bold, BudouX 文節折返し, §下記）
  - `napochaan.`（**digibop EchoText の事前 PNG**, 柱下に署名, width ~344）
  - meta（mono, 日付 / og:image / 1200×630 等）
- **右: field**（x=432 以降, 全高）
  - **画像なし** → 本番 `life.ts` 共有の **Game of Life 盤面**を 24px セルで敷く（§6）。
    boost 濃度（青 `rgba(26,52,255,0.92)` ＋ 赤セル `rgba(255,0,43,0.85)`）、22px 角。
  - **画像あり** → works サムネ等を **矩形 cover（シェイプ clip しない）**で表示。
    `border-left: 2px ink`、右上に `no.NN` ticket。
- **四隅ブラケット / system text**: 青 L 字 + mono ラベル。footer 相当に
  `gen NNNN` / `alive N`（GoL の実カウントと連動）, `napochaan.com`, 年。

### トークン（`src/themes/tokens/index.ts` から）

| 用途                   | 値                                                              |
| ---------------------- | --------------------------------------------------------------- |
| canvas                 | `oklch(0.952 0.004 265)` (gray.1)                               |
| ink (text/罫)          | `oklch(0.185 0.020 265)` (gray.12)                              |
| muted / subtle         | gray.11 / gray.9                                                |
| grid line              | `oklch(0.884 0.007 265)` (gray.5) / **cell 24px**（GoL と共有） |
| accent (electric blue) | `oklch(0.490 0.287 266)` (blue.9) ≒ `rgb(26,52,255)`            |
| 赤アクセント           | red.9 `oklch(0.630 0.256 25)` ≒ `rgb(255,0,43)`                 |
| 罫 width               | 2px / corner 角丸なし                                           |
| system text            | mono / letterSpacing 0.12em / 英大文字                          |

### タイトルの改行（BudouX）

CSS `text-wrap`/`word-break: auto-phrase` は **Satori 非対応**かつ Chrome 専用。
日本語の文節改行は **BudouX をサーバサイドで実行**して解決する（既存 `@utils/phrase` /
`PhrasedText` と同方式）。Satori 向けには、文節チャンクを `white-space: nowrap` の
inline 要素として `flexWrap: wrap` のコンテナに並べ、**文節境界でのみ折れる**ようにする
（ブラウザ版の `word-break: keep-all` + `<wbr>` と等価）。
柱幅が狭いため、過長な単一文節は `overflow-wrap: anywhere` をフォールバックに許可。
タイトルは最大行数でクランプ（超過は末尾省略）。

## 4. 書体戦略（確定）

Satori は **ttf / otf / woff のみ**（woff2 非対応）。Typekit 書体は使用不可。

| 役割                      | 採用                                   | 入手 / 方式                                                                                 |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| JP 見出し                 | **LINE Seed JP Bold (OTF)**            | OFL 公式リリースから OTF を取得し fonts に追加。CJK 全グリフ ~数MB。                        |
| Latin system text (mono)  | **Geist Mono (OFL)**                   | Google Fonts から ttf を Latin+数字+記号にサブセット（~15-30KB）。`config-mono-vf` 代替。   |
| `napochaan.` ワードマーク | **digibop（本物）を事前 PNG 化**（§5） | フォント埋め込みではなく**透過 PNG をアセット同梱**し `<img>` 合成。Satori はフォント不要。 |

### フォントのロード方式（決定 + フォールバック）

- **第一候補: ランタイム fetch**（JP フォントが重く worker バンドルを圧迫するため、
  `ASSETS`/R2 から fetch して `ImageResponse({ fonts })` に渡す。ISR キャッシュで fetch は稀）。
- **フォールバック: Data import 同梱**（既存 wrangler `ttf/otf=Data` ルール）。スパイクで実測して確定。

## 5. digibop ワードマークの事前 PNG 化（render-once / composite-many）

サイトの `EchoText`（hero ワードマーク）は **digibop = Adobe Typekit** で、ファイル配布
されず Satori で描画不可。さらに EchoText のエコーは `-webkit-text-stroke` 依存で
Satori も非対応。文言は固定（`napochaan.`）なので、**Typekit が効く live サイト（staging）
から実 EchoText を透過 PNG として焼き、アセット化して OG で `<img>` 合成**する。

### 生成手順（再生成可能なスクリプトとして残す）

1. staging（`https://stg.napochaan.com/`）home の `span[role="img"][aria-label*="napochaan"]` を分離。
2. グリーン背景に載せて高 DPR で screenshot（chrome-devtools / Playwright）。
3. PIL でグリーンキー（despill）→ 余白クロップ → 透過 PNG（`reports/og-mockups/echo-wordmark.png`
   が現行成果物。本番は `src/.../og/assets/wordmark.png` 等に配置）。

> digibop の見た目を 1:1 で保持できる唯一の方法。デザイン変更時のみ再生成。

## 6. Game of Life field（本番 `life.ts` 共有）

画像なしカードの右 field は、**`src/components/game-of-life/life.ts` の純関数を OG ルートで
import**して盤面を生成する（本番と同一ロジック = DRY・地続き）。

- `createGrid(cols, rows)` → `seedRandom(grid, 0.16, rand)` → `step()` を数回（例 8）→ 盤面確定。
- `cols = ceil(fieldW/24)`, `rows = ceil(630/24)`。決定的にするため `rand` はシード付き
  （`Math.random` は使わない。OG はビルド/再検証時生成なので毎回同じで良い）。
- 各 alive セルを 22px 角（24px セルの内側 +1px）で描画。色は本番踏襲だが **OG は boost 濃度**:
  青 `rgba(26,52,255,0.92)`、`(x*31 + y*17) % 23 === 0` のセルのみ赤 `rgba(255,0,43,0.85)`。
- `countAlive` の値を `alive N` ラベルに、固定の `gen NNNN` を footer に出す（system text と連動）。
- Satori 実装: セルは絶対配置 or flex の小 `<div>` 群。数百要素になるので
  パフォーマンス／要素数はスパイクで確認（過大なら密度や field 範囲で調整）。

## 7. メタデータ統合

`next/og` の file-convention（各セグメントに `opengraph-image.tsx`）を採用すると
Next が自動で `og:image` / `twitter:image`（summary_large_image）を該当ルートに配線する。

### `resolveDetailMetadata` の変更

- 詳細3ルートでは **明示的な `openGraph.images` / `twitter.images` を出力しない**
  （file-convention に委譲し二重指定を避ける）。
- `og:title` / `description` / `url` / `type` / `siteName` / `locale` は従来どおり helper が出力。
- セクション一覧は無変更（`resolveSectionMetadata` はそのまま `og-default.png`）。

> 既存テスト（`resolve-detail-metadata.test.ts`）の images 期待値を更新する。

### カード側のデータ取得

各 `opengraph-image.tsx` は自セグメントの `params.id` で当該レコードを再取得し、
`{ title, sectionLabel, dateOrMeta, imageUrl? }` に正規化してカードを描画する。
画像 URL は **Cloudflare Images 変換（`/_next/image`）を経由しない元 URL**（R2 公開 URL）
を使い、Satori が worker 内 `fetch` で取得できるようにする。

## 8. キャッシュ / ISR

- `opengraph-image.tsx` はページと同じ revalidate / tag に従い、生成 PNG は
  OpenNext の R2 incremental cache に乗る。レコード更新時はページと同じ
  `revalidateTag` 系統で失効する（既存挙動に追従）。

## 9. ファイル構成（colocation）

```
src/
├─ utils/og/
│  ├─ resolve-og-card-data/           # 純関数: record → カード入力データ
│  │  ├─ index.ts
│  │  └─ resolve-og-card-data.test.ts
│  ├─ clamp-title/                    # 純関数: タイトル行/文節クランプ（BudouX 連携）
│  │  ├─ index.ts
│  │  └─ clamp-title.test.ts
│  ├─ section-label/                  # 純関数: slug → 'WORKS'|'NEWS'|'BLOG'
│  │  ├─ index.ts
│  │  └─ section-label.test.ts
│  ├─ og-life-board/                  # 純関数: life.ts を使い field 盤面(cells)+alive を生成
│  │  ├─ index.ts                     #   src/components/game-of-life/life.ts を import（DRY）
│  │  └─ og-life-board.test.ts
│  ├─ load-og-fonts/                  # フォント ArrayBuffer 取得（ASSETS/R2 fetch）
│  │  └─ index.ts
│  └─ og-card/                        # ImageResponse 用 JSX を組むレンダラ（柱+field+digibop）
│     └─ index.tsx                    # size/contentType 定数も export
├─ assets/og/wordmark.png             # digibop EchoText の事前透過 PNG（§5 で生成）
├─ app/(site)/works/[id]/opengraph-image.tsx
├─ app/(site)/news/[id]/opengraph-image.tsx
└─ app/(site)/blog/[id]/opengraph-image.tsx
```

- 各 `opengraph-image.tsx` は薄いラッパー（params → fetch → resolve-og-card-data
  → og-card → ImageResponse）。共通ロジックは `utils/og` の純関数に寄せる。
- 文節分割は既存 `@utils/phrase`（BudouX）を再利用。GoL は既存
  `@components/game-of-life/life`（純関数 life.ts）を再利用。

## 10. テスト方針（TDD）

- 純関数（`resolve-og-card-data` / `clamp-title` / `section-label` / `og-life-board`）は
  vitest で Red→Green→Refactor。`*.test.ts`（DOM 不要 = node 環境）。
  - `og-life-board`: 決定的シードで盤面サイズ・alive カウント・赤セル位置の不変性を検証。
- 画像バイナリ自体の検証は不可。`og-card` は「入力に対し期待する要素構造
  （ラベル文字列・文節チャンク・画像あり/なし分岐・セル数）を返す」レベルで検証。
- E2E 的な PNG 200 確認はスパイク（§2）と手動 difit レビューでカバー。

## 11. 設定 / ビルド

- 既存 `[[rules]] type="Data"` で ttf/otf import 可（同梱方式採用時）。
- `open-next.config.ts` / `next.config.ts` は変更不要見込み（スパイクで確認）。
- worker バンドルサイズをスパイクで実測し、フォント方式（fetch / 同梱）を確定。

## 12. リスクと未確定事項

1. **next/og × OpenNext 1.18.0 の実動作** — スパイクで先に検証（§2）。
2. **フォント方式（fetch vs 同梱）** — バンドルサイズ実測で確定（§4）。
3. **R2 画像 URL の worker 内 fetch 可否** — サムネ元 URL の到達性を確認（§7）。
4. **GoL セルの要素数** — field を 24px セルで敷くと alive 数だけ `<div>` が出る。Satori
   の描画負荷／要素数上限をスパイクで確認（過大なら密度・field 範囲・セル結合で調整）。
5. **digibop PNG のDPRと配置** — 高解像度で焼き、柱幅に対し過不足ない実寸で配置。

## 13. 完了の定義

- 3 詳細ルートの SNS シェアで動的カードが表示される。
- 画像あり=矩形サムネ合成 / 画像なし=本番 life.ts 共有の GoL 盤面（boost）が正しく分岐。
- 日本語タイトルが BudouX 文節境界で改行。digibop ワードマークが PNG 合成で表示。
- `pnpm lint && pnpm typecheck` green。純関数テスト green。
- difit でレビュー依頼済み。

## Spike 結果 (2026-06-12)

- `next build` 成功、`/news/[id]/opengraph-image` ルートが出力に出現。
- `opennextjs-cloudflare build` 成功。`@vercel/og` の `resvg.wasm` / `yoga.wasm` が
  worker バンドルに同梱されることを確認（`.open-next/server-functions/default/.../@vercel/og/`）。
  致命的エラー無し（payload admin chunk の benign な typeof 警告のみ）。
- 結論: **next/og はこの OpenNext 1.18 スタックで利用可能**。workers-og への転換は不要。
- 訂正: OpenNext 変換は `opennextjs-cloudflare build`（`pnpm preview`/`deploy` 内）。
  `pnpm build` は `next build` のみ。ランタイム PNG 200 確認は `opennextjs-cloudflare preview` で別途。
- フォント方式の最終判断（fetch vs 同梱）は実フォント投入後にバンドルサイズで確定。
