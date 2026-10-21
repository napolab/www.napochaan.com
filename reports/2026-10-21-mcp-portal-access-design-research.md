# /mcp を OAuthProvider なしで Cloudflare Access + MCP Server Portal に載せる設計調査

調査日: 2026-10-21 / 前回: `reports/2026-10-05-mcp-portal-access-research.md`(大筋は有効。本書は差分と設計判断に絞る)
Cloudflare の状態は cf CLI(`--profile napochaan`)の read 系コマンドで 2026-10-21 23 時台 JST に取得した。設定変更はしていない。

---

## 結論

- **`inbox` と同じ構成をそのまま使うのが正解**。`inbox` はこのアカウントで実際に動いている構成で、中身は次の 3 点。
  1. upstream のホストを self-hosted Access アプリで守り、**Managed OAuth を ON** にする。
  2. Portal には `auth_type: oauth`(DCR)・`on_behalf: true` で登録する。
  3. origin(Worker)が `Cf-Access-Jwt-Assertion` を自前で検証する。
- この構成なら worker 側に OAuth サーバーも DCR も KV も要らない。**OAuthProvider / `OAUTH_KV` / `/oauth/authorize`(パスワード同意)は全部消せる**。
- 本人の申告では Claude Desktop(Anthropic のサーバー経由で繋ぐ broker)→ Portal → `inbox` は今も動いている。このアカウントでは「Portal 経由なら hosted connector が通る」ことが実測で確定している。claude-ai-mcp #410 / #980 は**直結**(claude.ai → Managed OAuth のアプリ)の問題なので、Portal 経由では回避できる。
- **設計を左右する未確認点が 1 つある**。動作例(inbox・docs)はどれも**ホスト全体**の Access アプリだが、napochaan.com はサイト本体が公開なので **`napochaan.com/mcp` のパス単位アプリ**にする必要がある。パス単位のアプリで Access が well-known メタデータを応答するかは docs に書かれておらず、試した例もない。staging で最初にこれを確かめる。だめなら、**MCP 専用のサブドメイン(同じ Worker に custom_domain を 2 つ目として足す)**にすれば inbox と 1:1 で同じ構成になる。

---

## 1. `inbox` の構成(実測)

### Cloudflare 側

| リソース                           | ID / 値                                                                                               | 要点                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portal                             | `napochaan-mcp-portal`(`mcp.napochaan.com`、Code Mode `opt_in`)                                       | servers は `inbox` のみ                                                                                                                                                                                                                                                                                              |
| Portal の Access アプリ            | `e952cfde…`(type `mcp_portal`、aud `36c29220…`)                                                       | Managed OAuth ON。DCR の allowed_uris は `https://claude.ai/api/mcp/auth_callback` と `https://claude.com/api/mcp/auth_callback`。localhost / loopback を許可。grant 336h / access token 15m                                                                                                                         |
| Portal の server mapping           | `inbox` → `https://inbox.napochaan.com/mcp`                                                           | `auth_type: oauth`、`on_behalf: true`(Require user auth)、`is_shared_oauth_callback_enabled: false`                                                                                                                                                                                                                  |
| **upstream の self-hosted アプリ** | `cf6817eb…`(destination は `inbox.napochaan.com` のホスト全体、aud `27635f21…`)                       | **Managed OAuth ON**。DCR の allowed_uris は `https://mcp.napochaan.com/servers-callback`、`https://dash.cloudflare.com/cda8b0a2…/one/access-controls/ai-controls/mcp-server/oauth-callback/*`、`https://claude.ai/api/mcp/auth_callback`。grant 336h / 15m。ポリシーは再利用ポリシー `naporitan`(本人の email のみ) |
| mcp 種別アプリ                     | `a1a506df…`(type `mcp`、destination `via_mcp_server_portal`(`mcp_server_id: inbox`)、aud `1fdd0ba5…`) | Portal 内でサーバーを**誰に見せるか**を決めるアプリ。直 URL へのアクセスは防がない(docs の Caution)。CORS は全許可                                                                                                                                                                                                   |

