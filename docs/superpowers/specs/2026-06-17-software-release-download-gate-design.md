# ソフトウェアリリース置き場 + DLゲート 設計

- 日付: 2026-06-17
- ステータス: 設計確定（実装計画はこの後 writing-plans で作成）

## 1. 目的

自作ソフトウェアの「これ作りました」という blog 記事を書き、その記事の本文中に配布物への
ダウンロード導線を埋め込めるようにする。配布物は利用規約とバージョン履歴を持つ。
ダウンロードは「利用規約への同意 + Cloudflare Turnstile の確認」を経たユーザーだけに許可する。

同じソフトウェアが複数のバージョンを持つこと、そして複数の blog 記事が同一ソフトウェアを
指せることを、データモデル上で素直に表現する。

## 2. 全体像

```
collections
  software          製品の安定した識別子。slug / name / summary / terms(利用規約 richText)。
                    blog 本文ブロックの参照先であり、/software/{slug} 詳細ページの実体。
  software-release  upload 有り collection。binary(R2) / version / releasedAt / changelog
                    / software への relationship。

blog.body (richText)
  └ [software-download ブロック] ── relationship ─▶ software
       描画時に software を解決し、利用規約と「最新版 + 過去の履歴」を集約して DLゲートに展開する。

公開面
  /blog/{slug}      制作記。本文中にブロックが埋まる。
  /software/{slug}  配布ページ。利用規約 + 最新版 + 履歴 + 同じ DLゲート。

DLゲートの配信経路（Server Action で検証・URL発行 → 署名付き URL がバイトを serve）
  client  Turnstile token 取得 + 規約同意 → Server Action issueDownloadUrl({ releaseId, token })
  server  verifyTurnstile(token) が真のときだけ、期限付き・署名付き URL を発行して文字列で返す。
  client  返ってきた URL へ navigate
  server  GET Route Handler が署名(HMAC)と期限を検証し、OK のときだけ R2 からバイト列を stream。
          直リンク（未署名 URL）は 403。upload collection の public file URL も塞ぐ。
```

## 3. データモデル

### 3.1 `software` collection（製品 = 安定した識別子）

| field     | type            | 必須 | 説明                                                                 |
| --------- | --------------- | ---- | -------------------------------------------------------------------- |
| `slug`    | text(slugField) | ○    | URL 識別子。`/software/{slug}` と一致。既存 `slugField()` を再利用。 |
| `name`    | text            | ○    | ソフトウェア名。`admin.useAsTitle`。                                 |
| `summary` | textarea        | ○    | OG・ブロック見出し下・詳細ページの短い説明。                         |
| `terms`   | richText        | ○    | 利用規約。DLゲートの Dialog 内にスクロール表示する本体。             |

- `versions: { drafts: { autosave } }`（blog/works と同じ骨格）
- `access`: read は `user !== null ? true : { _status: { equals: 'published' } }`、create/update/delete は `user !== null`
- revalidate hook: `createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.software], [], (slug) => `/software/${slug}`)`（一覧は無いのでパスは詳細のみ。blog 逆引きは §7）
  - blog 本文のブロックが software を解決して描画するため、software 変更時は **その software を埋め込む blog 詳細パスも** ISR 無効化が必要。詳細は §7。

### 3.2 `software-release` collection（版 = 配布物の実体）

upload 有り collection。1 doc = 1 バイナリ = 1 バージョン。

| field        | type                    | 必須 | 説明                                                                                                                                            |
| ------------ | ----------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| (upload)     | file                    | ○    | 配布バイナリ本体。R2 に保存（既存 `r2Storage`）。                                                                                               |
| `software`   | relationship → software | ○    | どの製品の版か。`admin.useAsTitle` は version。                                                                                                 |
| `version`    | text                    | ○    | セマンティックバージョン文字列（例 `1.1.0`）。表示・ファイル名に使う。                                                                          |
| `releasedAt` | date                    | ○    | リリース日。履歴の並び順キー。                                                                                                                  |
| `changelog`  | textarea                | -    | 任意。その版の変更点を GitHub Release 的に書く。基本は version + DL リンクだけ表示し、changelog があれば添える。リッチ装飾不要なので textarea。 |

- `upload.mimeTypes`: ソフトウェア配布物を許可（`application/zip`, `application/octet-stream`, `application/x-apple-diskimage` 等。実値は実装時に確定）。
- 「最新を主・過去を履歴」: ある software に紐づく release を `releasedAt` 降順で query。先頭が最新、残りが履歴。
- `access`: §6 のゲート要件に従い、**file バイト列は public read させない**。メタデータ read 方針は §6 で確定。
- create/update/delete は `user !== null`。

### 3.3 関係の表現（「同じ software を指す」）

