# Per-page layout + fine-grained Suspense plan

## Goal

各ページに layout.tsx を持たせ、layout が静的な chrome（`<main>` ランドマーク・header / breadcrumbs / feed-link）を即時描画し、データ依存セクションはそれぞれ独立した `<Suspense>` で streaming する。loading はページ全体ではなくセクション局所で出す。

## 決定事項（user 確認済み）

1. 全ページ統一（home/about/colophon/contact/gallery を layout 化、blog/news/works/log も header を layout へ移動 + セクション単位 Suspense）
2. loading 表示は既存ブランド `DecodingSkeleton` を流用（セクション高さに合わせ `rows` 調整、`fill` 併用）
3. home は `(home)` ルートグループを導入して専用 layout を持たせる（URL は `/` のまま）

## アーキテクチャ・パターン

- layout = `<main id="main-content">` + 静的 chrome のみ（await しない → 即描画）
- page = 静的部分を直接描画 + データセクションを `<Suspense fallback={<DecodingSkeleton .../>}>` で包む
- 各データセクションは「自分のデータを fetch する async server component」に分離。データ層は全て `unstable_cache` 済みなので複数セクションが同じ fetch を呼んでも dedupe される。
- 既存の全画面 `loading.tsx` は削除し、in-page Suspense に置き換える（局所 loading）。
- error 分離は既存どおり route-level `error.tsx` に委ねる（react-error-boundary は導入しない）。

## ページ別

### home → `(site)/(home)/`（ルートグループ）

- `(home)/layout.tsx`: `<main>` + srOnly `<h1>`
- `(home)/page.tsx`: `<Hero/>`（静的）+ `<AboutWhoami/>`（静的サンプルデータ・Suspense 不要）+ 各セクションを Suspense 化
  - news / works / log / gallery / blog の 5 セクションをそれぞれ async loader 化（findLatestNews / findWorksList / buildLogTimeline 系 / findGalleryList / findBlogList）
- `(site)/styles.css.ts` の consumer を grep し、home 専用なら `(home)/styles.css.ts` へ移設。
- `(site)/page.tsx` は `(home)/page.tsx` へ移動。

### about → `about/layout.tsx`

- layout: `<main>` + `Breadcrumbs`
- page: profile 依存本文（masthead + 各 section）を 1 つの Suspense（profile は単一 fetch なので 1 境界で十分）。AboutView から `<main>`/breadcrumbs を外し async content 化、`findProfile` → notFound。

### colophon → `colophon/layout.tsx`

- layout: `<main>` + `PageHeader`
- page: 静的 4 セクション（async 無し → Suspense 不要）

### contact → `contact/layout.tsx`

- layout: `<main>` + `PageHeader`
- page: message/form セクション（env fetch 依存）を Suspense 化、direct(ContactList) は静的

### gallery → `gallery/layout.tsx`

- layout: `<main>` + `PageHeader` + `FeedLink`
- page: `GalleryArchive`（findGalleryList 依存）を Suspense 化（DecodingSkeleton fill）

### blog / news / works → `(index)/layout.tsx` を新設

- 共有 `blog/layout.tsx` 等は header-less のまま（list header が detail へ漏れないよう `(index)` スコープに置く）
- `(index)/layout.tsx`: list の `PageHeader` + `FeedLink`
- `(index)/page.tsx`: searchParams を読み、list+pagination を async セクション化して Suspense
- 既存 `(index)/loading.tsx` を削除

### log → 既存 `log/layout.tsx`（main + header）はそのまま

- `log/page.tsx`: `LogTimeline` を Suspense 化
- 既存 `log/loading.tsx` を削除

## 検証

- `pnpm lint && pnpm typecheck`
- 影響する vitest を実行
- 1 main / 1 h1 / heading 階層を維持（semantic-html ルール）
