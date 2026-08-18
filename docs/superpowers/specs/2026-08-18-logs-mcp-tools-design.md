# logs collection の MCP ツール 設計

- 日付: 2026-08-18
- 対象: `src/lib/mcp/tools/logs/`(新規), `src/collections/logs.ts`, `src/app/api/mcp/route.ts`
- 目的: `/log` の年表に載る手動エントリ(`logs` collection)を MCP から追加・編集・公開・削除できるようにする

## 背景

`logs` は既存の MCP 対象 2 コレクションとかなり性格が違う。

|               | blog                | legal          | **logs**                              |
| ------------- | ------------------- | -------------- | ------------------------------------- |
| slug          | あり                | あり           | **なし**(識別は `id` のみ)            |
| richText 本文 | あり                | あり           | **なし**(4 フィールド)                |
| MCP から公開  | `publish_post` あり | 不可(admin UI) | **`publish_log` を作る**              |
| 削除ツール    | なし                | なし           | **`delete_log` を作る(リポジトリ初)** |

richText を持たないため、blog/legal が必要としている Markdown codec 層
(image-ref パーサ、block フェンス検証、署名付きアップロード)は**丸ごと不要**。
`legal` ツールが最も近い雛形になる。

`/log` の年表は `_status: 'published'` のものだけを表示する(`src/lib/payload/logs/index.ts`)。
draft で作った log は年表に出ない。

## ツール構成(5 つ)

| ツール        | 引数                                               | 用途                                                  |
| ------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `list_logs`   | `status?`(`draft` / `published` / `all`), `limit?` | id を得る唯一の手段。update / publish / delete の前提 |
| `create_log`  | `title`, `date`, `meta`, `url?`                    | **draft** で作成                                      |
| `update_log`  | `id` + 変更したいフィールドのみ                    | 指定したフィールドだけ変わる                          |
| `publish_log` | `id`                                               | 年表に載せる                                          |
| `delete_log`  | `id`                                               | ハード削除                                            |

`create_log` が draft を作り `publish_log` で公開する 2 段階は blog と同じ形
(本人決定 2026-08-18)。log は 4 フィールドの事実データだが、公開の意思決定を
明示的な操作として残す。

## 決定事項と根拠

### `meta` を単一ソース化する

`meta` の値は**そのまま年表の表示ラベルになる**うえ、既存行が `DJ` などと
バイト一致していないと壊れる(`src/collections/logs.ts` のコメントに明記済み)。

現状はリテラルが collection 定義の中に埋まっていて外から参照できない。MCP 側に
同じリテラルを書くと、片方だけ増えたときに気づけない。そこで collection から export し、
collection 自身の `options` もその配列から組む。

```ts
// src/collections/logs.ts
export const LOG_META_OPTIONS = [
  'DJ', 'VJ', 'DJ/VJ', 'Support', 'Dev', 'Flyer', 'Talk', 'Video',
] as const satisfies readonly Log['meta'][];
```

`satisfies readonly Log['meta'][]` により、`payload-types.ts` の再生成で union が
変わった瞬間にコンパイルエラーになる。MCP 側は `z.enum(LOG_META_OPTIONS)`。

`.claude/rules/cross-module-sync-test.md` の方針に従い、collection の `options` と
`LOG_META_OPTIONS` の一致をテストで表明し、同ルールの「Known Sync Pairs」表にも追記する。

### `delete_log` は `id` のみ(title 照合なし)

**本人決定 2026-08-18。** 当初は誤爆防止に `title` の完全一致を必須にする案を提示したが、
`id` だけで弾く形が選ばれた。

- 存在しない `id` → 回復ヒント付きで reject
  (「id=N の log は見つかりません。list_logs で id を確認してください。」)
- 存在する `id` → `payload.delete()` でハード削除

**受容したトレードオフ**: LLM が「存在するが別の」 id を掴んだ場合、サーバー側で止める
手段はない。残る抑止は `annotations: { destructiveHint: true }` によるクライアント側の
確認 UI のみで、これを尊重するかはクライアント実装に依存する。Payload の `delete()` は
バージョンテーブルごと消すハード削除で復元手段はない。

### 日付は必ず `@utils/dayjs` を通す

`date` は `dayOnly` の date フィールド。**dayOnly は UTC インスタントで返るため、
JST で素朴に slice すると 1 日ズレる** — legal の `effectiveAt` で実際に起きた事故
(`.claude/rules` 外だが memory に記録あり)。

MCP は `YYYY-MM-DD` 固定で受け、`@utils/dayjs` の strict parse(`customParseFormat`)で
検証する。生の `Date` / `Intl` / `slice` は使わない(`.claude/rules/dayjs-timezone.md`)。

### ISR は追加実装しない

`src/collections/logs.ts` の `afterChange` / `afterDelete` フックが既に `/` と `/log` を
revalidate する(`createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.logs], ['/', '/log'])`)。
delete もフック経由で自動反映されるため、MCP 側に revalidation の実装は不要。

## ファイル構成

```
src/lib/mcp/tools/logs/
├── index.ts        # createLogToolHandlers + registerLogTools
└── logs.test.ts
```

- `src/collections/logs.ts` — `LOG_META_OPTIONS` を export し、`options` をそこから組む
- `src/app/api/mcp/route.ts` — `registerLogTools(server, { payload, user })` を 1 行追加。
  **codec は渡さない**(richText なし)
- `.claude/rules/cross-module-sync-test.md` — Known Sync Pairs 表に 1 行追記

`LogToolDeps` は `{ payload: Payload; user: User }` のみ。blog の `BlogToolDeps` が持つ
`codec` / `signingSecret` / `siteBaseUrl` はいずれも不要。

## エラー処理

既存の `src/lib/mcp/tools/shared/tool-result`(`ok` / `toToolError`)と
`src/lib/mcp/errors` に乗せる。neverthrow の `ResultAsync` チェーンで組み、
`.match(ok, toToolError)` で終端する(`legal/index.ts` と同じ形)。

新規に要るエラーは「log が見つからない」のみ。既存の `PostNotFoundError` と同型の
`LogNotFoundError` を `errors` に追加する。

回復ヒントは `.claude/rules/mcp-write-strict.md` に従い、①何が不正か ②有効な選択肢の
全列挙 ③問題の値 ④回避手段、を含める。特に `meta` の不正値は 8 個の選択肢を全部出す。

## テスト

`logs.test.ts` で payload をモックし、**拒否系を厚く**する。

成功系:

- `list_logs` が status filter ごとに正しい `where` を組む
- `create_log` が `_status: 'draft'` で作る
- `update_log` が指定フィールドだけを渡す
- `publish_log` が `_status: 'published'` にする
- `delete_log` が `payload.delete()` を呼ぶ

拒否系:

- `meta` の不正値 → 8 択を列挙した回復ヒント
- `date` の不正形式(`2026/10/24`, `10-24`, 実在しない `2026-02-30`)
- 存在しない `id`(`update_log` / `publish_log` / `delete_log` すべて)

同期テスト:

- `LOG_META_OPTIONS` と collection の `options` の `value` 列が 1:1 で一致すること
  (両方を import して assert する — 片側のハードコードでは drift を検出できない)

## 範囲外

- **年表の派生エントリ**(news / works / 外部投稿から導出される項目)は `logs` collection の
  管轄外。本設計は手動エントリのみを扱う。
- **`unpublish_log`**: 「年表から下ろす」操作は今回入れない。必要になったら追加する(YAGNI)。
- **staging E2E**: 実装完了後に別途判断する。手順は memory の
  `staging-mcp-e2e-via-cloudflared` にある。