- software が安定識別子（slug）。version も blog ブロックも、同一の software doc への relationship を共有する。
- ゆえに過去記事のブロックは software を指したまま不変。新バージョンを出すと、その software に
  紐づく release が増えるだけで、記事側は何も変わらない。
- ブロックは「どの software か」だけを指す。「どの版を出すか」は描画ロジック（最新を主・過去を履歴）が決める。

## 4. richText ブロック `software-download`

`src/blocks/software-download/index.ts` に `Block` を定義し、`payload.config.ts` の
`BlocksFeature({ blocks: [ImageRow, SoftwareDownload] })` に追加する（既存 ImageRow と同じ要領）。

```
SoftwareDownload (slug: 'software-download')
  fields:
    software: relationship → software (required)
```

- 版の選択フィールドは持たない（確定: 最新を主・過去を履歴。記事ごとの版 pin はしない）。
- 描画は `src/components/rich-text/converters/software-download/` に converter を追加し、
  `converters/index.tsx` の `blocks: { ...imageRowBlockConverters, ...softwareDownloadBlockConverters }` に合流。
- converter は software（populated relationship）から `name / summary / terms` を読む。
  release 一覧は relationship だけでは取れないため、§5 のデータ取得方針で供給する。

## 5. 描画とデータ取得

ブロック converter は同期的に node.fields しか見られない（RichText は事前に取得済みデータを描く）。
release 一覧と利用規約を描画時に揃えるため、次のいずれかを実装時に確定する（plan で決定）:

- 案A: blog/software 詳細ページのローダーで、本文に含まれる software-download ブロックの
  software id を抽出 → 各 software の release 一覧をまとめて取得 → converter に context/map で供給。
- 案B: ブロック描画を `'use client'` の島にして、software id を渡し、release 一覧を
  ゲートと同じ download エンドポイント群（メタ取得用 GET）から取得。

> 推奨は案A（RSC のままサーバで解決、クライアント JS 最小）。`software.terms` は relationship が
> populate されれば取れるが、release はクロスコレクションなので別 query が要る点が選定理由。

詳細ページ `/software/{slug}` は記事を介さず software を直接ローダーで引き、同じ DLゲート UI を描く。

## 6. DLゲートの配信経路（Server Action 検証 + 自前署名 URL + GET Route Handler）

確定: 検証と URL 発行は **Server Action**。実バイトは action が発行した
**期限付き・署名付き URL** だけが serve する。署名検証は GET Route Handler が R2 binding から行う。
未署名 / 改竄 / 期限切れ URL は 403。直リンク（未署名 URL）は機能しない。

役割分担の理由: Server Action は contact の `submit-contact.ts` と同じ型で token を型安全に受け取れるが、
戻り値はシリアライズ値のため**バイト stream を返せない**。そこで action は「短命な署名付き URL」を発行し、
バイトの stream 返却は GET Route Handler が担う（HMAC 署名で再検証、Turnstile 再確認は不要）。

```
client   Turnstile token 取得（@marsidev/react-turnstile、contact 実装を踏襲）+ 規約同意
  ↓ Server Action: issueDownloadUrl({ releaseId, token })
server   verifyTurnstile(token, env) を呼ぶ（既存 verify-turnstile を共有）
  ↓ true のときだけ
         exp = now + 短命TTL（例 60s）
         sig = HMAC(`${releaseId}|${exp}`, SECRET)
         return `/api/software/download?releaseId=${releaseId}&exp=${exp}&sig=${sig}`
  ↓ false → エラー（URL を発行しない）
client   返ってきた URL へ navigate
  ↓ GET /api/software/download?releaseId&exp&sig
server   sig を再計算し定数時間比較 + exp 未経過を確認
  ↓ OK のときだけ
         payload で release を引き、R2 binding から storage key のバイト列を取得
         Content-Disposition: attachment; filename="<name>-<version>.<ext>" + Cache-Control: no-store で stream
  ↓ 署名不一致 / 期限切れ / 不正 → 403
```

### 6.1 必須の制約（ゲートが実効するための条件）

- 署名鍵: 新規 secret を増やさず既存の `PAYLOAD_SECRET` 等を HMAC 鍵に流用する（実値は plan で確定）。
  `.dev.vars` に既にあるものを使い、新たな S3 access key/secret は導入しない。
- `software-release` の upload は **public file URL を生やさない**。
  Payload の upload は通常 file route でバイト列を返すため、`access.read` 等で未認証ユーザーが
  file route から直接ダウンロードできない状態にする。
  - メタデータ（version / releasedAt / changelog / software rel）は published なら read 可能でよい。
  - file バイト列に到達する唯一の経路を「署名検証を通った GET Route Handler」にする。
  - 「メタは read 可・file バイトはゲート経由のみ」を両立する具体手段は plan で確定
    （候補: GET Route が R2 binding から storage key で直接読む / access.read を絞り endpoint は overrideAccess）。
