# web: Next.js → Astro 移行 設計

- 日付: 2026-11-13
- 対象: `apps/web`（公開サイト napochaan.com / stg.napochaan.com）
- 対象外: `apps/cms`（Payload は Next.js のまま）

## 意図と理由

公開サイトを Next.js（+ OpenNext）への依存から外す。理由は「Next 依存から抜けたい」——バージョン追従・破壊的変更・OpenNext を挟んだビルドなどのベンダー依存を減らすこと。性能改善や見た目の刷新は目的ではない。

前提として、CMS 分離（PR #68）でデータ取得は Hono RPC（`@napochaan/cms-api`, `CMS` service binding）になり、ISR も既に撤廃済み（全ページ SSR + Workers Cache + CMS publish 時 purge。`.claude/rules/workers-cache.md`）。この構成は Next 固有機能にほぼ依存しないため、Astro SSR に載せ替えられる。

## ゴール

- 全ての公開 URL（ページ・`.md`・RSS・sitemap・robots・llms・OG 画像・preview）が移行前と同じパス・同じ内容・同じ `Cache-Control` で返る
- 既存 React コンポーネント（react-aria-components / Panda CSS）を React 島として流用する
- ページ遷移で SiteShell・ambient backdrop・カーソル共有 WebSocket・boot overlay が今と同様に途切れない
- Cloudflare Workers 上で動き、Hono Worker（cache-control middleware・CursorRoom DO・`purge()` RPC・images handler・cms-health）を維持する
- 既存テスト（vitest browser mode / workers pool）が移行後も通る
- `next`・`@opennextjs/cloudflare`・`next/*` import が web から消える

## 非ゴール

- デザイン・コピーの変更、UI の作り直し
- 性能チューニング（悪化させないことは必要）
- CMS（apps/cms）側の変更。ただし web の `purge()` 受け口や Live Preview の origin が変わる場合の追従は含む
- React 島の `.astro` 化（静的部分を `.astro` にするのは自由だが、必須ではない）

## アンチゴール（動いても失敗とみなすもの）

- URL・canonical・OG・robots の変化による SEO 毀損
- CMS 読み出し失敗のレスポンスが edge にキャッシュされる
- per-request 値（cookie・nonce 等）を含む HTML が cacheable になる
- ページ遷移ごとにカーソル共有が再接続される / backdrop が描き直される / boot overlay が毎回出る
- 移行期間中に本番が壊れる

## 制約

- pnpm / Cloudflare Workers / react-aria-components / Panda CSS / vitest(TDD) / oxlint+oxfmt / tsgo（CLAUDE.md）
- `.claude/rules/*` のコーディング規約（arrow 関数、no barrel、no let、acronym casing 等）
- Link は react-aria-components の `Link` + `RouterProvider`
- 画像は `src/components/image` + `formatBlurURL`
- WCAG 2.1 AA

## 検討したアプローチ

### ページ遷移

| 案 | 内容 | トレードオフ |
| --- | --- | --- |
| **A. ClientRouter + `transition:persist`（採用）** | Astro の `<ClientRouter />` で View Transitions 遷移、shell / backdrop / cursor / overlay の島を `transition:persist` で保持 | 今の体験に最も近い。島の再マウント条件・`astro:page-load` でのスクリプト再初期化に注意が要る |
| B. フルロード MPA | 普通のページ遷移 | 最も単純だが、backdrop 再描画・WebSocket 再接続・overlay 制御が必要で体験が変わる |

ユーザー選択: **A**。

### 進め方

| 案 | 内容 | トレードオフ |
| --- | --- | --- |
| **並行新設（採用）** | `apps/web-astro` を新設し全ルート移植 → staging 検証 → `apps/web` を置換 | 本番はその間 Next のまま。一時的にコードが二重になる |
| その場で置換 | `apps/web` を直接書き換え | 差分は追いやすいが、移行途中に動かない期間が長い |

ユーザー選択: **並行新設**（CMS 分離と同じ流れ）。

### React の扱い

`@astrojs/react` で React 島として残す（ユーザー選択）。可能な限り `.astro` 化 / React 全廃は採らない。

## 決まっていること（ユーザー決定）

1. フレームワークは Astro（SSR, `output: 'server'`）+ `@astrojs/cloudflare` + `@astrojs/react`
2. 遷移は A（ClientRouter + persist）
3. `apps/web-astro` に並行新設 → staging 検証 → 置換
4. 既存 React コンポーネントは島として流用

## 設計（私の判断。ユーザーが修正可能）

### 構成

```
Request
  └─ worker/worker.ts  (WorkerEntrypoint: fetch + purge RPC)   ← 既存を移設
       └─ Hono app (cache-control / path-policy / cms-health / images / cursors)
            └─ Astro handler (@astrojs/cloudflare)              ← .open-next/worker.js の差し替え
```

