# image-row block の Markdown round-trip 対応(MCP 本文編集)設計

日付: 2026-07-17
ステータス: 承認待ち

## 目的

`image-row` block を含む blog 記事を、MCP の `update_post` / `create_post` で本文編集できるようにする。現状は `hasUnsupportedBlocks` が image-row を検出して本文更新を拒否し、`get_post` も本文を返さない(`bodyEditable: false`)。image-row を Markdown ⇔ Lexical で round-trip 可能にして、この制約を解消する。

## 背景 / 現状

- `image-row`(`src/blocks/image-row/index.ts`)は Lexical `BlocksFeature` の block。構造は `cells` 配列(minRows/maxRows 2・required)、各 cell = `{ image: upload→media (required), caption?: text }`。
- Lexical 上の node 形状: `{"type":"block","version":2,"fields":{"id":"...","blockName":"","cells":[{"id":"...","image":<mediaId>,"caption"?:"..."},{...}],"blockType":"image-row"}}`。
- 既定では block node は Markdown に変換されず、round-trip で消える。そのため MCP は image-row 入り記事の本文編集を拒否している。

## スコープ

- image-row を Markdown ⇔ Lexical で round-trip 可能にする(専用フェンス構文 + Payload の `block.jsx` transformer)。
- MCP の既存ガード(`findRawImageRefs` / `hasUnsupportedBlocks`)を image-row 対応に更新。
- image-row 入り記事の本文編集(`update_post` bodyMarkdown / `create_post`)と取得(`get_post` が本文を返す)を有効化。

### スコープ外

- image-row 以外の新規 block 対応(将来別 block を足す時に同じ `jsx` パターンを踏襲する前提のみ残す)。
- 単一画像(`![alt](url)` / `![media:id]()`)まわりの挙動変更。
- admin UI の block 編集体験・front-end 描画(`src/components/rich-text/converters/image-row`)の変更 — `jsx` は Markdown 変換専用で、これらには影響しない。

## 専用 Markdown 構文

コードフェンス風。中の各行は既存の `![media:<id>]()` プレースホルダと一貫。

````markdown
```image-row
![media:79](左のキャプション)
![media:78](右のキャプション)
```
````

- 必ず**2行**(image-row は2セル固定)。
- caption 省略時は `![media:79]()`(空括弧)。
- 各行の形: `![media:<id>](<caption>)`。`<id>` は数字(media のドキュメント ID)。

## アーキテクチャ

### 1. `ImageRow` block に `jsx` を追加(中核)

`src/blocks/image-row/index.ts` の `ImageRow` 定義に `jsx: { customStartRegex, customEndRegex, export, import }` を追加する。`BlocksFeature({ blocks: [ImageRow] })` は各 block の `jsx` を検出して、Markdown transformer を editor config の `markdownTransformers` に自動登録する(Payload 3.84.1 の正式機構)。`convertMarkdownToLexical` / `convertLexicalToMarkdown` はこの transformer 経由で image-row を**本文中の正しい位置で** round-trip する。

- `customStartRegex: /^```image-row\s*$/`, `customEndRegex: /^```\s*$/` を指定することで、JSX タグ(`<image-row>`)用のデフォルトパーサを迂回し、フェンス構文を使う。
- **export(Lexical node → Markdown string)**: `({ fields }) => string`。`fields.cells[0]`, `fields.cells[1]` の `image`(number)と `caption` から、上記フェンス文字列を組み立てて返す。image-row にネスト rich text は無いので `lexicalToMarkdown` は使わない。
- **import(Markdown → block fields)**: `({ children, openMatch }) => BlockFields | false`。フェンス内の行(`children` / linesInBetween 由来の文字列)を自前 regex `^\s*!\[media:(\d+)\]\((.*)\)\s*$` で行ごとに解析し、`cells: [{ id, image, caption }, { id, image, caption }]` を返す。
  - cell の `id` は `bson-objectid`(Payload の transitive dependency)で明示生成する(D1 adapter が array-row id を自動採番するか未確認のため安全側)。
  - `caption` は空文字なら省略(`undefined`)。
  - **2セルにならない / id が数字でない場合は `false` を返さない**(false は block を無言で drop する)。代わりに codec/tool 層の事前バリデーション(下記)で弾くので、import に来る時点では整形済みが前提。防御的に、2要素に満たない場合は空 caption・既知 id で埋めず、import は best-effort でパースする。最終的な整合性は tool 層バリデーションが担保する。

### 2. codec モジュール(`src/lib/mcp/markdown`)の更新

- `createMarkdownCodec` の実体は不変(`convertMarkdownToLexical` / `convertLexicalToMarkdown` が jsx transformer 込みの editorConfig を使うため、自動で image-row を扱えるようになる)。
- `findRawImageRefs` を修正: 現状 `![...](非空)` を「生 URL 画像参照」として検出するが、これは image-row セル行 `![media:79](caption)` を誤検出する。**`![media:<数字>](...)` を除外**する(生 URL = `media:<数字>` 以外の `![alt](url)`)。
  - 新しい判定: 画像参照のうち、`alt` 部分が `media:<数字>` で始まるものは raw URL ではない(media 参照)。それ以外の `![alt](非空)` を raw URL として返す。