- GET Route Handler は `src/app/.../api/software/download/route.ts`。
  OpenNext on Workers 上で R2 binding は `getCloudflareContext().env.R2` で取得。
- 同一の verifyTurnstile を contact と共有するため、`src/lib/contact/verify-turnstile.ts` は
  `src/lib/turnstile/` 等へ移設し両者から参照する（命名は plan で確定）。
- 署名の組み立て / 検証は pure 関数に切り出し単体テストする（`signDownloadUrl` / `verifyDownloadSig`）。

## 7. ISR / revalidation

`isr-revalidation.md` ルールに従う。software / software-release の変更は次を無効化する:

- `/software/{slug}`（一覧ページは無い）
- その software を埋め込んでいる **blog 詳細パス**（ブロックが software を解決して描画するため）
  - 単純化のため、software/release の afterChange で `revalidateTag(CACHE_TAGS.software)` +
    関連 blog の revalidate を行う。blog→software の逆引きが要るため、ローダーで software ごとの
    参照元 blog slug を解決できるようにするか、保守的に `/blog` 配下を含める方針を plan で確定。
- download エンドポイントは動的（キャッシュ不可、`Cache-Control: no-store`）。

## 8. UI（react-aria + Panda CSS、ルール準拠）

- ゲートの起点（インライン）: ソフト名 / 最新版バッジ / 「▾ 過去の版」開示 / 「ダウンロード」ボタン。
  ボタンは `react-aria-components` の Button。リンク要素は使わない（DL は Dialog 起動）。
- Dialog: `react-aria-components` の Dialog/Modal。中身 = 規約スクロール領域 + 同意チェックボックス
  - Turnstile widget + 「DL確定」ボタン。同意 + token 揃うまで確定無効（contact の keyed remount パターン踏襲）。
- 過去の版: 開示で各版を `version + releasedAt + 「ダウンロード」` の一行を基本に、changelog があれば
  その下に GitHub Release 的に添える（無ければ一行のまま）。
- スタイルは `styles.css.ts` + Panda トークン。可視 focus ring はグローバル規約に従う。
- WCAG 2.1 AA を満たす color token を使う。
- HTML/CSS → react-aria → 独自実装 の順（UI ルール）。Dialog/Disclosure は react-aria で実現可能。

## 9. コンポーネント / colophon

- `src/components` に追加する共有 UI（DLゲート本体・Dialog など）は colophon に登録する
  （`_demos/index.tsx` + `content.ts` の `components.items`）。link/href は `e.preventDefault` で noaction。
- ブロック converter は `src/components/rich-text/converters/` 配下のためコンポーネント追加扱い。

## 10. payload-cms.md チェックリスト（新 collection 2 つ）

両 collection について以下を完了する:

1. collection 定義作成（labels / field label は日本語、useAsTitle 設定）
2. `payload.config.ts` の `collections` に登録
3. public 向けなら seoPlugin の collections に追加（software のみ。release は配布物実体）
4. public 向けなら livePreview に追加（software → `/software/{slug}`）
5. migration 作成 + 実行
6. import map 再生成
7. types 再生成

## 11. テスト（TDD）

- `verifyTurnstile`: 既存テスト維持（移設するなら追従）。
- `signDownloadUrl` / `verifyDownloadSig`（pure）: 正しい sig は通り、改竄 sig / 期限切れ exp は弾く。
- Server Action `issueDownloadUrl`: token 不正 → URL を発行しない、検証 OK → 期限付き署名 URL を返す。
  verifyTurnstile はモック注入（design-principles の DI 方針）。
- GET Route Handler: 署名不一致 / 期限切れ → 403、OK → 正しい filename ヘッダ + no-store + バイト列。
  R2 / payload はモック注入。
- ブロック converter: software 未 populate / release 0 件 / 最新+履歴あり の分岐をテスト（image-row テスト踏襲）。
- 「最新を主・過去を履歴」を算出する pure 関数（release[] → { latest, history }）を切り出し単体テスト。
- 同意 + token 揃うまで DL 無効、を UI テスト（.test.tsx = browser mode）。

## 12. スコープ外（YAGNI）

- 記事ごとの版 pin（確定で不採用）。
- ダウンロード数カウント / 分析。
- 認証ユーザー向けの非公開配布。
- software 一覧ページ `/software`（確定で不採用。詳細 `/software/{slug}` のみ）。
- changelog のリッチ装飾（textarea のプレーンテキストで足りる。GitHub Release 的な短文）。

## 13. 未確定（plan で詰める）

- §5 描画データ供給（案A/B）と context 受け渡しの具体。
- §6 署名鍵に流用する既存 secret の確定（PAYLOAD_SECRET か専用か）と TTL の値。
- §6.1 「メタ read 可・file バイトはゲートのみ」の具体手段。
- §7 blog 逆引き revalidation の具体。
- `software-release` の mimeTypes 実値。
