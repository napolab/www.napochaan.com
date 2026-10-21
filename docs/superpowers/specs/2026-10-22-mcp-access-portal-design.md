# MCP を Cloudflare Access + MCP Portal に移す(②)— 設計

- 日付: 2026-10-22
- 前提: PR #53(admin の Access 自動ログイン)、PR #58(stg で有効化)、Next 16 / Payload 3.91(PR #55–#57)
- 調査: `reports/2026-10-21-mcp-portal-access-design-research.md`(MCP Portal・inbox の構成・案の比較)、`reports/2026-10-05-mcp-portal-access-research.md`(初回調査)

## 1. 何のためか

本人の目的は、www.napochaan.com から email + password による認証をなくし、認証を **Cloudflare Access に完全に任せる**こと。

admin(`/admin*`)は PR #53 で Access 自動ログインになり、stg では有効化済み。残っているのは MCP。`/mcp` は今 `@cloudflare/workers-oauth-provider` が自前の OAuth(DCR、`/oauth/authorize` での **password による同意**、`OAUTH_KV`)を持っている。これが残る限り Payload の password ログインを本番で無効にできない(同意画面が password を要るため)。

MCP クライアントは主に **Claude Desktop**。Claude Desktop → MCP Portal(`mcp.napochaan.com`)→ upstream という経路は、同じアカウントの `inbox` で本人が実際に使えている。

## 2. ゴール / 非ゴール / アンチゴール

**ゴール**

- `/mcp` を Access(パス単位アプリ + Managed OAuth)で守り、MCP Portal 経由で使えるようにする(stg・本番の両方)。
- OAuthProvider、`OAUTH_KV`、`/oauth/authorize`・`/oauth/token`・`/oauth/register`、password 同意画面をコードと設定から消す。
- 本番でも admin の Access 自動ログインを有効にする(= 本番で Payload の password ログインが無効になる)。
- Access は `napochaan.com`(stg は `stg.napochaan.com`)の **`/admin*` と `/mcp` だけ**に掛ける(本人の決定)。

**非ゴール**

