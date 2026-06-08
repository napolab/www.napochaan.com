# Payload CMS 統合 — News 縦スライス (blueprint)

Branch: `feat/payload-news` · Session: 2026-06-09

## 確定した方針 (AskUserQuestion)

1. **対象範囲**: News のみ end-to-end (collection → migration → seed → page 配線 → revalidation)。Works/Blog は後続セッションで同パターンを横展開。
2. **seed**: 既存 `sample-news.ts` の実コンテンツを bin seed (`src/seed.ts`) に移行。移行後 `sample-news.ts` は削除。
3. **URL**: 数値 Payload id のまま `/news/[id]`。SEO は seoPlugin に委譲（人間可読 slug は導入しない）。
4. **draft 対応**: drafts + Live Preview + SEO plugin（payload-cms.md の public-facing collection パターン準拠）。
5. **build 戦略**: データ層が `NEXT_PHASE==='phase-production-build'` を検知したら `[]` を返す。全ページ static ISR (`revalidate=3600`) を維持。runtime の初回 revalidate + collection の `afterChange` hook (`revalidatePath`) で実データを埋める。

## アーキテクチャ上の要点

- **build 中は D1 stub**（`payload.config.ts` L54-60、miniflare deadlock 回避）。→ build prerender される `/` と `/log` が Payload を読むと stub D1 で throw。→ データ層の build-phase guard が必須。Works/Blog もこの contract を踏襲。
- **local Payload API は access 制御を bypass** (`overrideAccess` 既定 true)。→ 公開サイト用クエリは明示的に `where: { _status: { equals: 'published' } }` で絞る。
- **id は Payload 由来**。home の `href:'/news/1'` ハードコードは廃止し `item.url ?? '/news/${item.id}'` で導出。

## News consumer surface (4 つ)

| 消費者                    | 種別                   | 変更                                                                                                           |
| ------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/news` (`news/page.tsx`) | dynamic (searchParams) | `findNewsList()` を await                                                                                      |
| `/news/[id]`              | static → on-demand ISR | `generateStaticParams=()=>[]` + `dynamicParams=true`、`findNewsById` / `findNewsList`、`<RefreshRouteOnSave/>` |
| `/log` (`log/page.tsx`)   | static ISR (paramless) | async 化、news を `findNewsList()`。works は当面 sample-works のまま                                           |
| home `/` (`page.tsx`)     | static ISR (paramless) | async 化、`findLatestNews(3)` → NewsSection items にマップ                                                     |

## 実装ファイル

### A. `src/collections/news.ts`

- slug `news`, labels 日本語, useAsTitle `title`
- `versions: { drafts: true }`
- access: user!==null は全件 / 非ログインは `_status=published` 制約
- fields: `title`(text,req), `publishedAt`(date,req,sidebar,dayOnly), `category`(select req: site/live/release/blog, sidebar), `url`(text,opt,説明), `body`(richText)
- hooks `afterChange`/`afterDelete` → `revalidatePath('/')`, `'/news'`, `'/log'`, `/news/${doc.id}`

### B. `src/payload.config.ts`

- `collections: [Users, Media, News, Pages]`
- seoPlugin `collections: ['pages', 'news']`
- `admin.livePreview`: url で news→`${base}/news/${data.id}`、`collections:['news']`

### C. `src/components/live-preview/index.tsx`

- `'use client'` + `RefreshRouteOnSave` from `@payloadcms/live-preview-react`（`router.refresh()`）

### D. データ層 `src/lib/payload/`

- `client/index.ts`: `getPayloadClient()` = `getPayload({ config })` をモジュールキャッシュ（`@payload-config`）
- `news/index.ts`:
  - build guard: `const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'`
  - `toNewsItem(doc): NewsItem` — `id:'${doc.id}'`, `date: dayjs(doc.publishedAt).tz('Asia/Tokyo').format('YYYY-MM-DD')`, `url: doc.url ?? undefined`, `body: doc.body ?? undefined`（null→undefined coerce）
  - `findNewsList()`: published を publishedAt desc 全件
  - `findNewsById(id)`: 1 件 or undefined
  - `findLatestNews(limit)`: published desc limit
  - すべて build guard で `[]`/`undefined`
- colocated test: `news/news.test.ts` で `toNewsItem`（null coerce）、build guard、href 導出

### E. seed `src/seed.ts` + `src/seed/news-data.ts`

- `news-data.ts`: sample-news.ts の内容を `{ publishedAt, category, title, url?, paragraphs }[]` として保持
- `ensureNews(payload)`: 冪等（`find limit:1` で空時のみ）、`payload.create({collection:'news', data:{..., body: richTextFromParagraphs(paragraphs), _status:'published'}})`

### F. 削除 / 配線替え

- `src/app/(site)/news/sample-news.ts` 削除
- importer 4 箇所をデータ層に切替（上表）
- home NewsSection items: `{ id, date, category, title, href: url ?? '/news/${id}' }`

## CLI 手順（コード確定後）

```
PAYLOAD_SECRET=dev-secret-change-me-in-production pnpm payload:migrate:create initial
PAYLOAD_SECRET=… pnpm payload:migrate
PAYLOAD_SECRET=… pnpm payload:generate-importmap
PAYLOAD_SECRET=… pnpm payload generate:types
PAYLOAD_SECRET=… pnpm payload:seed
```

（migrations/ も payload-types.ts も初回スナップショット。初回 migrate:create は全 collection を含む）

## 検証

- `pnpm lint && pnpm typecheck` green
- `pnpm dev` で `/news`, `/news/1`, `/log`, `/` が seed データを表示
- admin で news 編集 → `afterChange` で `/` などが revalidate
- 最後に difit で review 依頼