- `hasUnsupportedBlocks` を修正: `image-row` を「対応済み」とみなす。`block` / `inlineBlock` ノードのうち `blockType`(または inline の相当)が対応済みリスト(`['image-row']`)に含まれないものだけを「未対応」とする。将来 block が増えたら対応済みリストに足す。
- 新規: `validateImageRowFences(markdown: string): string[]` — ```image-row フェンスを走査し、各フェンスが「ちょうど2行の `![media:<数字>](...)`」であることを検証。違反(行数≠2 / id が数字でない)ごとに LLM 向けの回復指示メッセージ(英語 or 日本語は既存のツールメッセージに合わせる)を返す。空配列なら OK。

### 3. tool ハンドラ(`src/lib/mcp/tools`)の更新

- `create_post` / `update_post` の本文バリデーション順序:
  1. `findRawImageRefs`(生 URL 画像を弾く)— 既存。
  2. `validateImageRowFences`(image-row フェンスの整合性)— 新規。違反なら回復指示付き reject。
  3. image-row セルの **media 存在チェック**: フェンス内の各 `media:<id>` について `payload.findByID({ collection: 'media', id, disableErrors: true, overrideAccess: false, user })` で存在確認。存在しない id があれば「先に upload_media で作成した id を使え」系の reject(thumbnail 存在チェックと同じ方針)。
- `update_post` の `hasUnsupportedBlocks` によるブロック本文 reject は、image-row のみの記事では発生しなくなる(image-row は対応済み)。将来別 block を含む記事は従来どおり reject。
- `get_post` は `hasUnsupportedBlocks` が false になる記事について `bodyMarkdown`(image-row フェンス込み)を返す(`bodyEditable: true`)。

## データフロー

````
create_post/update_post(bodyMarkdown 内に ```image-row フェンス)
  → findRawImageRefs: media: 参照は除外・生URLのみ弾く
  → validateImageRowFences: 各フェンス=2行の ![media:id](...) を検証
  → 各 media:id の存在チェック(payload.findByID media)
  → codec.toLexical(convertMarkdownToLexical)
      → image-row jsx.import がフェンス→ block node(cells[2], cell id 生成)
  → payload.create/update(draft)

get_post(image-row 入り記事)
  → hasUnsupportedBlocks=false(image-row は対応済み)
  → codec.toMarkdown(convertLexicalToMarkdown)
      → image-row jsx.export が block node→ ```image-row フェンス
  → bodyEditable: true + bodyMarkdown を返す
````

## エラー処理

方針は既存どおり「LLM が次の一手を自己修正できる指示」。

- image-row フェンスが2行でない / id が数字でない → `validateImageRowFences` が具体的な回復指示で reject。
- フェンス内の media id が存在しない → 「upload_media で作成した media id を使え」系 reject。
- image-row **以外**の未対応 block を含む記事への bodyMarkdown 更新 → 従来どおり reject(admin UI 案件の旨)。

## テスト戦略(vitest TDD, node unit)

- `markdown` モジュール:
  - image-row フェンス → Lexical block node(cells[2], image id / caption)→ フェンス の round-trip。
  - caption 有り / 無し(空括弧)両方。
  - 段落や見出しに挟まれた image-row の位置が保たれる。
  - `findRawImageRefs` が `![media:79](caption)` / `![media:79]()` を除外し、`![alt](https://…)` は検出する。
  - `hasUnsupportedBlocks` が image-row のみの body で false、未知 block を含む body で true。
  - `validateImageRowFences` の 2行制約 / 非数字 id / 正常系。
- `tools` モジュール:
  - `create_post` / `update_post` が image-row フェンス込み本文を通す(payload をモック、cells が渡ることを assert)。
  - フェンス不正 / 存在しない media id の reject 経路。
  - image-row のみの記事は `update_post` の block-reject を通過する。
- 実 round-trip の最終確認は staging E2E(image-row 入り実記事 id 2/3 相当)。

## デプロイ

- `jsx` 追加は runtime config で **DB schema 変更なし → migration 不要**。
- CI: main への push で staging 自動 deploy、production は手動 dispatch(承認ゲート)。

## 変更ファイル一覧(見込み)

| ファイル                                | 変更                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/blocks/image-row/index.ts`         | `jsx: { customStartRegex, customEndRegex, export, import }` を追加                                  |
| `src/lib/mcp/markdown/index.ts`         | `findRawImageRefs` 修正 / `hasUnsupportedBlocks` を対応済みリスト化 / `validateImageRowFences` 追加 |
| `src/lib/mcp/markdown/markdown.test.ts` | 上記のテスト追加                                                                                    |
| `src/lib/mcp/tools/index.ts`            | create/update に image-row フェンス検証 + media 存在チェック配線                                    |
| `src/lib/mcp/tools/tools.test.ts`       | 上記のテスト追加                                                                                    |

依存追加: `bson-objectid`(既に transitive dependency。cell id 生成に直接 import する場合は `pnpm add bson-objectid` で直接依存化)。

## 未解決事項(実装時に確認)

- `block.jsx` の `customStartRegex`/`customEndRegex` 経路は非 JSX 構文で公式ドキュメント例が無い(source 確認のみ)。最初のスパイクで「フェンス→block node」import と「node→フェンス」export の両方向を実データで検証する。
- import が受け取るフェンス内容が `children`(文字列)か `linesInBetween`(配列)か、どちらの引数で来るかを実挙動で確認して解析する。
- D1 adapter が cells の array-row id を自動採番するか未確認 → cell id は明示生成でスタートし、余分なら後で外す。
