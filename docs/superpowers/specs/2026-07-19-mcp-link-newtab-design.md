# MCP リンク newTab 自動導出 — 設計

日付: 2026-07-19
ブランチ: worktree-mcp-link-external-target

## 背景 / 問題

MCP (`create_post` / `update_post`) から入稿した本文のリンクは常に同タブで開く。原因は
Payload の markdown→lexical リンク変換器
(`@payloadcms/richtext-lexical/dist/features/link/markdownTransformer.js`) が
`newTab: false` をハードコードしているため。サイト側レンダラー
(`src/components/rich-text/converters/link`) は `newTab === true` のときだけ
`target="_blank" rel="noopener noreferrer"` を付けるので、MCP 経由では外部リンクを
別タブで開かせる手段がない。

サイトのコンテンツ方針は「内部リンク = 同タブ・外部リンク = 別タブ」。

## 決定事項

| 論点       | 決定                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 指定方法   | **URL 自動判定**。Markdown 構文は追加しない。外部ホストの URL は自動で newTab=true。                                                                    |
| round-trip | **常に再導出**。update_post のたびに全リンクの newTab を URL から再計算。admin で手動設定した例外は MCP update で方針値に戻る（承認済みトレードオフ）。 |
| 実装層     | **A: MCP 層の Lexical tree transform**。vendor コードの fork なし、admin エディタ・seed・レンダラーは触らない。                                         |

## 判定ルール

`resolveNewTab(url: string, siteBaseUrl: string): boolean`

| URL の形                                         | newTab                                            |
| ------------------------------------------------ | ------------------------------------------------- |
| `https?://` 絶対 URL でホスト名 ≠ 自サイトホスト | `true`（外部 → 別タブ）                           |
| `https?://` 絶対 URL でホスト名 = 自サイトホスト | `false`（内部）                                   |
| 相対 URL（`/blog/x`）・`#` アンカー              | `false`                                           |
| `mailto:` / `tel:` / パース不能な URL            | `false`（`target=_blank` が無意味なので触らない） |

- ホスト名は完全一致比較。`stg.napochaan.com` ≠ `napochaan.com` → stg へのリンクは外部扱い（実運用でほぼ書かないので許容）。
- 判定に使う自サイトホストは `siteBaseUrl` から `new URL().hostname` で取り出す。

## 実装配置

新モジュール `src/lib/mcp/markdown/link-newtab/`（colocation: `index.ts` + `link-newtab.test.ts`）:

- `resolveNewTab(url, siteBaseUrl)` — 上記表の純粋関数。
- `applyLinkNewTabPolicy(body: Blog['body'], siteBaseUrl: string): Blog['body']` —
  Lexical tree を再帰的に歩き、`type === 'link' | 'autolink'` かつ
  `fields.linkType !== 'internal'` のノードの `fields.newTab` を `resolveNewTab` の
  結果で**常に上書き**する。immutable（新しい tree を返す）。他ノードは素通し。

挿入点は `prepareBody`（`src/lib/mcp/tools/index.ts` の create/update 共通 body 保存
パイプライン）: `toLexicalSafe(...)` の後に
`.map((body) => applyLinkNewTabPolicy(body, siteBaseUrl))`。

`siteBaseUrl` は `BlogToolDeps` に追加し、`src/app/api/mcp/route.ts` で
`process.env.BASE_URL ?? 'http://localhost:3000'` を注入する
（`create-preview-url-factory` と同じ規約、引数注入スタイル）。

## round-trip / read 側

- `get_post` の Markdown export は現状のまま `[text](url)`（マーカーなし）。newTab は
  URL から決定的に再導出されるため、export に情報を乗せる必要がない。
- mcp-write-strict との整合: 「サイレント変換禁止」はユーザーが書いた表現を黙って
  別物に変えることの禁止。newTab は Markdown で表現できない属性であり、これは
  「書かれたものの変換」ではなく「ポリシーからの導出」なので正規化に該当する。
  write を reject するケースは増やさない。

## エラー処理

変換は失敗しない設計。パース不能な URL は `false` に落とすだけで、例外・エラーは
発生させない。

## テスト計画

1. `resolveNewTab` の表駆動ユニットテスト（外部/自ホスト/相対/#/mailto:/tel:/不正 URL）。
2. `applyLinkNewTabPolicy` の tree transform テスト
   （link/autolink/ネスト/`linkType: 'internal'` 素通し/他ノード不変/immutability）。
3. `tools.test.ts` に統合テスト: create_post に外部/内部リンク混在 Markdown →
   保存された body の各リンクノードの newTab を検証。
4. 仕上げに worktree で build + 実 E2E（MCP 経由で draft 作成 → D1 の lexical JSON 確認）。

## スコープ外

- admin エディタの markdown paste 経路（admin には checkbox がある）。
- seed import 経路。
- レンダラー (`converters/link`) の変更 — `newTab === true` → `_blank` の既存契約のまま。
- `{newtab}` 等の明示 Markdown 構文（自動判定で足りる。将来必要になったら別途）。