- Hono Worker 一式（`worker/`）は `apps/web-astro/worker/` にほぼそのまま移す。`handlers/next` を `handlers/astro` に置き換え、Astro アダプタの fetch handler を mount する
- `CursorRoom` DO の export、`[[migrations]]`、`CMS` / `IMAGES` / `ASSETS` binding は wrangler 設定に引き継ぐ（OpenNext 専用の `DOQueueHandler` 等の扱いは既存 migration 履歴を崩さない形で踏襲）
- Worker 名・ルート（`napochaan-website*`）は置換時に引き継ぎ、cms の `WEB` service binding（purge）を変更しなくて済むようにする

### Next 機能の置き換え

| Next | Astro 側 |
| --- | --- |
| App Router（`app/**/page.tsx`） | `src/pages/**/*.astro`。ページの中身は既存 React コンポーネントを島/SSR で描画 |
| `layout.tsx` / Metadata API / `generateMetadata` | `src/layouts/*.astro` + `<Seo>` 相当の astro コンポーネント。既存の metadata 生成ロジックは純関数として流用 |
| `route.ts`（RSS / `.md` / sitemap / robots / llms） | `src/pages/**/*.ts` endpoint |
| `next.config` rewrites（`/blog/:slug.md` 等） | `src/pages/blog/[slug].md.ts` の直接ルートで rewrite 不要 |
| `next.config` redirects（`/logs` → `/log`） | `astro.config` `redirects` |
| `opengraph-image.tsx`（`next/og`） | endpoint + satori 系（例: `workers-og` / satori + resvg-wasm）。既存 `@utils/og` の OgCard を流用 |
| `next/image` | `src/components/image` を `<img srcset>` 生成に置き換え。変換は既存 worker images handler（IMAGES binding）を使い続ける。`/_next/image` パス名を維持するか変えるかは builder 判断（変える場合は cache policy・`formatBlurURL` を同時に更新） |
| `next/font/google` | Astro Fonts API または self-host（@fontsource 等）。unicode-range 分割・Zen Kaku の preload 無効・`TITLE_JP_VAR` 同期テストを維持 |
| `next/navigation`（24 箇所） | `astro:transitions/client` の `navigate` と pathname 取得 hook に置換。`RouterProvider` の navigate も同じ |
| `next/headers`（10 箇所） | `Astro.request` / `Astro.locals`（request origin 等） |
| `next/dynamic` | `React.lazy` または `client:only` / `client:visible` |
| Server Action（contact） | Astro Actions（Turnstile 検証ロジックは流用） |
| `error.tsx` / `global-error.tsx` / not-found | `src/pages/404.astro` / `500.astro` |
| `getCloudflareContext()` | Astro の Cloudflare runtime env。cms-health でラップした `CMS` binding を必ず経由する |
| `@payloadcms/live-preview-react` | preview ページ内の React 島で継続利用。preview ルートは uncacheable |
| SVGR（`@svgr/webpack`） | React 島から使う SVG は vite-plugin-svgr 等 |
| `staleTimes`（Router Cache 対策） | ClientRouter は遷移毎に HTML を取得するため不要。prefetch 設定は控えめにする |

### キャッシュ

`.claude/rules/workers-cache.md` の方針（ページクラス → policy、purge、CMS 失敗時 no-store、path-keyed pagination）をそのまま維持。Astro 側では `force-dynamic` 相当として全ページ `prerender = false`（SSR）を既定にする。

### 遷移時の保持

- SiteShell 内の backdrop・cursor presence・boot overlay・motion provider を `transition:persist` 付きの島にする
- `<head>` の typekit / motion boot インラインスクリプトは初回のみ実行され、遷移時に二重実行されないこと
- ClientRouter の遷移とスクロール挙動（現 `data-scroll-behavior="smooth"` の意図: 遷移時は先頭へ即ジャンプ）を合わせる
- `prefers-reduced-motion` 時の View Transition アニメーションは無効

### テスト

- 既存 vitest（browser mode / workers pool）を移設し、Next mock（`src/__mocks__`）は Astro 版に差し替え
- 新規: URL 一覧に対するスナップショット的な parity チェック（Next 版 staging と Astro 版の status / content-type / Cache-Control / 主要 meta を比較するスクリプト）
- Astro コンポーネントのレンダリングは Container API でテスト

### 移行手順（大枠）

1. `apps/web-astro` scaffold、worker 移設、1 ページ（例: `/colophon` 以外の静的寄りページ）で end-to-end 疎通
2. 共通 layout / shell / 遷移保持
3. ルート群を順次移植（home → blog → news → works → gallery → log → about → contact → colophon → feeds/.md/OG/sitemap 等）
4. preview + Live Preview
5. parity チェック、staging デプロイ・検証
6. 置換: `apps/web` を削除し `apps/web-astro` を `apps/web` にリネーム、CI/deploy・CLAUDE.md・`.claude/rules`（next/opennext/ISR 記述、images.md、workers-cache.md、payload-cms.md 等）・skills を更新
7. 本番デプロイ・cache warm・検証

## builder に任せること

- Astro / アダプタ / 各ライブラリのバージョン選定（調査のうえ最新安定版）
- OG 画像ライブラリ、フォント配信方式の具体選定
- 画像変換パス名の維持/変更
- 各ページで静的部分を `.astro` に寄せるかどうか
- タスク分割の粒度
