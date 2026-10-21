# MCP blog 入稿 — 接続・運用 runbook

## 認証の仕組み

MCP は Cloudflare Access のアプリ（Managed OAuth。本番は `/mcp` のパス単位アプリ、staging は admin と共用のホスト全体アプリ）と MCP Portal の後ろにある。自前の OAuth（OAuthProvider・`/oauth/authorize` の同意画面・`OAUTH_KV`）は廃止した。

- 認可は Access のポリシー `naporitan`（本人の email のみ）。`route.ts` が `Cf-Access-Jwt-Assertion` を `CF_ACCESS_TEAM_DOMAIN` + `CF_ACCESS_MCP_AUD` で検証し、email に一致する**既存の** Payload user を引く（作らない）。JWT 無し・不正・user 不在は 403、env 未設定は 500。
- Access アプリ・Portal・vars の設定と有効化の手順は `docs/cloudflare-access.md` の「MCP（`/mcp` アプリと MCP Portal）」。

## エンドポイント

- Portal: `mcp.napochaan.com`（server id は本番 `napochaan`、staging `napochaanstg`）
- 本番の MCP 本体: `https://napochaan.com/mcp`（Access 配下。MCP クライアントから直接つながず、Portal 経由にする）
- staging の MCP 本体: `https://stg.napochaan.com/mcp`（同上）

## クライアント接続

### Claude Desktop(Portal 経由)

Claude Desktop のコネクタに MCP Portal `mcp.napochaan.com` を追加する。認証は Portal の Managed OAuth（Dynamic Client Registration）で、同意は Access のログイン（GitHub-naporin0624）。Payload の email / password は使わない。

- 以前の直結コネクタ（`https://napochaan.com/mcp`）は外して、Portal 経由に付け直す。
- 初回に Access のログイン画面が開く。ポリシー `naporitan` に入っている本人の email で通る。
- server の登録と、管理者側の初回 OAuth（dashboard の「Save and connect server」）は本人の操作。

claude.ai の Web / モバイルの直結コネクタ(`https://napochaan.com/mcp` を直接追加する形)は、Access の DCR で callback を許可していないので使えない。Claude Code のように loopback の callback を使うクライアントは、DCR が localhost / loopback を許可しているので直結できる想定だが、未検証。

## 入稿ワークフロー

1. `upload_media`(thumbnail / 本文画像)→ 返る `id` と `![media:<id>]()` を控える
2. `create_post`(常に draft。`slug` は必須・小文字英数字とハイフンのみ)
3. admin UI の Live Preview で目視確認
4. `publish_post`(これが唯一の公開操作)

本文 Markdown の画像は `![media:<id>]()` 形式のみ。生 URL はツールが reject する。

### 画像 URL の SSRF ガード

`upload_media` の `url` 入力は取得前に検証される。以下は reject される:

- `http` / `https` 以外のスキーム
- `localhost` / `*.local` / private IPv4(`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`)
- IPv6 literal ホスト名(private/loopback aliasing を避けるため全面 reject)
- 302 等でリダイレクトする URL(`fetch` は `redirect: 'error'` で追従しない)

内部ネットワークの URL やリダイレクトを挟む URL を渡すとエラーメッセージが返るので、リダイレクトしない公開 URL を直接指定する。

### 画像2枚を横並び(image-row)にする

本文に画像を横並びで置くには ```image-row フェンスを使う(必ず画像2枚):

    ```image-row
    ![media:79](左のキャプション)
    ![media:78](右のキャプション)
    ```

- id は `upload_media` で作成した media の id。caption は省略可(`![media:79]()`)。
- image-row を含む既存記事も `get_post` で本文(フェンス込みの Markdown)を取得でき、`update_post` で編集できる(`bodyEditable: true` が返る)。
- フェンス内は「ちょうど2行」の `![media:<id>](caption)` のみ許可。それ以外の行数や、存在しない media id を指定すると `create_post` / `update_post` がエラーを返す。

## works 入稿

`/works` に載る制作物(`works` collection)も MCP から入稿できる。ツールは `list_works` / `get_work` / `create_work` / `update_work` / `publish_work` の 5 つ(削除ツールは無い — ポートフォリオの誤削除を避けるため、削除は admin UI で行う)。

1. (任意)`upload_media` でサムネイル・本文画像を登録し、`id` を控える
2. `create_work`(常に draft。`slug` は blog と同じ規則、`type` は `production` / `talk` / `support`、`date` は `YYYY-MM-DD` 必須)
3. admin UI の Live Preview で目視確認(`adminURL` が返る)
4. `publish_work`(最新 draft の全フィールドを再送して公開。`/works/<slug>` の URL が返る)

- `thumbnailMediaID` は任意。未設定なら詳細ページにプレースホルダが出る。`update_work` で `null` を渡すと外せる
- `url` を設定すると、一覧・年表のリンク先がサイト内の詳細ページではなくその外部 URL になる。`update_work` で `null` を渡すと外せる(`description` も同様)
- `bodyMarkdown` は任意。書き方(`![media:<id>](alt)`、image-row フェンス、table、newTab ポリシー)は blog の `create_post` / `update_post` と完全に同じ。本文未設定の work は `get_work` が `bodyMarkdown: ""` を返す
- `update_work` は指定したフィールドだけを draft version として保存する。公開版への反映は `publish_work` が必要

## アクセス失効(漏洩時)

認可は Access 側にあるので、KV の grant / token を消す手順は無い（`OAUTH_KV` は廃止）。恒久的に効く順に:

1. **ポリシーから外す**: 再利用ポリシー `naporitan` の include から email を外す。`naporitan` は `/admin*` と `/mcp` の両方の Access アプリが共有しているので、MCP と admin の認可が同時に変わる。
2. **Access のセッションを失効させる**: Zero Trust ダッシュボードで該当 user の Access セッションを失効させる（画面名は Cloudflare 側の更新で変わる）。access token の TTL は 15 分、grant は 336 時間なので、失効させないと最大その間は使える。1 と合わせて行う。
3. **（一時的な停止）Payload の user を消す**: `/mcp` は email で既存 user を引けないと 403 を返すので、JWT が生きていても即座に止まる。ただし恒久策ではない。admin の plugin は、Access を通った `/admin` への次回アクセスで user を自動作成し直すため（`docs/cloudflare-access.md`）、その後は `/mcp`（find のみ）も再び通る。MCP だけを止める独立のスイッチではない。

## 制約

- image-row block は上記フェンス構文で Markdown 往復に対応済み。今後 image-row 以外の独自 block が追加された場合、対応済み block(`src/lib/mcp/markdown/index.ts` の `SUPPORTED_BLOCK_TYPES`)に含まれていなければその記事は MCP から本文更新不可(get_post が bodyEditable: false を返す)
- `next dev`(localhost:3000)は worker シェルを経由せず、`CF_ACCESS_MCP_AUD` も空なので `/api/mcp` は 500 になる。動作確認は staging で行う（Portal 経由）