- **server の状態**: `status: stale`、`error: "Authorization failed: needs_reauth"`、`last_successful_sync: 2026-10-08 08:20`。
  - 336h の grant が切れたのとほぼ同じ時期で、**管理者資格情報が黙って失効する**ことを実際に確認できた。
  - `on_behalf: true` なので、ユーザー自身の grant でのツール呼び出しは続けられる。止まるのはツール一覧のバックグラウンド同期だけ(docs: DCR サーバーは約 2 時間ごとに管理者資格情報で同期する)。

### upstream(napolab/inbox.napochaan.com)のコード

- Cloudflare 公式の agentic inbox テンプレートを fork したもの。`workers/app.ts` は Hono の `app.use('*')` で次を行う。
  - `cf-access-jwt-assertion` が無ければ 403。
  - jose の `createRemoteJWKSet(<team>/cdn-cgi/access/certs)` + `jwtVerify({ issuer, audience: POLICY_AUD })` で検証し、失敗したら 403。
  - `POLICY_AUD` / `TEAM_DOMAIN` が未設定なら 500(fail closed)。
- worker 自身は OAuth の実装を持たない(`agents/mcp` の `McpAgent.serve('/mcp')`)。email も読まず、Access を通れば全権という前提。
- `TEAM_DOMAIN = https://napochaan.cloudflareaccess.com`(wrangler.jsonc)。`POLICY_AUD` は Worker secret で中身は読めない。README によると one-click Access の modal に出る値で、one-click が作る self-hosted アプリ(`cf6817eb`、aud `27635f21…`)の AUD **と推定**できる。
  - inbox は aud を 1 つしか許可しておらず、それで Portal 経由の呼び出しが通っている。ここから、**Portal 経由で origin に届く JWT の `aud` は upstream の self-hosted アプリの AUD**(mcp 種別アプリ `1fdd0ba5…` のものではない)と推定する。**未確定**なので staging で JWT を decode して確かめる。

### 実測した Access の Managed OAuth 応答(未認証)

| リクエスト                                                  | 応答                                                                                                                                                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST https://inbox.napochaan.com/mcp`                      | `401`。`WWW-Authenticate: Bearer realm="OAuth", error="invalid_token", …, resource_metadata="https://inbox.napochaan.com/.well-known/cloudflare-access-protected-resource/mcp"`                                |
| `GET /.well-known/cloudflare-access-protected-resource/mcp` | `200`。`{"resource":"https://inbox.napochaan.com/mcp","protected":true,"authorization_servers":["https://napochaan.cloudflareaccess.com"],…}`(Cloudflare 独自のパス。**リクエストパスを接尾辞として付ける形**) |
| `GET /.well-known/oauth-protected-resource`、同 `/mcp`      | `200`。RFC 9728 の PRM(resource は host、または host+`/mcp`)                                                                                                                                                   |
| `GET /.well-known/oauth-authorization-server`               | issuer は `https://napochaan.cloudflareaccess.com`、`authorization_endpoint`・`token_endpoint`・`registration_endpoint` は `…/cdn-cgi/access/oauth/*`、`S256` のみ                                             |

比較: 今の `napochaan.com/mcp` は OAuthProvider が `401` と `resource_metadata="https://napochaan.com/.well-known/oauth-protected-resource/mcp"` を返す(AS は napochaan.com 自身)。`napochaan.com/.well-known/cloudflare-access-protected-resource/mcp` は 404。

---

## 2. Cloudflare 公式ガイダンスの要点

- **upstream の認証方式**(`auth_type`): 次の 3 種類だけ。[MCP server portals]
  - `oauth`: DCR、または手動 client。
  - `bearer`: `Authorization: Bearer <固定値>`、または `{"headers":{…}}` で指定したカスタムヘッダー。docs は「The portal forwards all headers verbatim」と書いている。
  - `unauthenticated`
