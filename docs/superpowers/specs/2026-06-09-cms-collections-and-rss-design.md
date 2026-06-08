# CMS コレクション化 + 全動的ページ RSS — 設計

- **日付**: 2026-06-09
- **ブランチ**: `feat/cms-collections`（worktree: `.worktrees/cms-collections`、`main` から分岐 / リモート無し）
- **目的**: `works` / `blog` / `gallery` / `logs` を Payload CMS コレクション化、`about` を Payload global 化し、各ページの `sample-*` データ駆動を Payload 駆動に置き換える。あわせて CMS 連携・動的ページ全て（`blog` / `works` / `log` / `gallery`）に RSS フィードを付与する。

## 背景 / 現状

各ページは現在ローカルの sample データで動いている:

| ページ | 現状のデータ源 | 詳細ルート |
|---|---|---|
| `/works` | `works/sample-works.ts`（`WorkRow[]`） | `/works/[id]` 有 |
| `/blog` | `blog/sample-posts.ts`（`Post[]`） | `/blog/[id]` 有 |
| `/gallery` | `gallery/sample-gallery.ts`（`GalleryPhoto[]`） | なし |
| `/log` | **派生ビュー** = `findNewsList()`(Payload) + `works`(sample) + 外部RSS記事 を `buildLogTimeline` で合成 | なし |
| `/about` | `about/profile.ts`（`as const` オブジェクト。コメントに「Payload global に置換」と明記） | なし |

確立済みの基盤（`news` コレクションで実証済み）をそのまま横展開する:

- **クエリヘルパ**: `lib/payload/<slug>/index.ts` — `unstable_cache` + build-phase guard + `_status: published` フィルタ。
- **マッパー**: `lib/payload/<slug>/to-X-item/` — Payload doc → ページ用ドメイン型 の純粋関数（colocation + test）。
- **再検証フック**: `collections/hooks/revalidate` の `createPublishedTagRevalidateHooks([tag])`（draft 有コレクション用）。
- **キャッシュタグ**: `utils/cache-tags` の `CACHE_TAGS` に slug を追加。
- **RSS**: `utils/rss/create-rss-document` + `news/rss.xml/route.ts` の型を踏襲。

## 確定した要件（ステークホルダー回答済み）

1. **about** → コレクションではなく **Payload global**（`profile`）。
2. **blog** → **CMS 完結（自前記事）**。`source` はクロス投稿先タグ表示用。外部RSS取り込み（`fetchExternalPosts`）は **log 専用のまま据え置き**、blog ページには出さない。
3. **log** → **派生ビューのまま**。加えて `logs` コレクション（手動年表エントリ）を新設し、`buildLogTimeline` にマージ。
4. **works / gallery の画像** → 既存 `media`（upload, R2）コレクションへの **relationship**。
5. **works.type** select 値（value=英語 / label=日本語）: `graphic`/`vj`/`flyer`/`dev`/`video`/`vrchat`/`talk`(登壇)/`support`(サポート)。
6. **RSS** → `blog` / `works` / `log` / `gallery` 全てに付与。gallery は `<enclosure>` 付き画像フィード。
7. **blog.readMin** → CMS には保存せず、read 時に `to-blog-post` マッパーで `readingMinutes(body)` から導出。
8. **進め方** → 本 spec に一本化 → `writing-plans` でフェーズ分割して一気に実装。sample の現行コンテンツは migration の `payload.create()` で seed（payload-cms.md 準拠、データ消失なし）。

## コレクション / global スキーマ

すべての公開コレクションは `versions.drafts.autosave`（`news` と同じ `interval: 375`）、`access`（admin 全件 / public は published のみ）、日本語 `labels`・field `label`、`admin.useAsTitle` を持つ。

### 1. `works`（slug: `works`, draft 有）

| field | type | 必須 | 備考 |
|---|---|---|---|
| `title` | text | ✓ | `useAsTitle` |
| `no` | text | | 表示序数 '01'。未設定なら read 時に並び順から導出 |
| `type` | select | ✓ | 上記8値。sidebar |
| `year` | number | ✓ | 年精度。sidebar |
| `url` | text | | 外部アーカイブ。あれば log / 詳細リンクが外部を指す |
| `thumbnail` | relationship → `media` | | 一覧サムネ。width/height は media が保持 |
| `description` | textarea | | 一覧の短文 |
| `body` | richText | | `/works/[id]` 本文 |

