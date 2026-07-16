# MCP blog 入稿 — 接続・運用 runbook

## 初回セットアップ(未完了)

以下は staging E2E 検証を始める前に必要な作業。`wrangler.toml` の `OAUTH_KV` binding は現在 3 箇所とも placeholder id(`00000000000000000000000000000000`)のままで、今回使用したトークンには KV write 権限がないため実施できていない。

1. KV write 権限のあるトークンで namespace を作成し、`wrangler.toml` の placeholder id 3 箇所(main / `env.staging` / `env.production`)を実 ID に置換する。

   ```bash
   CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72 pnpm wrangler kv namespace create OAUTH_KV
   CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72 pnpm wrangler kv namespace create OAUTH_KV --env staging
   CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72 pnpm wrangler kv namespace create OAUTH_KV --env production
   ```

2. staging へ deploy する(`staging-deploy-seed` skill の手順)。
3. staging E2E(下記フローに準じる 10 項目: 401 + WWW-Authenticate 確認 → ヘッダー偽造遮断確認 → oauth-authorization-server メタデータ確認 → Claude Code 接続 → list_posts → upload_media/create_post の round-trip 確認 → publish_post の最新 draft 反映確認 → claude.ai Connectors 接続 → image-row block を含む記事の bodyEditable=false 確認 → cursor WebSocket(/api/cursors)の upgrade(101)が OAuthProvider ラップ後も生きていることを確認)を実施する。

これらが完了するまで、以下の runbook は本番相当の動作確認が取れていない。

## エンドポイント

- 本番: `https://napochaan.com/mcp`
- staging: `https://stg.napochaan.com/mcp`(Cloudflare Access 配下のため要 Access 通過)

## クライアント接続

### Claude Code

    claude mcp add --transport http napochaan-blog https://napochaan.com/mcp

初回ツール実行時にブラウザが開き、Payload の email/password でログイン → 許可。

### claude.ai(Web / モバイル)

Settings → Connectors → Add custom connector → URL に `https://napochaan.com/mcp`。
認証は OAuth(Dynamic Client Registration)で自動。ログイン画面は Payload アカウント。

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

## トークン失効(漏洩時)

grant と access token は KV(`OAUTH_KV`)に別キーで保存されている。`@cloudflare/workers-oauth-provider` の request-time 検証は `token:<userId>:<grantId>:<tokenId>` のみを読む(`grant:` キーは再照会しない)ため、**grant キーを消すだけでは既発行の access token は無効化されない** — TTL(1 時間)が切れるまで使え続ける。grant キーと対応する token キーの両方を削除すること。

    export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
    # 1. grant を一覧して対象の grantId を特定(userId は Payload users の id)
    pnpm wrangler kv key list --binding OAUTH_KV --env production --prefix "grant:"
    # 2. その grant にぶら下がる token キーを一覧
    pnpm wrangler kv key list --binding OAUTH_KV --env production --prefix "token:<userId>:<grantId>:"
    # 3. 2 で返った token キーをすべて削除
    pnpm wrangler kv key delete --binding OAUTH_KV --env production "token:<userId>:<grantId>:<tokenId>"
    # 4. grant キーを削除(refresh はこれで無効化される。以後の再発行を止める)
    pnpm wrangler kv key delete --binding OAUTH_KV --env production "grant:<userId>:<grantId>"

access token の TTL は 1 時間。token キーの削除漏れがあっても、その 1 時間が最悪の露出窓になる(refresh は grant 削除で止まるので、無限に使われ続けることはない)。

全失効したい場合は `token:` / `grant:` prefix のキーを全削除。

## 制約

- 本文に image-row 等の独自 block を含む記事は MCP から本文更新不可(get_post が bodyEditable: false を返す)
- `next dev`(localhost:3000)は worker シェルを経由しないため OAuth フローは動かない。動作確認は staging で行う