- 「**Access で守られた upstream**」という専用の auth_type は無い。Access で守るなら、upstream の Access アプリで Managed OAuth を ON にし(= Access が upstream の OAuth サーバーになる)、Portal は `oauth` で登録する。docs の記述:
  - Portal: 「Blocked users can still connect to the server … by using its direct URL. If you want to enforce authentication through Cloudflare Access, configure Access as the server's OAuth provider」
  - Managed OAuth: 「The MCP server must validate the Access JWT sent in the `Cf-Access-Jwt-Assertion` header」「Do not enable Managed OAuth for third-party MCP server code that … cannot validate Access JWTs」[Managed OAuth][Secure MCP servers]
- **身元の転送**: Portal が独自に user JWT を付ける仕組みは docs に無い。Portal が upstream に付ける追加ヘッダーとして書かれているのは `X-Forwarded-User-Agent` だけで、docs は「認証に使うな」としている。
  - 身元が origin に届く仕組みは Managed OAuth のほう。Access が opaque トークン(`oauth:…`)をエッジで解決し、origin へは「a signed assertion」(= `Cf-Access-Jwt-Assertion`)を付けて転送する。「From your origin's perspective, the request looks the same as a browser-authenticated request」。[Managed OAuth#token-format]
  - `on_behalf: true` なら grant はユーザーごとなので、JWT の email はその利用者になる。`false` なら管理者資格情報の email になる。
  - **aud はどのアプリのものかが docs に書かれていない**(上記の推定を参照)。
- **mcp 種別アプリ**: dashboard で「Add MCP server」を実行すると作られる。Allow ポリシーに一致したユーザーにだけ、Portal 内でそのサーバーを表示する。直 URL へのアクセスは防がない。service token で使う場合は、ここにも Service Auth ポリシーが要る。docs は Managed OAuth を「MCP server application」にも付けられると書いているが、inbox はそうせず、別に self-hosted アプリを作っている。
- **callback の allowlist**(upstream の DCR `allowed_uris` に入れるもの):
  - 管理者用: `https://dash.cloudflare.com/<account>/one/access-controls/ai-controls/mcp-server/oauth-callback/<server-id>`
  - ユーザー用: `https://<portal-host>/servers-callback`(shared callback が OFF の場合)
  - shared callback が ON の場合: `https://oauth-callbacks.cloudflareaccess.com/cdn-cgi/access/outbound-oauth-callback`
- **管理者による初回の upstream OAuth は dashboard でしかできない**(「Save and connect server」)。
- **service token**: Portal アプリと各サーバーの Access アプリの両方に Service Auth ポリシーを付け、`on_behalf: false` にする。`on_behalf: true` のサーバーは service token のセッションから除外される。

---

## 3. アーキテクチャ案

### 案 A(推奨): `napochaan.com/mcp` のパス単位アプリ + Managed OAuth(inbox と同じ構成)

**Cloudflare 側の設定**(stg / prod それぞれ。stg は `stg.napochaan.com/mcp`):