- ドメイン型: 既存 `WorkRow`（`works/_lib/work-row`）。`thumbnail` は `{ src, width, height }` に変換。
- マッパー `to-work-item`: media doc から `src/width/height` を取り出す（`media` relationship を depth 1 で取得、または id→媒体解決）。
- 消費: `/works`、`/works/[id]`、home `works-section`、log timeline。

### 2. `blog`（slug: `blog`, draft 有）

| field | type | 必須 | 備考 |
|---|---|---|---|
| `title` | text | ✓ | `useAsTitle` |
| `source` | select | ✓ | `zenn` / `sizu`（しずか）。sidebar |
| `publishedAt` | date | ✓ | sidebar, dayOnly |
| `excerpt` | textarea | ✓ | 一覧 / teaser |
| `body` | richText | ✓ | `/blog/[id]` 本文 |

- ドメイン型: 既存 `Post`（`blog/_lib/post`）。`index`（'01' 序数）は read 時に並び順から導出、`readMin` は `readingMinutes(body のプレーンテキスト)` で導出。
- 消費: `/blog`、`/blog/[id]`、home `blog-index`。外部RSS は混ぜない。

### 3. `gallery`（slug: `gallery`, draft 有）

| field | type | 必須 | 備考 |
|---|---|---|---|
| `image` | relationship → `media` | ✓ | width/height/alt を media から取得 |
| `caption` | text | | 'flyer / 05.23' 等 |
| `alt` | text | | media.alt を上書きする時のみ。基本は media 側を使用 |
| `order` | number | | masonry 並び順（昇順）。sidebar |

- ドメイン型: 既存 `GalleryPhoto`（`@components/gallery-archive`）。
- マッパー `to-gallery-photo`: `alt` は `gallery.alt ?? media.alt ?? ''`、`src/width/height` は media。
- 消費: `/gallery`、home `gallery-section`。

### 4. `logs`（slug: `logs`, draft 有 — 手動年表エントリ）

派生 timeline にマージする手動エントリ。news / works / 外部記事に乗らない出来事用。

| field | type | 必須 | 備考 |
|---|---|---|---|
| `title` | text | ✓ | `useAsTitle` |
| `date` | date | ✓ | 月日精度。sidebar |
| `meta` | text | ✓ | timeline の meta ラベル（例 'milestone'） |
| `url` | text | | あればタイトルがリンク化 |

- `buildLogTimeline` を拡張: 第4引数 `logs: readonly LogManualItem[]` を追加し `toLogManualEntry` を足す。**既存の news / works / posts マージ挙動は不変**（純粋関数のまま、テスト追加）。
- `/log` ページで `findLogList()` を呼び `buildLogTimeline(news, works, posts, now, logs)` に渡す。

### 5. `about` → Payload **global** `profile`（draft 有）

`buildConfig` に `globals: [Profile]` を追加。`collections` には入れない。

| field | type | 備考 |
|---|---|---|
| `name` / `aka` / `now` / `team` / `tagline` | text | |
| `bio` | richText | |
| `philosophy` | richText | |
| `love` | array(`{ value: text }`) | ジャンルタグ |
| `skillGroups` | array(`{ category: text, items: array<{ value: text }> }`) | |
| `contacts` | array(`{ label: text, handle: text, href: text }`) | |

- ドメイン型: `about/profile.ts` の `profile` 形を踏襲した `Profile` 型を `lib/payload/profile` に定義。
- クエリヘルパ `findProfile()`: `payload.findGlobal({ slug: 'profile' })` を `unstable_cache`(tag=`profile`) + build-phase guard でラップ。
- global の再検証: `Profile` の `hooks.afterChange` で `revalidateTag('profile')` + `revalidatePath('/about')`。
- 消費: `/about`。

## RSS フィード

`utils/rss/create-rss-document` + `news/rss.xml` の型を踏襲し、各動的ページに `rss.xml/route.ts`（`export const revalidate = 3600`）を追加。各ルートは対応する `unstable_cache` タグを読むので、コレクションフックの `revalidateTag` で自動 bust される。

