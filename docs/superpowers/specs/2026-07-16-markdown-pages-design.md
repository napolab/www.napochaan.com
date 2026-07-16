# Markdown Pages (`.md` URL) — Design

日付: 2026-07-16
ブランチ: `worktree-feat-markdown-pages`

## 目的

コンテンツページの URL に `.md` を付けると、そのページの内容を markdown（`text/markdown; charset=utf-8`）で返す。LLM・CLI ツール・人間が機械可読な形でコンテンツを取得できるようにする。

## 対象 URL（8本）

| URL               | 実装ファイル                              | 方式         |
| ----------------- | ----------------------------------------- | ------------ |
| `/about.md`       | `src/app/(site)/about.md/route.ts`        | リテラル dir |
| `/blog.md`        | `src/app/(site)/blog.md/route.ts`         | リテラル dir |
| `/news.md`        | `src/app/(site)/news.md/route.ts`         | リテラル dir |
| `/log.md`         | `src/app/(site)/log.md/route.ts`          | リテラル dir |
| `/works.md`       | `src/app/(site)/works.md/route.ts`        | リテラル dir |
| `/blog/:slug.md`  | `src/app/(site)/blog/[slug]/md/route.ts`  | rewrite      |
| `/news/:slug.md`  | `src/app/(site)/news/[slug]/md/route.ts`  | rewrite      |
| `/works/:slug.md` | `src/app/(site)/works/[slug]/md/route.ts` | rewrite      |

- `/log` は詳細ページを持たないため、log のエントリは `/log.md` の年表リスト内で完結する。
- `/contact` `/gallery` `/colophon` は対象外。

## ルーティング

- 静的 5 URL は `llms.txt` / `llms-full.txt` と同じ「ドットを含むリテラルディレクトリ + route.ts」パターン。rewrite 不要。
- Next.js は部分 dynamic segment（`[slug].md` というディレクトリ名）を許さないため、動的 3 URL のみ `next.config.ts` に明示的 rewrite を追加する:

```ts
rewrites: async () => [
  { source: '/blog/:slug.md', destination: '/blog/:slug/md' },
  { source: '/news/:slug.md', destination: '/news/:slug/md' },
  { source: '/works/:slug.md', destination: '/works/:slug/md' },
],
```

- `:slug` は必ず 1 セグメントを持つため、OpenNext の「`:path*` がゼロセグメントのとき destination のプレースホルダが未展開のまま残る」既知バグ（`next.config.ts` の redirects コメント参照）は該当しない。catch-all rewrite（`/:path*.md`）はこのバグを踏むため採用しない。
- middleware 一括 rewrite 案は、middleware 新設コストと OpenNext 検証コストから見送り。
- rewrite 先の `/blog/:slug/md` も実 URL として直接アクセス可能になるが、同一内容を返すだけなので許容する。

## データフロー

route handler は `llms-full.txt/route.ts` と同じ形:

1. `export const dynamic = 'force-dynamic'`（BASE_URL とコンテンツをランタイム解決）
2. 既存のデータ取得をそのまま利用（`unstable_cache` + revalidateTag が効く）:
   - blog: `findBlogList` / `findBlogBySlug`
   - news: `findNewsList` / `findNewsBySlug`
   - works: `findWorksList` / `findWorkBySlug`
   - about: `findProfile`
   - log: `/log` ページと同じ timeline 組み立て（manual items + 外部 feed）
3. ドメイン型を markdown ビルダー（純関数）に渡し `Response` を返す
4. ヘッダ: `content-type: text/markdown; charset=utf-8`

## Lexical → Markdown コンバータ

新規 `src/utils/lexical/to-markdown/`（TDD・純関数）:

```ts
lexicalToMarkdown(state: SerializedEditorState | undefined, opts: { baseUrl: string }): string
```

- 対応ノードは JSX converter（`src/components/rich-text/converters/`）の `NodeTypes` union をミラーする:
  - paragraph / heading(h1–h6) / text（format bitmask: bold `**`・italic `*`・inline code `` ` ``・strikethrough `~~`）
  - link（内部リンクは `baseUrl` で絶対 URL 化）
  - list（ordered / unordered / ネスト対応）
  - quote / code block / table / hr / linebreak
  - upload → `![alt](絶対URL)`
  - カスタムブロック `image-row` → セルごとに `![caption](絶対URL)` を並べる
- 未知ノードは無視して例外を投げない（JSX converter と同じ防御方針）。
- 新しいカスタムブロックを追加するときは `converters/types.ts` の union と同時にこのコンバータも広げる旨をコメントに明記する。

## ビルダー（純関数・コロケーション）

- 詳細: `src/app/(site)/blog/_lib/build-post-md/`、news / works も各セクションの `_lib` に同名パターンで配置
- 一覧: 各セクション `_lib` に一覧用ビルダーを配置（`blog.md` などの route と対）
- 共有: `src/utils/markdown/frontmatter/` — `---` 囲み YAML を生成。値のエスケープ（`"` 囲み・改行除去）を持つ

### frontmatter（詳細 .md のみ）

共通: `title` / `date` / `url`。セクション追加分:

| セクション | 追加フィールド       |
| ---------- | -------------------- |
| blog       | `excerpt`, `readMin` |
| news       | `category`           |
| works      | `type`, `year`       |

### 一覧 .md の形

frontmatter なし。`# 見出し` + エントリのリスト。各エントリは日付・タイトル（詳細 .md への markdown リンク `[title](<baseUrl>/blog/<slug>.md)`）・概要 1 行。log は年表をそのまま md リスト化し、外部 feed 由来のエントリは外部 URL へリンクする。

### about.md の形

frontmatter（`title` / `url`）+ プロフィール（name / aka / now / team / tagline）+ bio / philosophy を `lexicalToMarkdown` で本文化。

## 導線（discoverability）

対象 8 ページ（HTML 側）の `generateMetadata` に以下を追加:

```ts
alternates: { types: { 'text/markdown': '<対応する .md の URL>' } }
```

`<link rel="alternate" type="text/markdown" href="...">` が head に出る。UI 上の可視リンクは追加しない。

## エラー処理

- 詳細ルート: slug 不一致（未公開含む）は `404` / `text/plain` の `Not Found`
- body が無い記事: frontmatter + excerpt のみ返す
- log の外部 feed 取得失敗: 既存 `/log` ページと同じ挙動（該当エントリなしで続行）

## テスト

- `lexicalToMarkdown`・各ビルダー・frontmatter ヘルパ: vitest unit（`.test.ts`）で TDD。ノード種別ごと・エスケープ・ネストリスト・画像絶対 URL 化を網羅
- route handler は薄い合成に留め、ロジックはビルダー側でテストする
- 仕上げ: `pnpm lint && pnpm typecheck`、`pnpm build` → `pnpm exec next start -p 3001` で全 8 URL + rewrite 経路を curl 検証（`content-type` と本文先頭を確認）
- 既存テストのグリーン維持（ベースライン: 886 passed / 1 skipped）

## 決定事項まとめ

- スコープ: works を含む 8 URL（ユーザー確認済み）
- 変換品質: 完全な markdown（独自コンバータ、公式 `convertLexicalToMarkdown` は不採用 — editor config 依存とカスタムブロック登録コストのため）
- 一覧: リスト + 詳細 .md へのリンク（全文埋め込みはしない）
- frontmatter: 詳細のみ付与
- 導線: `link rel="alternate"` のみ