1. self-hosted Access アプリを作る。
   - `destinations: [{type: public, uri: "napochaan.com/mcp"}]`。`/mcp/*` も要るかは staging で確認する。パスは完全一致を推奨(#992 の `/mcp/` 末尾スラッシュの事例があるため)。
   - ポリシーは再利用ポリシー `naporitan`、`allowed_idps` は既存の IdP、`auto_redirect_to_identity: true`。
2. `oauth_configuration`:
   - `enabled: true`
   - `dynamic_client_registration`: `enabled: true`、`allow_any_on_localhost` / `allow_any_on_loopback` は `true`、`allowed_uris` は `https://mcp.napochaan.com/servers-callback` と `https://dash.cloudflare.com/cda8b0a2b410e1ff3a5bcc72c7e46f72/one/access-controls/ai-controls/mcp-server/oauth-callback/*`、直結も残すなら `https://claude.ai/api/mcp/auth_callback` と `https://claude.com/api/mcp/auth_callback`
   - `grant`: `session_duration: 336h`、`access_token_lifetime: 15m`
3. dashboard の MCP Portals → MCP servers → Add:
   - HTTP URL は `https://napochaan.com/mcp`。Server ID は `napochaan`(staging は `napochaanstg` のように**アンダースコアなし**)。OAuth は Automatic(DCR)。
   - 「Save and connect server」で管理者の OAuth を通す。このとき mcp 種別アプリが自動で作られるので、ポリシー `naporitan` を付ける。
4. Portal `napochaan-mcp-portal` にサーバーを追加し、Require user auth を **ON** にする。
   - API の PUT portal は `servers` 配列を**全体置換**するので、`inbox` を含めた全サーバーを送ること。
   - ツール名は `napochaan_create_post` のような namespace 付きになる。

**コードの変更**:

- `worker/worker.ts`: `OAuthProvider` と `mcpAPIHandler` を削除し、`export default { fetch: app.fetch }` にする。DO の re-export は残す。
- `worker/routes/mcp.ts`(新規、Hono): `/mcp` で次を行う。
  1. `Cf-Access-Jwt-Assertion` を `packages/payload-cloudflare-access` の `verifyAccessJWT` + `createAccessKeys`(module scope で 1 回だけ作る)で検証する。`type: app` と email の必須チェックは関数の中で済む。
  2. `createPayloadUserStore` + `resolveAccessUser` で email → Payload user を引く。
  3. 今と同じく pathname を `/api/mcp` に書き換え、**`x-mcp-user-id` を付けて** `handlerFetch` に in-process forward する。
  - 失敗時の応答は inbox に合わせる。JWT が無い・不正なら 403(401 にすると、成功しようのない OAuth フローにクライアントを誘導する)。env が未設定なら 500(fail closed)。
  - **未決事項**: package の auto-create(admin と揃う)を使うか、find のみにするか。MCP からユーザーが作られるのは不自然なので、find のみを推奨。
- env: `CF_ACCESS_TEAM_DOMAIN = "napochaan"` は stg に既にある。`CF_ACCESS_AUD` に `/mcp` アプリの AUD を足すか、MCP 専用の `CF_ACCESS_MCP_AUD` を新設する。admin 用の AUD を `/mcp` で受け付けないよう、**専用の変数を推奨**。カンマ区切りで複数受けられる形は維持する(aud が未確定のため)。
- `src/app/api/mcp/route.ts`、`create_upload_url`(`userID` で署名)、`/api/media-upload`(`findByID`)は**変更不要**。`x-mcp-user-id` を維持するため。
- `worker/routes/mcp-guard.ts` と順序テストは**残す**(外部からの `/api/mcp` は 404)。
- `worker/middleware/cache-control`: `/mcp` が Hono を通るようになるので、`/mcp` を `PRIVATE_POLICY` に追加する(今カバーされているのは `/api/mcp` だけ)。
- 削除: `src/app/(site)/oauth/authorize/**`、`src/lib/mcp/oauth/**`、`wrangler.toml` の `OAUTH_KV` 3 か所、`pnpm remove @cloudflare/workers-oauth-provider`、path-policy のテストにある `/oauth/authorize` の参照。docs(`mcp-blog-authoring.md`、`cloudflare-access.md` の「MCP の同意画面」)と `.claude/rules/isr-revalidation.md` も更新する。

**評価**:

- Claude Desktop → Portal: inbox と同じ経路なので**通る見込み**。
- ユーザーごとの身元: JWT の email → Payload user の順で届く。
- staging: stg のホスト全体アプリ(`7bc9e2a4`、Managed OAuth なし、自宅 IP の Bypass あり)とは、より具体的なパスが優先されるので共存できる。
- **未確認点(staging で最初に潰す)**: パス単位のアプリで、Access が次の 3 つを応答するか。
  - `/.well-known/oauth-authorization-server`(ホストのルート、アプリのパス外)
  - `/.well-known/cloudflare-access-protected-resource/mcp`
  - `/.well-known/oauth-protected-resource/mcp`
  - 同時に、`/mcp` が 302 ではなく `401 + WWW-Authenticate` を返すか。どれかが origin(Next)に落ちて 404 になるなら案 A' に切り替える。

### 案 A'(A が不成立のときの代替): MCP 専用ホスト名 + ホスト全体アプリ

- `wrangler.toml` の各 env に 2 つ目の `custom_domain` route(例: prod `blog-mcp.napochaan.com`、stg `stg-blog-mcp.napochaan.com`)を足す。
  - Universal SSL は 1 階層までなので、`mcp.stg.…` のような 2 階層は避ける。
  - `mcp.napochaan.com` は Portal が使っているので別の名前にする。
- self-hosted アプリはホスト全体にする。設定は inbox の `cf6817eb` と同じ。
- worker 側: Hono で、そのホストでは `/mcp` だけを通して他は 404 にする host gate を足す。それ以外は案 A と同じ。
- 利点: inbox と 1:1 で同じ構成になり、well-known の問題が消える。サイト本体のホストに Managed OAuth の 401 挙動が混ざらない。
- 欠点: ホスト名が増える。BASE_URL・OG・ISR に影響が出ないことを確認する(MCP の応答は `siteBaseUrl` = BASE_URL から作るので影響は小さい)。

### 案 B(非推奨・保険): Portal の bearer カスタムヘッダーで service token を送る

- Portal のサーバーを `auth_type: bearer`、`auth_credentials: {"headers":{"CF-Access-Client-Id":…,"CF-Access-Client-Secret":…}}` で登録する。upstream の Access アプリには Service Auth ポリシーを付ける(Managed OAuth は不要)。
- origin に届く JWT は service token 型になる。`email` が無く、`common_name` に client id が入る。worker は `common_name` を照合し、固定の user(本人)に割り当てる。今の verify は email が必須なので、別の関数が要る。
- 利点: OAuth の grant が無いので、stale / reauth が起きない(inbox で実際に起きている失効を回避できる)。
- 欠点:
  - ユーザーごとの身元が届かない。Portal を通れる人は全員、本人として書き込める。
  - secret を Portal に預けることになり、ローテーション(service token の期限)の運用が要る。
  - 直結クライアントは Access の service token ヘッダーを送れない。
- 単一ユーザーなら実害は小さいが、「Access に身元を委ねる」という目的から外れる。

### 不採用: Access for SaaS(OIDC)で worker が OAuth client になる構成

Cloudflare 公式サンプル(`remote-mcp-cf-access`)の構成は `workers-oauth-provider` + `OAUTH_KV` を前提にしている。KV を消すという目的と矛盾するので採らない。

---

## 4. 移行・ロールアウト

1. **stg で検証**(案 A の未確認点 → aud の実測 → 機能)。
   - `curl -i -X POST https://stg.napochaan.com/mcp` が 401 を返し、`WWW-Authenticate` が Access のものであること。
   - 上の well-known 3 本。
   - Portal 経由で `list_posts` を呼び、worker のログで JWT の `aud`・`email`・`type` を確認する。
   - 偽の `Cf-Access-Jwt-Assertion` が拒否されること。`/api/mcp` が 404 のままであること。`/api/cursors` の WS が 101 を返すこと。
   - `create_upload_url` → `POST /api/media-upload` の往復。
   - 失敗の形として #992 のパターンに注意する: 認証後の POST が origin に届かず、Access 層が 200 と空 body を返す。
2. **コードの PR は 1 つにまとめ、revert できる単位にする**。KV namespace 本体(`napochaan-mcp-oauth-{staging,production}`)は安定するまで消さない(ロールバック用)。OAuthProvider の grant と token は worker から外れた時点で使われなくなる。失効作業は不要。
3. **既存クライアントの付け替え**: `napochaan.com/mcp` に直結している connector(Claude Desktop / claude.ai / Claude Code)は 401 の発行元が変わるので、いったん削除して、Portal(`https://mcp.napochaan.com/mcp`)経由で付け直す。Claude Code は Portal にも直結にも Access の OAuth で繋がる見込み。
4. **prod の Access 有効化と同時に進められる**: `docs/cloudflare-access.md` のとおり、`CF_ACCESS_*` を入れると `/oauth/authorize` は承認できなくなる。この移行が済めば、prod で admin の Access 化を止めていた制約が消える。
5. **運用 runbook に入れること**:
   - 管理者の grant(336h)が切れると server が stale になり、ツール同期が止まる。ツールを追加・変更したら、dashboard で reauthenticate → Sync を実行する。
   - 新しいツールはデフォルトで有効になる。

---

## リスク

| リスク                                                                 | 状態 / 対策                                                                                                                                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| パス単位アプリで Managed OAuth のメタデータが応答されない              | 未検証。stg で最初に確かめ、だめなら案 A' に切り替える                                                                                                           |
| origin に届く JWT の `aud` がどのアプリのものか                        | 推定は upstream の self-hosted アプリの AUD。AUD を複数許可できる形のまま stg で実測する                                                                         |
| 管理者資格情報の黙った失効                                             | inbox で実際に発生中(10-08 以降 stale)。`on_behalf: true` で利用は続けられる。同期だけ手動で戻す                                                                 |
| claude.ai → Managed OAuth 直結の不具合                                 | #980 は open(2026-09-09 以降動きなし)、#410 と #992 は not planned で close。Portal 経由なら回避できる(本人が inbox で実測済み)                                  |
| #992 の形(Access が 200 と空 body を返す)                              | Anthropic のコメントによると、認証済みの POST が origin に届いていなかった。パスの一致(末尾スラッシュ)を確認する                                                 |
| Portal のボディ上限・タイムアウト                                      | docs に記載なし。大きなファイルは `create_upload_url`(Portal を通らない)を使う運用を維持する                                                                     |
| CSRF(ブラウザの `CF_Authorization` cookie 経由で `/mcp` に JWT が付く) | MCP transport は `Accept`(json+sse)と `Content-Type: application/json` を必須にするので、simple request では通らない。それでも Origin ヘッダーの検査を足すと安全 |

---

## Sources

- [MCP server portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/)(Last updated 2026-10-12): auth_type 3 種、on_behalf、direct URL の Caution、callback URL、service token、X-Forwarded-User-Agent
- [Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/)(2026-07-01): 対応するアプリ種別、opaque トークン → `Cf-Access-Jwt-Assertion`、401 + WWW-Authenticate、`oauth_configuration` の各フィールド
- [Secure MCP servers](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/secure-mcp-servers/)(2026-08-25): Managed OAuth は JWT を検証するサーバーにだけ使う。SaaS(OIDC)構成は OAUTH_KV が前提
- [Linked apps](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/linked-apps/)(2026-07-01): self-hosted の MCP サーバーは `Cf-Access-Jwt-Assertion` を受け取り、OAuth の実装は不要
- [Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)(2026-04-17): より具体的なパスが優先され、親のルールは継承しない
- GitHub `napolab/inbox.napochaan.com`: `workers/app.ts`(JWT 検証 middleware)、`wrangler.jsonc`(TEAM_DOMAIN、POLICY_AUD は secret)、`README.md`(one-click Access の POLICY_AUD)
- anthropics/claude-ai-mcp: [#410](https://github.com/anthropics/claude-ai-mcp/issues/410)(closed not planned 2026-06-07)、[#478](https://github.com/anthropics/claude-ai-mcp/issues/478)(closed 2026-06-29。原因は DCR allowed_uris に claude.ai の callback が無かったこと)、[#980](https://github.com/anthropics/claude-ai-mcp/issues/980)(open、最終更新 2026-09-09)、[#992](https://github.com/anthropics/claude-ai-mcp/issues/992)(closed not planned 2026-10-12。Access 層が 200 と空 body を返したという分析)
- cf CLI での実測(2026-10-21 JST): `mcp portals list`、`mcp servers list`、`zero-trust access applications list/get`(cf6817eb / a1a506df / e952cfde / 7bc9e2a4 / 7e46b0a0)
- curl での実測(2026-10-21): `inbox.napochaan.com` の `/mcp`、各 `/.well-known/*`、および現行の `napochaan.com/mcp`
- repo: `worker/worker.ts`、`worker/app.ts`、`worker/routes/mcp-guard.ts`、`src/app/api/mcp/route.ts`、`src/app/api/media-upload/route.ts`、`src/lib/mcp/tools/index.ts`(`signUploadURLParams` の `userID`)、`packages/payload-cloudflare-access/src/{verify,strategy,resolve-user}`、`wrangler.toml`、`docs/cloudflare-access.md`