| ルート | item | enclosure |
|---|---|---|
| `/blog/rss.xml` | title / link=`/blog/{id}` / description=excerpt / pubDate=publishedAt | なし |
| `/works/rss.xml` | title / link=`url ?? /works/{id}` / description / pubDate≈year | なし |
| `/log/rss.xml` | 合成 timeline 各 entry（title / link=href / pubDate=date） | なし |
| `/gallery/rss.xml` | title=caption/alt / link=`/gallery` / pubDate≈order or createdAt | `<enclosure url=image>` |

- 各ページの `<head>`（該当 `page.tsx` の `metadata.alternates.types` もしくは `generateMetadata`）に `application/rss+xml` の self link を追加し自動 discovery 対応。
- `utils/rss/types` の `ItemData` に enclosure が無ければ optional フィールドを追加し、`create-rss-document` を後方互換で拡張（既存 `news` フィードは出力不変）。

## payload.config.ts 登録（漏れ防止チェックリスト）

payload-cms.md のチェックリストに従う:

1. `collections: [Users, Media, News, Works, Blog, Gallery, Logs]`
2. `globals: [Profile]` を追加
3. `seoPlugin({ collections: ['news', 'works', 'blog', 'gallery', 'logs'] })`
4. `admin.livePreview.collections` + URL ビルダに `works`/`blog`/`gallery`/`logs` の detail URL を追加（gallery/logs は一覧 or detail が無いものは base へ）
5. `pnpm payload migrate:create cms_collections` → `pnpm payload migrate`
6. `pnpm payload generate:importmap`
7. `pnpm payload generate:types`

## Seed（migration 内）

payload-cms.md ルール: raw SQL 禁止、`payload.create()` を使用（drafts 版テーブルも書く）。冪等化のため挿入前に既存チェック。

- `sample-works` / `sample-posts` / `sample-gallery` / `about/profile` の現行コンテンツを migration の `up()` で `payload.create()`（gallery/works の画像は既存 `media` への seed が要るので、media seed → 参照解決の順）。
- `logs` は手動エントリ用なので seed は最小（または空）。

## ビルド順（フェーズ — 各フェーズで lint+typecheck、各コレクション完了で difit review）

1. **共有基盤**: `CACHE_TAGS` 拡張、RSS util の enclosure 対応拡張（後方互換）。
2. **works**: collection + helper + mapper(test) + page 差し替え + detail。
3. **blog**: 同上（readMin/index 導出）。
4. **gallery**: 同上（media alt フォールバック）。
5. **logs + timeline 統合**: collection + helper + `buildLogTimeline` 拡張(test) + `/log` 配線。
6. **about (global)**: Profile global + helper + `/about` 配線。
7. **RSS 一式**: blog/works/log/gallery の `rss.xml` + 各ページ alternate link。
8. **登録 + migration + seed**: config 登録 → migrate:create/migrate → importmap → types → seed migration。

各コレクションは互いに独立（共通パターンの反復）なので段階レビュー可能。

## TDD / 設計方針

- マッパー（`to-X-item`）と `buildLogTimeline` 拡張は純粋関数 → vitest で先にテスト（Red→Green→Refactor）。
- 関数は単一責任・arrow function・early return・`const` のみ（プロジェクト rules 準拠）。
- 入力型は `T?`（`null` は boundary で `?? undefined` 吸収）。Payload 生成型は編集せず消費側で吸収。

## 非対象（YAGNI）

- 外部RSS取り込みの blog への統合（log 専用のまま）。
- works/blog の全文検索・タグフィルタ UI。
- colophon への新規コンポーネント追加（既存 archive 系を流用、新規 UI コンポーネントは作らない想定）。
- 本番 D1 への migration 適用（`pnpm deploy:database:production`）はレビュー後に本人が実施。

## リスク / 注意

- **画像 seed**: works/gallery は `media` relationship。sample は `@assets/*.jpg` 静的 import。seed では対応する media レコードを先に作る必要がある（R2 アップロード or 既存 media 参照）。フェーズ8で要検討。
- **`jpg ambient module` の罠**（メモリ参照）: 画像パスミスは typecheck を通る。ファイル移動時は実ビルドで確認。
- **livePreview**: gallery/logs は単独 detail ページが無いので preview URL は一覧 or base に倒す。
