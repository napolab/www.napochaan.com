# works collection の MCP ツール 設計

- 日付: 2026-09-14
- 対象: `src/lib/mcp/tools/works/`(新規), `src/lib/mcp/tools/shared/body-pipeline/`(新規、blog から抽出), `src/collections/fields/work-type/`(新規), `src/collections/works.ts`, `src/app/api/mcp/route.ts`
- 目的: `/works` に載る制作物(`works` collection)を MCP から入稿・編集・公開できるようにする

## 背景

works は blog と logs の中間の性格を持つ。

|               | blog           | logs               | **works**                                       |
| ------------- | -------------- | ------------------ | ----------------------------------------------- |
| slug          | あり           | なし               | **あり**(`slugField()` 共有)                    |
| richText 本文 | あり(必須)     | なし               | **あり(任意)**、editor は blog と同じ features  |
| thumbnail     | 必須           | なし               | **任意**(無ければ詳細ページにプレースホルダ)    |
| 種別 select   | なし           | `meta`(表示ラベル) | **`type`**(production / talk / support)         |
| 外部リンク    | なし           | `url`              | **`url`**(設定すると一覧のリンク先がこれになる) |
| MCP から公開  | `publish_post` | `publish_log`      | **`publish_work` を作る**                       |
| 削除ツール    | なし           | `delete_log`       | **作らない**(ポートフォリオの誤削除を避ける)    |

本文は blog と同じ lexical editor(画像 upload node、image-row block、table)で書かれる。
blog の `create_post` / `update_post` / `get_post` が持つ本文パイプライン
(生 URL 画像の拒否、`![media:<id>](alt)` の alt 同期、block フェンス検証、table 構文検証、
サイト内 media URL の placeholder 正規化、newTab ポリシー)をそのまま使う。

## 決定事項(本人決定 2026-09-14)

1. **ツールは 5 つ**: `list_works` / `get_work` / `create_work` / `update_work` / `publish_work`。delete は作らない。
2. **本文パイプラインは blog と共通化**: `src/lib/mcp/tools/index.ts` の `createBlogToolHandlers` に閉じている
   `prepareBody` / `normalizeBodyMarkdown` / `resolveUneditableWarning` / `verifyMediaExists` 等を
   `src/lib/mcp/tools/shared/body-pipeline/` に抽出し、body 型をジェネリクスにして blog / works で共用する。
   blog の既存テスト(`src/lib/mcp/tools/tools.test.ts`)は挙動不変で green のまま。
3. **thumbnail は任意**: `thumbnailMediaID` 指定時のみ media の実在を検証。`update_work` で `null` を渡すと外す。
4. **`type` の選択肢を単一ソース化**: `src/collections/fields/work-type/index.ts` に
   `WORK_TYPE_OPTIONS = ['production', 'talk', 'support'] as const satisfies readonly Work['type'][]` を置き、
   `works.ts` の `options` と MCP の `z.enum` を同じ配列から組む(logs の `LOG_META_OPTIONS` と同型)。
   葉モジュールにする理由も logs と同じ(works.ts は revalidate hooks 経由で next/cache を引く)。

## ツール構成

| ツール         | 引数                                                                                             | 用途                                                     |
| -------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `list_works`   | `status?`(`draft` / `published` / `all`、既定 all), `limit?`                                     | id / slug を得る。date 降順                              |
| `get_work`     | `id?` / `slug?`                                                                                  | 1 件取得。本文は Markdown(blog の get_post と同じ正規化) |
| `create_work`  | `title`, `slug`, `type`, `date`, `url?`, `description?`, `thumbnailMediaID?`, `bodyMarkdown?`    | **draft** で作成                                         |
| `update_work`  | `id` + 変更したいフィールドのみ(`url` / `description` / `thumbnailMediaID` は `null` でクリア可) | 指定フィールドだけ変わる(draft version)                  |
| `publish_work` | `id`                                                                                             | 最新 draft を全フィールド再送して公開                    |

- `date` は `YYYY-MM-DD` 必須(logs / legal と同じ形式・実在検証)。read は JST 暦日に正規化して返す(read-normalize / write-strict)。
- `slug` は create 前に `requireSlugAvailable(payload, 'works', slug, 'update_work')` で重複を回復ヒント付きで弾く。
- `get_work` は body が無い doc では `bodyEditable: true, bodyMarkdown: ''` を返す。
  MCP 非対応 block / 往復不能 table を含む場合は blog と同じく `bodyEditable: false` + warning。
- `update_work` の `bodyMarkdown` は既存本文が編集不可なら reject(blog の `resolveNextBody` と同じ)。
- `publish_work` は draft-promotion(bare `_status` update は published 行に浅くマージされ draft 編集が消える)を避けるため、
  最新 draft を読み直して全フィールドを `_status: 'published'` 付きで再送する(blog / logs と同じ)。
- 応答には `adminURL`(`/admin/collections/works/<id>`)と公開後の `url`(`/works/<slug>`)を含める。

## 順序(副作用を伴う検証は最後)

`prepareBody` は media の alt 更新を即 commit する副作用を持つ。create は
thumbnail 実在 → slug 重複 → date 検証 → prepareBody → create の順で、
先に失敗しうる検証を副作用の前に置く(blog の `createPost` と同じ理由)。
