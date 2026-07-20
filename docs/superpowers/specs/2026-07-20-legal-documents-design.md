# 法務文書ページ (`/legal`) 設計

- 日付: 2026-07-20
- 対象: ソフトウェア販売に伴う利用規約・免責事項の公開場所
- ベース: `main`(PR #5 `feat/software-release-download` には依存しない)

## 背景と目的

ソフトウェアを販売するにあたり、利用規約と免責事項に**安定した公開 URL** が必要になった。
外部の販売プラットフォーム(BOOTH 等)の商品ページから「利用規約はこちら」とリンクできる
場所を用意することが主目的。

PR #5 の `software` collection は既に `terms` (richText) フィールドを持つが、これは
ダウンロードダイアログ内にスクロール表示されるだけで公開 URL を持たない。本設計は
その欠けているピースを埋める。

### 参照元

| 参照元                                          | 状態                  |
| ----------------------------------------------- | --------------------- |
| 外部の販売ページ                                | 本 PR で対応          |
| サイト内のソフト詳細ページ (`/software/{slug}`) | PR #5 マージ後に別 PR |
| サイト全体のフッター                            | 対象外                |

### 文書セット

- ソフトウェア利用規約 (`terms`)
- 免責事項 (`disclaimer`)

プライバシーポリシーと特定商取引法に基づく表記は今回のスコープ外。collection は slug 自由入力
なので、必要になった時点で追加入稿するだけで済む。

### 文書の粒度

「共通文書 + ソフト固有の追記」型を採る。共通の利用規約・免責事項を `/legal` に 1 つずつ持ち、
個別の特約があるソフトだけ `software` 側に追記する(追記側は PR #5 マージ後の別 PR)。
共通条項の改訂が 1 箇所で済むことを優先した。

## スコープ

### 含む

- `legal-documents` collection の新設
- `/legal/[slug]` 詳細ページ (ISR)
- MCP からの入稿(専用 tool 4 つ)
- seed export / import 配線

### 含まない

- `/legal` 一覧ページ(文書 2 件、サイト内導線なしのため不要)
- フッターへのリンク
- `software` collection との連携(PR #5 マージ後の別 PR)
- 旧版の公開(施行日 1 行のみ表示、後述)

## データモデル

`src/collections/legal-documents.ts`

```ts
slug: 'legal-documents'
labels: { singular: '法務文書', plural: '法務文書' }

fields:
  slugField()                       // 'terms' | 'disclaimer' | 追加可
  title        text      required   // 「ソフトウェア利用規約」
  effectiveAt  date      required   // 施行日 (sidebar, dayOnly)
  body         richText  required   // 本文

access.read:   ログイン中は全件 / 公開側は _status = published のみ
versions:      { drafts: true }
hooks:         createPublishedTagAndPathRevalidateHooks(
                 [CACHE_TAGS.legalDocuments], [], slug => `/legal/${slug}`)
```

既存 collection(news / works / blog)と同じ骨格に揃える。以下 3 点のみ意図的に判断している。

### slug は select ではなく自由入力

`terms` / `disclaimer` の 2 件しか作らない前提だが、select にすると文書を増やすたびに
migration が必要になる。既存の全 collection と同じ `slugField()` を使う。

### autosave を付けない

news / blog は Live Preview のために `autosave: { interval: 375 }` を入れているが、
法務文書は書きながら見た目を確認する類のものではない。素の `drafts: true` にして、
下書きで改訂を用意 → 施行日に publish、という運用にする。

### `effectiveAt` は publish 日と別フィールド

Payload の `createdAt` / `updatedAt` を施行日に流用しない。「11/10 に文面を直したが
施行は 12/1」が普通に起きるため、独立したフィールドとして持たせる。

### 改訂の見せ方

公開ページに出すのは**施行日 1 行のみ**。旧版の本文は公開しない(改訂履歴は Payload の
versions に残る)。個人のソフト販売規模では十分と判断した。

将来、購入者が「同意した時点の版」を参照する必要が出た場合は、collection を
「文書」+「版」の 2 階層に分割して `/legal/terms/2026-08-01` のような固定 URL を発行する
拡張が考えられる。現時点では YAGNI。

## ルートと画面

```
src/app/(site)/legal/[slug]/page.tsx      ISR (revalidate = 3600)
src/app/(site)/legal/[slug]/styles.css.ts
src/lib/payload/legal-documents/index.ts  findLegalDocumentBySlug(slug)
```

`generateStaticParams` は空配列 + `dynamicParams = true`(build 時に Payload を読めないため)。
文書が無ければ `notFound()`。news 詳細ページと同じ形。

```
┌──────────────────────────────────────────────┐
│  PageHeader                                  │
│    breadcrumbs  home / ソフトウェア利用規約   │
│    title        ソフトウェア利用規約          │
│    titleTracking="tight"                     │
├──────────────────────────────────────────────┤
│  <article>                                   │
│    <RichText data={doc.body} />              │
│                                              │
│    <footer>                                  │
│      <time dateTime="2026-08-01">            │
│        2026年8月1日 施行                      │
│      </time>                                 │
│    </footer>                                 │
│  </article>                                  │
└──────────────────────────────────────────────┘
```

`effectiveAt` はページの footer ではなく `<article>` 内の `<footer>` に置く。
「この文書の発効時点」という文書メタ情報なので、article に属するのが意味的に正しい。

`titleTracking="tight"` は長い日本語タイトル用の variant(works / news 詳細と同じ性格の文字列)。

### breadcrumbs は 2 階層

`home / ソフトウェア利用規約` とし、中間に `legal` クラムを置かない。`/legal` 一覧ページを
作らないため、中間クラムを置くと存在しないページへのリンクになる。

なお `Breadcrumbs` の `Item.href` は型上 optional だが、実装は最後以外のクラムを必ず
`<Link href={item.href}>` で描画する(`src/components/breadcrumbs/index.tsx`)。
href なしの中間クラムは実質サポートされていない。本 PR ではこの不一致に手を入れず、
2 階層にすることで回避する。

### richText の editor features

`payload.config` の global editor(`blogEditorFeatures` = code / image-row / youtube-embed
ブロック入り)を**そのまま継承する**。法務文書だけ features を絞る案も検討したが、他の
richText と挙動を揃える方を優先した。

この判断の帰結として、legal 本文に media 参照が埋まりうるため seed 配線が必須になる(後述)。

### noindex

`generateMetadata` の返り値に `robots: { index: false, follow: true }` を入れる。
`follow: true` にしているのは、本文中の内部リンク(将来 software 詳細へ張る想定)の
クロールまで止める必要がないため。

あわせて以下にも legal を**意図的に追加しない**:

- `src/app/sitemap.ts`
- `src/app/llms.txt` / `src/app/llms-full.txt`

新規ルートなので「何もしなければ載らない」が、暗黙に頼ると後から「全ページ載せるべき」と
考えて足されてしまう。意図的な除外であることをここに明記する。

トレードオフ: noindex により、購入者が「napochaan 利用規約」で検索してもたどり着けない。
**外部販売ページ側のリンクが唯一の入口**になる。

## MCP tools

`src/lib/mcp/tools/` を 3 つに分割する。

```
src/lib/mcp/tools/
  blog/index.ts     ← 既存 928 行をそのまま移設(中身は変更しない)
  legal/index.ts    ← 新規
  shared/index.ts   ← 両者が使う payload 取得・エラー整形
```

既存 blog の 8 tools(`list_posts` / `list_media` / `get_post` / `upload_media` /
`create_upload_url` / `create_post` / `update_post` / `publish_post`)は**ファイル移動のみ**で
中身を変更しない。移動と変更を混ぜると回帰の切り分けが効かなくなるため。

markdown 変換パイプライン(`src/lib/mcp/markdown`)は既に collection 非依存なので丸ごと再利用する。

### 新規 tools

| tool                    | 用途                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| `list_legal_documents`  | slug / title / effectiveAt / `_status` の一覧。LLM が slug を知るための入口 |
| `get_legal_document`    | 本文を Markdown で返す                                                      |
| `create_legal_document` | title / slug / effectiveAt / body(Markdown)                                 |
| `update_legal_document` | 同上、部分更新                                                              |

### `publish_legal_document` を作らない

blog は `publish_post` を分けているが、法務文書の公開は「施行」という重い行為であり、
MCP から一発で公開できてしまうより admin で本文を目視してから publish する方が事故が起きにくい。
MCP は下書きの作成・更新までを担当し、公開は人間の手で行う。

### `effectiveAt` を Markdown 本文に混ぜない

frontmatter として本文に埋めると、read → write の往復で施行日が本文の一部として書き戻される
事故が起きる。tool の入出力では独立した JSON フィールドとして扱い、Markdown は純粋に本文だけにする。

### write は strict

`.claude/rules/mcp-write-strict.md` に従い、不正入力は変換せず reject して回復ヒントを返す。

- `effectiveAt` が日付として解釈できない
  → 「effectiveAt は YYYY-MM-DD 形式で指定してください。受け取った値: "来月1日"」
- slug が既存文書と衝突する
  → 既存文書の id と、更新したい場合は `update_legal_document` を使う旨を提示

## 配線

`.claude/rules/payload-cms.md` のチェックリストに沿う。

```
1. src/collections/legal-documents.ts              新規
2. payload.config.ts  collections に登録
3. seoPlugin          → 追加しない (下記)
4. livePreview        → 追加しない (autosave 無し / preview ルート無し)
5. pnpm payload:migrate:create legal_documents → pnpm payload:migrate
6. pnpm payload:generate-importmap
7. pnpm payload generate:types

+ src/utils/cache-tags   legalDocuments: 'legal-documents' を追加
+ src/seed/export.ts     sentinelize-body-media を legal 本文に配線
+ src/seed/import.ts     resolve-body-media を legal 本文に配線
```

### seoPlugin に追加しない

規約・免責は検索流入を設計する文書ではなく、外部販売ページからの直リンクで読まれる
(かつ noindex)。per-doc の OG 調整フィールドを admin に増やす価値がないため、
`generateMetadata` で `title` + 固定 description を組み立てる。

rules のチェックリスト step 3 からは意図的に外している。

### seed 配線は必須

richText を全部入りにしたため、legal 本文に image-row やアップロード画像を入れられる。
`sentinelize-body-media`(export)と `resolve-body-media`(import)は共有ヘルパだが
**collection ごとに個別配線が必要**で、これを忘れる事故が blog → works と 2 回再発している。

忘れた場合の症状:

- export した JSON の本文 upload が壊れる
- import 時に Payload の `ValidationError`

### colophon は変更なし

新規 UI コンポーネントを作らず、既存の `PageHeader` / `RichText` を組み合わせるだけなので
colophon への追加対象がない。

## テスト

vitest による TDD。拡張子は DOM を触るものだけ `.tsx`。

| 対象                      | 拡張子      | 内容                                                                |
| ------------------------- | ----------- | ------------------------------------------------------------------- |
| `findLegalDocumentBySlug` | `.test.ts`  | 未公開文書が公開側に漏れない                                        |
| MCP legal tools           | `.test.ts`  | Markdown round-trip、`effectiveAt` 不正値の reject と回復ヒント文言 |
| 詳細ページ                | `.test.tsx` | `<time dateTime>` に施行日が入る、本文が描画される                  |
| seed export / import      | `.test.ts`  | 本文 media が sentinel 化されて往復する                             |

実装完了時に `pnpm lint && pnpm typecheck` を実行する。

## 後続作業(本 PR 外)

1. PR #5 `feat/software-release-download` のマージ
2. `software` 詳細ページから `/legal/terms` へのリンク + ソフト固有条項の追記表示
3. 販売プラットフォーム側の商品ページに `/legal/terms` / `/legal/disclaimer` のリンクを設置