- MCP ツールそのもの(`src/lib/mcp/tools/**`)の挙動・スキーマの変更。
- ローカル開発の admin 認証の変更(ローカルは Access 無し・password ログインのまま。`CF_ACCESS_*` は top-level `[vars]` に置かない)。
- ローカルでの MCP の動作確認手段の維持。ローカルの `next dev` で `/api/mcp` に `x-mcp-user-id` を付けて直接叩く方法は**なくなってよい**(本人の決定)。MCP の動作確認は stg で行う。dev 専用の検証スキップは作らない。
- 専用サブドメインでの MCP(案 A')。本人が `/mcp` と `/admin*` のパス単位を選んだ。

**アンチゴール(動いても失敗とみなす)**

- 本番で、移行後に MCP が使えない期間が「Cloudflare 設定 → deploy」の手順外で生じること。
- Access の JWT を検証せずに `x-mcp-user-id` を信用する経路が残ること(外部から `/api/mcp` を直接叩けること)。
- `/admin` 用の Access JWT で `/mcp` が通る、またはその逆(AUD の取り違え)。
- MCP 経由で Payload user が新しく作られること。

## 3. 構成

```
Claude Desktop ──▶ MCP Portal (mcp.napochaan.com)
                     │ Access Managed OAuth(DCR、本人の同意 = Access ログイン)
                     ▼
        napochaan.com/mcp  ← Access パス単位アプリ(Managed OAuth ON、policy naporitan)
                     │ Access が Cf-Access-Jwt-Assertion を付けて origin へ
                     ▼
        worker: /mcp ルート(Hono)
           pathname を /api/mcp に書き換えて OpenNext へ in-process forward するだけ
           (Cf-Access-Jwt-Assertion はそのまま通す)
                     ▼
        src/app/api/mcp/route.ts
           1. Cf-Access-Jwt-Assertion を検証(MCP 用 AUD のみ)
           2. email → 既存 Payload user を探す(作らない)
           3. その user で MCP を処理(x-mcp-user-id は廃止)
```

JWT の検証と user の特定は Next 側(`route.ts`)で行う。worker 層には Payload も D1 クエリも無く、`createPayloadUserStore` は Payload インスタンスを要るため(builder check で判明)。`route.ts` が自分で JWT を検証するので、「検証せずに user id ヘッダーを信じる経路」そのものが無くなる。外部からの `/api/mcp` 直叩きは引き続き `mcp-guard` が 404 にする(多層防御)。

### 3.1 Cloudflare 側(stg / 本番それぞれ)

stg での実測(2026-10-21、spike で作成 → 削除済み)で次を確認済み:

- パス単位アプリ `stg.napochaan.com/mcp` に Managed OAuth を ON にすると、MCP クライアントの `POST /mcp` に Access が `401` + `WWW-Authenticate: Bearer … resource_metadata="https://<host>/.well-known/cloudflare-access-protected-resource/mcp"` を返す。ブラウザの `GET /mcp` は Access ログインへ `302`。
- `/.well-known/cloudflare-access-protected-resource/mcp` は Access が `200` で返し、`authorization_servers: ["https://napochaan.cloudflareaccess.com"]`。
- チームの AS メタデータ(`https://napochaan.cloudflareaccess.com/.well-known/oauth-authorization-server`)は `registration_endpoint`・S256 PKCE・`none` 認証を持つ。
- アプリ作成・削除の反映には 1 分程度かかり、その間 404 が返ることがある。

作るもの:

| 対象                     | stg                                    | 本番                 |
| ------------------------ | -------------------------------------- | -------------------- |
| `/admin*` パス単位アプリ | 作成済み(`7e46b0a0…`、AUD `8c2707d7…`) | 新規(stg と同じ設定) |
| `/mcp` パス単位アプリ    | 新規                                   | 新規                 |
| MCP Portal の server     | 新規 `napochaanstg`                    | 新規 `napochaan`     |

`/mcp` アプリの設定(inbox `cf6817eb…` を写す):

- `type: self_hosted`、`domain: <host>/mcp`、policy は再利用ポリシー `naporitan`(`a4d62373…`、本人の email のみ allow、bypass 無し)、IdP は GitHub-naporin0624(`72061233…`)、`session_duration: 24h`、`http_only_cookie_attribute: true`、`app_launcher_visible: false`
- `oauth_configuration`: `enabled: true`、`grant: { session_duration: 336h, access_token_lifetime: 15m }`、`dynamic_client_registration: { enabled: true, allowed_uris: ["https://mcp.napochaan.com/servers-callback", "https://dash.cloudflare.com/cda8b0a2b410e1ff3a5bcc72c7e46f72/one/access-controls/ai-controls/mcp-server/oauth-callback/*"], allow_any_on_localhost: true, allow_any_on_loopback: true }`
- claude.ai 直結用 callback は入れない(Portal 経由のみ)。

MCP Portal(`napochaan-mcp-portal`):

- server を `auth_type: oauth`(DCR)で登録。server id はアンダースコア無し(`napochaan` / `napochaanstg`)。
- 管理者の初回 OAuth(「Save and connect server」)は dashboard でしかできない → **本人の操作**。
- Portal への追加は API の PUT が `servers` 配列を全体置換するので、`inbox` を含めた全 server を送る(または dashboard で追加)。Require user auth を ON。

### 3.2 コード

- `worker/worker.ts`: `OAuthProvider` と `mcpAPIHandler` を削除し、`createWorkerApp` の Hono app をそのまま default export(`fetch`)。DO の re-export(`DOQueueHandler`・`CursorRoom`)は残す。
- `worker/routes/mcp/`(新規、`index.ts` + `mcp.test.ts`): `/mcp` を受ける Hono ルート。pathname を `/api/mcp` に書き換え、mount 先の `handlerFetch` に in-process forward するだけ(リクエストヘッダーはそのまま、`Cf-Access-Jwt-Assertion` も通す)。認証の判断はしない。`createWorkerApp` に `mcpGuardRoutes` より前の順序で登録し、順序テストを足す。
- `src/app/api/mcp/route.ts`(+ `route.test.ts`): `x-mcp-user-id` を読むのをやめ、次を小さな関数の合成で行う(`.claude/skills/composing-domain-functions`):
  1. `Cf-Access-Jwt-Assertion` を `packages/payload-cloudflare-access` の `verifyAccessJWT`(team = `CF_ACCESS_TEAM_DOMAIN`、aud = `CF_ACCESS_MCP_AUD`)で検証。鍵は `createAccessKeys` でモジュールスコープに 1 回だけ作る。必要なら package の `exports` に verify を足す。
  2. email → 既存 Payload user を **find のみ**で引く(見つからなければ拒否)。auto-create はしない。
  3. その user で今までどおり MCP を処理する(`create_upload_url` などに渡す user id はここで得たもの)。
  - 失敗時: JWT が無い・不正・user が居ない → `403`(`401` を返すと成功しようのない OAuth フローにクライアントを誘い込む。inbox と同じ扱い)。`CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_MCP_AUD` が未設定 → `500`(fail closed)。
  - Origin(CSRF)検査を足すかは調査レポートの推奨に従ってよい(実装者に任せる)。
- `worker/routes/mcp-guard.ts` と既存の順序テストは残す(外部からの `/api/mcp` は 404 のまま)。
- `worker/middleware/cache-control`: `/mcp` を `PRIVATE_POLICY` の対象に足す(今は Hono を通らなかったので不要だった)。
- env: `CF_ACCESS_MCP_AUD`(MCP アプリの AUD、カンマ区切り可)を新設。admin 用の `CF_ACCESS_AUD` とは混ぜない。`cloudflare-env.d.ts` / `.dev.vars.example` に追加(空)。
- 削除: `src/app/(site)/oauth/**`、`src/lib/mcp/oauth/**`、`@cloudflare/workers-oauth-provider`、`wrangler.toml` の `OAUTH_KV`(各 env の binding 定義)。ホストルートの `/.well-known/oauth-authorization-server`・`/.well-known/oauth-protected-resource*` は OAuthProvider が返していたもので、消えることで Next の 404 になる(Access が自前のメタデータを返すので不要)。
- **KV namespace 本体は消さない**(切り戻し用に残す。binding だけ外す)。
- 変更不要: `create_upload_url`(`userID` で署名)、`/api/media-upload`、MCP ツール群。user id の受け取り元が `route.ts` の中に移るだけで、ツールへの渡し方は変えない。
- docs: `docs/cloudflare-access.md`(MCP の同意画面の節を Portal 手順に置き換え、本番の有効化手順を更新)、`docs/mcp-blog-authoring.md`(接続方法を Portal に)、`.claude/rules/isr-revalidation.md` など `/oauth` を参照している箇所。

### 3.3 リリース順

0. **本番 deploy の凍結(本人の決定)**: 手順 1 の merge から手順 4 の本番 deploy までの間、本番 deploy(手動 dispatch)を行わない。OAuthProvider を消したコードを本番の Access 設定が揃う前に deploy すると本番 MCP が止まるため。コードに旧経路の分岐は残さない。凍結の開始・解除は PR 本文と `docs/cloudflare-access.md` に明記する。
1. **PR(コード + stg 設定)**: 3.2 のコード、`[env.staging.vars]` に `CF_ACCESS_MCP_AUD`。merge 前に stg の `/mcp` アプリを `cf` で作り、その AUD を入れておく。merge → stg 自動 deploy。
2. **stg 検証**: Portal に `napochaanstg` を登録(本人が dashboard で connect)→ Claude Desktop から Portal 経由で `list_posts`・`get_post`・テスト下書き(blog id=3)の update・`create_upload_url` → upload を確認。外部からの `/api/mcp` 直叩きが 404、JWT 無しの `/mcp` が Access で 401 になることを確認。
   - **origin に届く JWT の `aud` と `type` を実測する**(Portal に server を登録すると mcp 種別アプリが自動で作られ、別の AUD を持つ。どちらの AUD が届くかは未確認)。届いた `aud` が設定と違えば、`CF_ACCESS_MCP_AUD` を直す vars だけの追加 PR を出してよい(本人の了承済み)。`type` が `app` でなければ verify の扱いを見直す。
3. **本番の Cloudflare 設定**: 本番の `/admin*`・`/mcp` アプリを作成し AUD を確定。
4. **PR(本番 vars)**: `[env.production.vars]` に `CF_ACCESS_TEAM_DOMAIN`・`CF_ACCESS_AUD`(admin)・`CF_ACCESS_MCP_AUD`。merge 後、本番 deploy(手動 dispatch)。
5. **本番検証**: Portal に `napochaan` を登録・connect、Claude Desktop の既存コネクタ(`napochaan.com/mcp` 直結)を外して Portal 経由に付け直す。admin の自動ログイン確認。ここで本番 deploy の凍結を解除する。
6. 安定後(別作業): `OAUTH_KV` namespace を削除。

切り戻し: `CF_ACCESS_*` を消して deploy すると admin は password ログインに戻る(PR #53 の runbook)。MCP は OAuthProvider をコードから消しているので、戻すにはその PR を revert(KV namespace は残してあるので binding を戻せば動く)。

## 4. 制約

- `.claude/rules/*`、`CLAUDE.md`(arrow 関数、`let` 禁止、neverthrow、`<name>/index.ts` + `<name>.test.ts`、TDD、勝手に commit しない)。
- Cloudflare の書き込み(アプリ作成・Portal 登録)は `cf --profile napochaan` + `CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72`、dry-run → 本人確認 → 実行 → 再読み込みで確認。
- 本番 deploy は手動 dispatch。

## 5. 私(Claude)の判断で決めたこと

- JWT の検証と user の特定は `route.ts`(Next 側)で行い、`x-mcp-user-id` は廃止する。worker は path の書き換えだけ。
- origin に届く JWT の `aud` は stg で実測し、違えば vars だけの追加 PR で直す。
- `/admin*` と `/mcp` は別アプリ(ブラウザ向け 302 と MCP 向け 401 で振る舞いが違うため)。
- MCP からは user を自動作成しない(find のみ)。初回は admin に一度入って user を作る必要がある。
- AUD は MCP 専用の `CF_ACCESS_MCP_AUD` に分ける。
- 失敗時は 403、env 未設定は 500。
- Portal の server id は `napochaan` / `napochaanstg`。
- KV namespace は安定まで残す。

## 6. 実装者に任せること

- `route.ts` の関数分割と命名、テストの組み方(JWT はテスト内で生成した鍵で署名する。既存の `worker/access-verify-runtime.test.ts` が先例)。
- `@hono/cloudflare-access` を使うか、`packages/payload-cloudflare-access` の verify を直接使うか(後者を推奨。team / issuer / aud / type=app / email の検証が既にある)。
- docs の書き換えの細部。
