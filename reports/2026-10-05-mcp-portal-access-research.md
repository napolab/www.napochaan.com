# MCP を Cloudflare MCP Server Portals + Access に移す調査

調査日: 2026-10-05 / 対象: `www.napochaan.com` (Next.js + Payload 3.x + OpenNext on Workers)
関連: Payload admin の Access 化は別レポート `reports/2026-10-05-payload-cloudflare-access-research.md`

---

## 結論

1. **OAuthProvider・`OAUTH_KV`・`/oauth/*` ページ・DCR は全部消せる**。ただし消せる理由は Portal ではなく、`napochaan.com/mcp` 自体を Access アプリにして **Managed OAuth** を有効にすること。こうすると Access が OAuth 認可サーバーになり、origin(worker)には `Cf-Access-Jwt-Assertion`(email 入り RS256 JWT)が届く。Portal はこの上に載せる任意の層で、ツール単位の ON/OFF・別名・ログを足すもの。ユーザーの識別には関わらない。
2. **Portal は upstream にユーザーの身元を自動では渡さない**。upstream への認証は、サーバーごとに設定した `auth_type`(`oauth` / `bearer` / `unauthenticated`)の資格情報を付けるだけ。worker に「誰か」を届けるには、upstream 側が Managed OAuth 付きの Access アプリで、Portal 側の **Require user auth(`on_behalf`)が ON** である必要がある。OFF の場合は、全リクエストが管理者資格情報(dashboard でサーバーを接続した人)の身元になる。
3. **退行リスクが大きい**。2026-09 時点で、**claude.ai の Web/モバイルコネクタが Access Managed OAuth(Portal 経由も直結も)に繋がらない**という報告が複数出ていて、未解決。Claude Code CLI なら同じ URL で接続できる。現行の OAuthProvider 構成は claude.ai コネクタで staging E2E 済みなので、移行すると claude.ai から使えなくなる可能性がある。移行してよいかは本人の判断が必要。
4. Workers ネイティブの `ctx.access` は**このリポジトリでは使えない**。理由は `[assets]` があること(Static Assets の router が `ctx.access` を渡さない)と、Worker 単位の Access が WebSocket を壊すこと(`/api/cursors` の DO が該当)。採れる構成は「パス単位(`napochaan.com/mcp`)の self-hosted/MCP アプリ + worker でヘッダーの JWT を自前検証」だけ。
5. 費用: Portals は 2026-09-24 に GA。Zero Trust Free(50 seat まで無料)の範囲で足りる見込み。Logpush だけは Enterprise 限定。

---

## 現行フロー(ファイル参照)

```
MCP client ──(Bearer, OAuthProvider 発行)──▶ worker/worker.ts  OAuthProvider(apiRoute '/mcp')
   │  /oauth/register(DCR), /oauth/token: ライブラリが処理(KV: OAUTH_KV)
   │  /oauth/authorize: defaultHandler → Next ページ
   │        src/app/(site)/oauth/authorize/page.tsx + _actions/authorize.ts
   │        (payload.login で email/password → completeAuthorization(props:{userID,email}))
   ▼
mcpAPIHandler(worker/worker.ts): ctx.props.userID → x-mcp-user-id ヘッダーを付け
   pathname を /api/mcp に書き換え、OpenNext handler.fetch へ in-process forward
   ▼
src/app/api/mcp/route.ts: x-mcp-user-id → payload.findByID('users') → McpServer(stateless, enableJsonResponse)
```

- 外部から `/api/mcp` に直接来たリクエストは `worker/routes/mcp-guard.ts` が 404 を返す。`worker/app.ts` で mount より前に登録していて、その順序は `worker/app.test.ts` で回帰テストしている。route.ts はこの遮断を前提にヘッダーを信頼している。
- `src/lib/mcp/oauth/index.ts`: `env.OAUTH_PROVIDER`(OAuthHelpers)を取り出すガード。
- `wrangler.toml`: `OAUTH_KV` が top-level(placeholder ID)・`env.staging`(`385b19e3…`)・`env.production`(`d19a648c…`)の 3 か所にある。`[assets] directory = ".open-next/assets"` あり。`workers_dev = false` / `preview_urls = false`。
- `package.json`: `@cloudflare/workers-oauth-provider ^0.8.1`。
- 運用ドキュメント: `docs/mcp-blog-authoring.md`(KV の grant/token 失効手順や Claude Code・claude.ai の接続手順。staging は「Cloudflare Access 配下」と記載あり)。
- 署名付きアップロード(`create_upload_url` → `POST /api/media-upload`、HMAC)は OAuth と独立しているので、**今回の移行の影響を受けない**。

---

## MCP Server Portal の仕組み

- **概要**: 複数の MCP サーバーを 1 つの HTTP エンドポイント(`https://<sub>.<domain>/mcp`)にまとめるもの。旧称は Agents Gateway で、API/Terraform には `agents_gateway`/`agw` という名前が残っている。[MCP server portals]
- **ステータス**: 2025-08-26 に全プランで open beta、**2026-09-24 に GA(全顧客)**。[GA changelog][Access changelog]
- **プラン・価格**: Zero Trust Free は 50 ユーザーまで無料。超えると Pay-as-you-go で 1 ユーザーあたり月 $7(年払い)。[Zero Trust For Everyone][teams-pricing] Portal のログを Logpush で外に出すのは Enterprise 限定。[MCP server portals#export-logs]
- **上限**: Portal 20 個 / Portal あたりサーバー 80 / Portal あたりカスタムドメイン 5 / セッション非アクティブ 24h。[Account limits]
- **クライアント → Portal の認証**: Portal の Access アプリ(Portal 作成時に自動生成)で **Managed OAuth** を使う。新規 Portal ではデフォルト ON。[Access changelog 2026-03-20] Portal docs の記述:「Non-browser clients receive a `401` response with a `WWW-Authenticate` header pointing to Access's OAuth discovery endpoints」。[MCP server portals#key-features] つまりクライアントの OAuth/DCR 相手は Access になり、**worker 側に DCR や OAuth エンドポイントは要らなくなる**。
- **リクエストの流れ**(docs の要約): ① クライアントが Portal URL に接続して 401 とメタデータを受け取る → ② IdP で Access にログイン → ③ 有効な upstream のツール一覧を返す → ④ ツール呼び出し時は、ツール名の namespace から対象サーバーを特定し、「attaches the appropriate credentials, and proxies the request」→ ⑤ 応答を同じ経路で返す。[MCP server portals#how-it-works]
- **トランスポート**: クライアント側は stateless MCP `2026-07-28` と 2025 年版の Streamable HTTP を受け付ける。upstream の URL が `/mcp` で終わる場合は Streamable HTTP だけを試す。[MCP server portals#transport] 現行の route.ts(stateless + `enableJsonResponse`)はそのまま使える。
- **ツール名の namespace**: `{server_id}_{tool}` という形式で、server_id にアンダースコアは使えない(例: server_id `napochaan` → `napochaan_create_post`)。[MCP server portals#tool-and-prompt-namespacing]
- **クライアント**: docs の接続例は Workers AI Playground・MCP Inspector・`mcp-remote@latest`。`serverURL` パラメータは非推奨。設定ファイルで MCP サーバーを指定するクライアント(Cursor・Windsurf・Claude Desktop など)は、`npx -y mcp-remote@latest <portal-url>` の形で登録する。Claude Code は `claude mcp add --transport http <portal-url>` で直接 OAuth できる見込みだが、Portal 相手では未実測(Access Managed OAuth の直結では成功例あり [imap-mcp PR#29][claude-ai-mcp#980])。Portal のホームページには Claude Desktop などの設定手順が載っている。[MCP server portals#connect-to-a-portal] 現在のセッションにも `portal_list_servers` などの Portal 組み込みツールを持つコネクタが見えるので、本人の環境では既に何らかの Portal に接続できているらしい(どのクライアント経由かは未確認)。
- **デバイス認証(WARP)は非対応**。初回はブラウザでのログインが必須。[MCP server portals#device-authentication]

---

## upstream に届く認証情報(核心)

### Portal が upstream に付けるもの

Portal は upstream にユーザーの Access 身元を自動では転送しない。付けるのは、サーバー登録時に指定した `auth_type` に対応する資格情報だけ。[MCP server portals#create-an-mcp-server]

| `auth_type`                    | upstream に届くもの                                                                                                    | ユーザー email が origin に届くか                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `oauth`(DCR または手動 client) | Portal が OAuth クライアントとして取ったトークン                                                                       | upstream の認可サーバーが Access(Managed OAuth)で、かつ Require user auth ON の場合のみ届く(下記) |
| `bearer`                       | `Authorization: Bearer <固定値>`、または JSON で指定したカスタムヘッダー。「The portal forwards all headers verbatim」 | 届かない(固定の共有秘密)                                                                          |
| `unauthenticated`              | 何も付かない                                                                                                           | 届かない                                                                                          |

Portal docs 自身も、直接 URL で回り込まれる点を注意書きしている:「Blocked users can still connect to the server (and bypass your Access policies) by using its direct URL. If you want to enforce authentication through Cloudflare Access, configure Access as the server's OAuth provider」。[MCP server portals#add-an-mcp-server]

### 推奨構成: upstream 自体を Managed OAuth 付きの Access アプリにする

1. `napochaan.com/mcp` を Access アプリにする(パス単位の public destination)。アプリ種別の選択肢は 2 つで、どちらにするかは要確認(下記)。そのアプリの **Managed OAuth を ON** にする。Managed OAuth は self-hosted アプリでも MCP server アプリでも使える。MCP server アプリについて docs は「Use this flow for MCP servers served through Cloudflare in the same account as your Zero Trust organization. The MCP server must validate the Access JWT sent in the `Cf-Access-Jwt-Assertion` header.」と書いている。[Managed OAuth#enable-managed-oauth-on-an-mcp-server-application]
2. Portal にこのサーバーを `auth_type: oauth`(Automatic = DCR)で登録する。Portal は Access の Managed OAuth に対する OAuth クライアントとして動き、**不透明(opaque)トークン**(`oauth:…`)を受け取る。[Managed OAuth#token-format]
3. Access のエッジがこの opaque トークンを解決し、**origin には署名済み JWT を `Cf-Access-Jwt-Assertion` として付けて転送する**。docs の記述:「Cloudflare resolves the token into the user's identity on the backend and forwards a signed assertion to your origin. From your origin's perspective, the request looks the same as a browser-authenticated request.」[Managed OAuth#token-format]
4. JWT の中身(identity ベースの場合): `aud`(Access アプリの AUD タグ)・`email`(「verified by the identity provider」)・`iss`(`https://<team>.cloudflareaccess.com`)・`sub`・`type: "app"` など。署名は RS256 で、JWKS は `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`。鍵は 6 週間ごとにローテーションし、旧鍵は 7 日間有効。[Application token][Validate JWTs]

### 誰の email が入るか(Require user auth)

- Portal のサーバー設定 **Require user auth = Enabled(デフォルト)** の場合: 各ユーザーが upstream にも OAuth 認可を行う(同じ IdP なので SSO で通過する)。JWT の `email` は**実際の利用者**になる。
- **Disabled** の場合: Portal はサーバー接続時に取った**管理者資格情報**を全ユーザーで使い回す。docs の記述:「Users who are connected to the portal will automatically have access to the MCP server via its admin credential」。[MCP server portals#create-a-portal] この場合 `email` は常に管理者のものになる。
- **推奨は Enabled**。実質シングルユーザーなので結果は同じだが、監査ログとの整合や将来の複数ユーザー化を考えると Enabled のほうがよい。

### `aud` はどちらのアプリのものか

- JWT の `aud` は「the Access application」の AUD。[Application token] Managed OAuth のトークンは RFC 8707 の `resource` に紐づいて upstream アプリ用に発行されるので、origin に届く JWT の `aud` は **upstream(`napochaan.com/mcp` を守る Access アプリ)の AUD** のはず。Portal のアプリの AUD ではない。
- ただし **Portal 経由の場合の `aud` を明記した docs は見つからなかった**。staging で最初に Portal 経由のリクエストを受けたとき、`aud` claim をログに出して確認すること。違っていた場合も、Hono の `verification.aud` は `string[]` を受け付けるので、2 つの AUD を許可する 1 行の変更で対応できる。
- 参考: 別プロジェクトの実装(imap-mcp PR #29)も「Access が誰かを認証した」ことと「このアプリ向けに認証した」ことは別なので、`aud` を固定して照合することがセキュリティ判断の要だと述べている。[imap-mcp PR#29]

### サービストークンとの関係

ユーザーの経路には関係しない。サービストークンは Portal を M2M(人間なし)で使う場合のモードで、Portal アプリと各サーバーアプリの両方に Service Auth ポリシーが要り、`on_behalf: false`(管理者資格情報)が前提になる。この場合の JWT には `email` がなく、`sub: ""`・`common_name: <client id>` になる。[MCP server portals#connect-with-a-service-token][Application token]

### Access アプリが 2 つあることの整理

- dashboard で「Add MCP server」を実行すると、**`mcp` 種別の Access アプリが自動生成される**(docs が「Open the server's Access application」と表現しているもの)。API スキーマ上の destination 種別は `via_mcp_server_portal` で、説明は「Access will secure the MCP server if accessed through a MCP portal」。[Access apps API] これは主に **Portal 内での表示・アクセス可否**を制御するもので、直接 URL へのアクセスは防がない(上の注意書きのとおり)。
- origin を実際に守るのは **public destination(`napochaan.com/mcp`)を持ち Managed OAuth が ON のアプリ**。作り方は 2 通り考えられる。
  - (a) 自動生成された `mcp` アプリに public hostname を追加し、そこで Managed OAuth を ON にする。secure-mcp-servers docs の「You also do not need to add the MCP server hostname as a public hostname on the generated Access application」という記述から、追加はできると読める。[Secure MCP servers]
  - (b) 別に self-hosted アプリ(`napochaan.com/mcp`)を作って Managed OAuth を ON にする。
  - dashboard が実際にどちらの形になるかは **staging で要確認**。どちらでも worker の実装は同じ(`ACCESS_AUD` に設定する値が変わるだけ)。

### 採用しない選択肢

- **`bearer` で共有秘密を渡す**: 実装はいちばん簡単だが、ユーザーの身元が origin に届かず、Payload 側の「email → user」と共通化する方針から外れる。
- **`bearer` のカスタムヘッダーに Service Token(`CF-Access-Client-Id/Secret`)を入れる**: エッジで Access は効くが、JWT に email が入らない(service token JWT になる)。
- **`ctx.access`**: Workers 側の docs に「Workers with Static Assets execute behind an internal router Worker. Access still protects the application and its assets. However, the router does not pass `ctx.access` to the user Worker.」とある。さらに「Worker-level Access policies do not currently support WebSocket connections … will fail with a `403`」。[Workers: Cloudflare Access] この repo は `[assets]` あり、かつ cursor の WS ありなので、両方の条件に当たる。

---

## bypass 防止

1. **エッジ**: パス単位の Access アプリ(`napochaan.com/mcp`)を置く。app paths はより具体的なパスが優先され、親のルールは継承しない。[Application paths] `/mcp` 以下だけが対象なので、サイト本体・`/api/cursors`(WS)・`/api/media-upload` には影響しない。
2. **origin(worker)**: Hono の `/mcp` ルートで `Cf-Access-Jwt-Assertion` を検証する。Access docs も「Unless your application is connected to Access through Cloudflare Tunnel, your application must validate the token」と書いている。[Application token] 検証する項目:
   - 署名(RS256、JWKS は `kid` で照合。docs は `public_cert` を固定で使わないよう注意している)[Validate JWTs]
   - `iss === https://<team>.cloudflareaccess.com`
   - `aud ∋ ACCESS_AUD`(アプリ固有の値)
   - `exp` / `nbf`
   - `type === 'app'`
   - `email` があること(service token の JWT を弾く)
3. **その他の入口**: `workers_dev = false` / `preview_urls = false` なので `*.workers.dev` やプレビュー URL からは入れない。外部からの `/api/mcp` は `mcp-guard` が 404 を返す(**この guard は残す**)。
4. **設定漏れ**: deploy 済みの env で `ACCESS_AUD` が未設定なら、通さずに **500** を返す(fail closed)。imap-mcp の実装と同じ考え方で、401 を返すと成功しようのない OAuth フローにクライアントを誘導してしまう。[imap-mcp PR#29]

---

## セットアップ手順

Phase 1 だけで OAuth 関連コードはすべて消せる。Phase 2 は任意。

### Phase 0: Zero Trust の前提

1. Zero Trust の組織(team name)を確認する。staging が既に Access 配下なので作成済みのはず。IdP は One-time PIN か Cloudflare IdP(2026-06 以降の新規組織ではデフォルト)にする。[Access changelog 2026-06-18]
2. 許可対象を本人の email に限定した**再利用ポリシー**を `/access/policies` で作る。アプリにインラインでポリシーを書く方式(legacy)は使わない(cloudflare-one skill のガードレール)。

### Phase 1: `/mcp` を Access + Managed OAuth で守る(Portal なし)

1. Access アプリを作る(上の「Access アプリが 2 つあることの整理」の (a) か (b))。destination は `napochaan.com/mcp`(staging は `stg.napochaan.com/mcp`)、ポリシーは Phase 0 のもの。
2. Managed OAuth を ON にする(`oauth_configuration.enabled: true`)。設定値の推奨は以下。[Managed OAuth#managed-oauth-settings]
   - `dynamic_client_registration.allow_any_on_localhost` / `allow_any_on_loopback`: `true`(Claude Code のループバック用)
   - `allowed_uris`: `https://claude.ai/api/mcp/auth_callback` と `https://claude.com/api/mcp/auth_callback`(Anthropic が将来の変更に備えて許可を推奨)[Claude connector auth]、さらに Phase 2 用に Portal の `https://<portal-host>/servers-callback` と、dashboard の callback `https://dash.cloudflare.com/<account-tag>/one/access-controls/ai-controls/mcp-server/oauth-callback/<server-id>`。[MCP server portals#upstream-oauth-callback-urls]
   - `grant.access_token_lifetime`: 15m、`grant.session_duration`: 1〜2 週間(CLI・エージェント向けの推奨値)
3. アプリの AUD タグを控え、`ACCESS_AUD` / `ACCESS_TEAM_DOMAIN` を wrangler の env vars に設定する(秘密値ではない)。
4. worker をデプロイしてから、`claude mcp add --transport http napochaan-blog https://napochaan.com/mcp` で確認する。成功すれば、ブラウザで Access にログインするだけで接続でき、Payload のパスワードは不要になる。

### Phase 2(任意): Portal に載せる

1. **MCP Portals → MCP servers → Add MCP server**: HTTP URL は `https://napochaan.com/mcp`、Server ID は `napochaan` のように**アンダースコアなし**、OAuth credentials は Automatic(DCR)。**Save and connect server** を押すと upstream の OAuth にリダイレクトされ、ここでログインしたアカウントが管理者資格情報になる。[MCP server portals#add-an-mcp-server]
2. **Add MCP server portal**: カスタムドメインは **Worker が載っていないサブドメイン**にする(例 `mcp.napochaan.com`)。Portal URL に Workers・Page Rules・custom hostname が掛かっていると壊れる、と docs にある。[MCP server portals#troubleshooting] サーバーを追加して **Require user auth = Enabled**、Portal のポリシーを付ける。
3. ツールの絞り込み: UI のトグル、または API で `default_disabled: true` + `updated_tools` の許可リストを使う。別名は `portal_alias`/`alias` で付けられる。[MCP server portals#manage-tools-and-prompts] Code Mode は新規 Portal で `opt_in` がデフォルトなので、そのままか `off` でよい。[MCP server portals#code-mode-policies]
4. 接続先 URL: `https://mcp.napochaan.com/mcp`

### 自動化できるもの / dashboard でしかできないもの

| 作業                                              | API / Terraform                                                    | 備考                                                                                                                                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 再利用ポリシー・Access アプリ・Managed OAuth 設定 | ○ `/access/policies`、`/access/apps`(`oauth_configuration`)        | PUT は全フィールドを送る(送らないと上書きされる)                                                                                                                                                              |
| MCP server 登録                                   | ○ `POST /access/ai-controls/mcp/servers`                           |                                                                                                                                                                                                               |
| **upstream の初回管理者 OAuth 認証**              | **△ dashboard のみ**(「Save and connect server」でリダイレクト)    | API で登録しても、認証するまで Waiting/Sync Required のまま                                                                                                                                                   |
| Portal 作成                                       | ○ API / Terraform `cloudflare_zero_trust_access_mcp_server_portal` | **API/Terraform では DNS が自動作成されない**。`gateway.agents.cloudflare.com` への proxied CNAME を手動で作る(作らないと 522)。zone hold があると作成に失敗する [MCP server portals#configure-via-terraform] |
| ツールの許可リスト・別名                          | ○ PUT portal(`servers` 配列は**全体置換**)                         | 省略したサーバーは外れる                                                                                                                                                                                      |
| ツール呼び出し数の集計                            | ○ `/mcp/analytics/.../tool-calls/timeseries`                       |                                                                                                                                                                                                               |

---

## コード移行(削除・追加一覧)

### 削除

| 対象                                | 内容                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `worker/worker.ts`                  | `OAuthProvider` のラップと `mcpAPIHandler` を削除し、`export default { fetch: app.fetch }` 相当に戻す(DO の re-export は残す)                           |
| `src/app/(site)/oauth/authorize/`   | `page.tsx` / `layout.tsx` / `styles.css.ts` / `_actions/{authorize,state}.ts` / `_components/authorize-form/`(テスト含む)を全部削除                     |
| `src/lib/mcp/oauth/`                | `index.ts` / `oauth.test.ts`                                                                                                                            |
| `wrangler.toml`                     | `[[kv_namespaces]] OAUTH_KV` を top-level・`env.staging`・`env.production` の 3 か所から削除。その後 `pnpm cf:types` で型を再生成                       |
| `package.json`                      | `pnpm remove @cloudflare/workers-oauth-provider`                                                                                                        |
| KV namespace 本体                   | `napochaan-mcp-oauth-{staging,production}` は**移行が安定してから**削除する。即時に消すとロールバックできなくなる                                       |
| docs                                | `docs/mcp-blog-authoring.md` の KV 失効手順・Payload ログインの記述を、Access のセッション失効(Access → Users → revoke、Portal の Sign out)に置き換える |
| colophon                            | grep で確認した結果、AuthorizeForm は colophon にも `src/components` にも登録されていない(ページローカルのみ)。作業不要                                 |
| `.claude/rules/isr-revalidation.md` | `/oauth/authorize` に触れている箇所を更新                                                                                                               |

### 残す

- `worker/routes/mcp-guard.ts`(と `app.test.ts` の順序テスト): `/api/mcp` への外部経路を 404 にする境界は引き続き必要。
- `src/app/api/mcp/route.ts` の MCP 本体(tools, transport)。

### 追加・変更

1. **共有モジュール**(Payload admin 側と共用): 例として `src/lib/access/verify-access-jwt.ts` を置く。
   - `verifyWithJwks` を `hono/jwt` から使う(hono 4.12.23 に含まれているので**依存追加は不要**。`jose` は payload 経由の推移的依存しかない)。
     ```ts
     verifyWithJwks(token, {
       jwks_uri: `${teamDomain}/cdn-cgi/access/certs`,
       allowedAlgorithms: ['RS256'],
       verification: { iss: teamDomain, aud },
     })
     ```
   - **`jwk()` middleware に `headerName: 'cf-access-jwt-assertion'` を渡す方法は使えない**。ソースを読むと、ヘッダー値を空白で `split` して `Bearer` という接頭辞を必須にしているため、素の JWT が入ったヘッダーでは失敗する。
   - `verifyWithJwks` は呼ぶたびに JWKS を fetch するので、`init` に `cf: { cacheTtl: 300 }` を渡すか、module scope で memo する。
   - 戻り値は neverthrow の `ResultAsync<AccessIdentity, AccessJWTError>` にする(既存の api-routes 方針。エラーは class で定義する)。
   - 共有モジュールの責務は「JWT を検証して email を得る」までにする。「email → Payload user」は別の関数に分け、`payload.find({ collection: 'users', where: { email: { equals } }, limit: 1, overrideAccess: true })` で引く。**自動作成はしない**。
2. **worker の `/mcp` ルート**(例 `worker/routes/mcp.ts`、Hono): JWT を検証して email を取り出し、`/api/mcp` に in-process forward する。今の `mcpAPIHandler` の forward 処理を移植し、`handlerFetch` に渡す。付けるヘッダーは `x-mcp-user-email`(または worker 側で user を解決して `x-mcp-user-id` のまま渡す)。`app.ts` で `mcpGuardRoutes` と並べて mount より前に登録する。
3. **`src/app/api/mcp/route.ts`**: ヘッダーを email にするなら、`findByID` を email 検索に変える。`route.test.ts` の 3 ケースもそれに合わせて更新する。
4. **`worker/middleware/cache-control.ts`**: `/^\/mcp(\/|$)/ → PRIVATE_POLICY` を追加する。`/mcp` は `/api/` の外なので、今の deny ルールが効かない。Workers Cache は Cookie をキーに含めない(perf-tuning 2026-09 のメモ)。
5. **env vars**: `ACCESS_TEAM_DOMAIN` と `ACCESS_AUD` を `env.staging.vars` / `env.production.vars` に置く。キーを足したら `pnpm cf:types` を実行する(`.dev.vars` に足した場合も同じ)。
6. **`/.well-known/*`**: Managed OAuth を ON にすると、Access がホスト上で `/.well-known/oauth-authorization-server` と protected-resource メタデータを応答する。Worker のアプリ(destination)では実測で確認されている。[imap-mcp PR#29] **パス単位のアプリでも同じかは staging で要確認**。いずれにせよ worker 側でこれらのパスを上書きしないこと。OAuthProvider を消せば、今 worker が出している `/.well-known/oauth-*` も消える。

### テスト(TDD の順番の目安)

- `verify-access-jwt` の node unit: テスト内で RSA 鍵を生成し、JWKS を `keys` で直接渡す。正常 / `aud` 不一致 / `iss` 不一致 / 期限切れ / `email` なし(service token 形) / `type !== 'app'` / alg が `none`・HS256 の各ケースを検証する。
- `worker/app.test.ts` 系: `/mcp` に JWT がない場合は 401(または 403)で、`handlerFetch` が呼ばれないこと。正しい JWT なら forward ヘッダーが付いて呼ばれること。`ACCESS_AUD` が未設定なら 500。外部からの `/api/mcp` は引き続き 404。

---

## ローカル・staging 検証方法

### ローカル

- `next dev`(localhost:3000)は worker シェルを通らない。そのため今と同じく **`POST /api/mcp` にヘッダー(`x-mcp-user-*`)を直接付けて**ツールを確認できる。route.ts のロジック確認はこれで足りる。
- worker シェル(`wrangler dev` や `next start` での検証)で `/mcp` を通したい場合は、**top-level `[vars]` にだけ**開発用のバイパスフラグを置く(例: `ACCESS_DEV_BYPASS_EMAIL = "dev@napochaan.com"`)。`[env.staging]` / `[env.production]` は top-level の vars を継承しないので、deploy 環境では無効になる。さらに「staging/production の vars にこのキーがないこと」をテストで固定すると安全(cross-module-sync-test の考え方)。
- wrangler の `[access.dev]` は `ctx.access` を模擬するだけで、`Cf-Access-Jwt-Assertion` ヘッダーは作らない。[Workers: Cloudflare Access] このプロジェクトの検証方式では役に立たない。

### staging

- `stg.napochaan.com` は既にホスト全体が Access 配下(`docs/mcp-blog-authoring.md`)。`stg.napochaan.com/mcp` 用のアプリを別に作れば、より具体的なパスとしてそちらが優先され、親のルールは継承されない。[Application paths] ただし、親アプリのブラウザ向けリダイレクト(302)が Managed OAuth の 401 や `/.well-known` を邪魔しないかは実測が必要。
- 検証項目:
  1. `curl -i -X POST https://stg.napochaan.com/mcp` が `401` と `WWW-Authenticate` を返し、`Location` が付かないこと(302 なら Managed OAuth が OFF)
  2. `/.well-known/oauth-authorization-server` が Access から応答されること
  3. Claude Code で接続して `list_posts` が成功すること
  4. worker のログで JWT の `aud`・`email`・`type` を確認する(**Portal 経由と直結の両方**)
  5. 偽の `Cf-Access-Jwt-Assertion` を付けたリクエストが拒否されること(通常は Access がエッジで先に弾く)
  6. `/api/mcp` への直接アクセスが 404 のままであること
  7. `/api/cursors` の WS upgrade(101)が影響を受けていないこと
  8. claude.ai コネクタで接続を試し、失敗したら `ofid_` を控える
  9. Phase 2 を入れる場合は、`mcp.napochaan.com/mcp`(staging 用の Portal またはサーバー)経由で同じ確認を行う

---

## リスク・注意点

| リスク                                 | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                            | 対策                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **claude.ai Web/モバイルが繋がらない** | Access Managed OAuth(Portal 経由も直結も)で、OAuth/DCR は成功するのに origin にリクエストが一度も来ない、という報告が続いている。#410(Portal、not planned で close)、#980、#992 は 2026-09 時点で open。原因の候補は 401 に `WWW-Authenticate` がない場合があること、`/authorize` が RFC 8707 の `resource` を必須にしていること(#410 のコメントで手動再現あり)など。**Claude Code CLI は同じ URL で成功する**。[claude-ai-mcp#410][#980][#992] | 移行前に staging で claude.ai から実測する。だめなら移行を延期するか、claude.ai 経由の入稿をやめる判断をする            |
| Claude Desktop の redirect URI         | Desktop の `/mcp` OAuth が `claude://` の redirect を送り、https とループバックしか許可しない Cloudflare 側で弾かれた事例がある(相手は mcp.cloudflare.com)。Access の `allowed_uris` も https 必須なので同じことが起こり得る。[claude-code#93671]                                                                                                                                                                                               | Desktop を使う場合は `mcp-remote@latest` 経由にする([MCP server portals#connect-to-a-portal] が推奨)                    |
| `aud` の取り違え                       | Portal 経由で届く JWT の `aud` を明記した docs がない                                                                                                                                                                                                                                                                                                                                                                                           | staging でログに出して確定させる。`aud` は配列で受けられるようにしておく                                                |
| ストリーミング・SSE                    | Portal は Streamable HTTP と SSE の両方に対応。Gateway routing を ON にした場合は SSE 非対応。[MCP server portals#transport][MCP server portals#route-portal-traffic-through-gateway]                                                                                                                                                                                                                                                           | 現行は JSON 応答のみ・stateless なので影響なし                                                                          |
| `Mcp-Session-Id`                       | 2026-07-28 の stateless ならセッションは作られない。2025 年版クライアントは Portal 側にセッションを作り、24h の非アクティブで失効する。[MCP server portals#session-lifecycle]                                                                                                                                                                                                                                                                   | upstream は stateless のままでよい。Portal がクライアント側のセッションを持つ                                           |
| タイムアウト・ボディサイズ             | Portal のプロキシのタイムアウトや最大ボディサイズは**docs に記載がない**。`upload_media` に base64 を渡すと大きくなる可能性がある                                                                                                                                                                                                                                                                                                               | 大きなファイルは `create_upload_url`(直接アップロード、Portal を通らない)を使う運用に寄せる。staging で上限を実測する   |
| 管理者資格情報の静かな失効             | 管理者トークンが期限切れになるとサーバーが Error/Sync Required になり、Portal から消える。通知は来ない。[MCP server portals#known-limitations]                                                                                                                                                                                                                                                                                                  | Require user auth ON にしておけば利用自体は継続する。ツールの同期だけ止まるので、ツールを追加したときは手動で Sync する |
| ツール同期の遅れ                       | DCR サーバーのツール同期は約 2 時間ごと。新しいツールはデフォルトで有効。[MCP server portals#synchronize-the-mcp-server]                                                                                                                                                                                                                                                                                                                        | ツールを追加したら Sync を押す。公開系ツールを絞るなら `default_disabled` を使う                                        |
| ポリシー機能の制限                     | Portal 経由では、Independent MFA・目的申告・一時認証が upstream に効かない。[MCP server portals#policy-limitations]                                                                                                                                                                                                                                                                                                                             | email のポリシーで十分なので影響なし                                                                                    |
| 鍵ローテーション                       | Access の署名鍵は 6 週間ごとにローテーションする。[Validate JWTs]                                                                                                                                                                                                                                                                                                                                                                               | `kid` で JWKS を照合する。鍵の固定はしない                                                                              |
| ロールバック                           | KV と grant を即座に消すと、OAuthProvider 構成に戻せない                                                                                                                                                                                                                                                                                                                                                                                        | KV は安定後に削除する。worker の切り替えは 1 PR で revert できる単位にする                                              |
| 費用                                   | Free(50 seat)で足りる。Logpush は Enterprise 限定。Gateway routing と DLP は任意                                                                                                                                                                                                                                                                                                                                                                | 追加費用なしの想定                                                                                                      |

---

## 参考 URL

- [MCP server portals] https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/ (最終更新 2026-10-02)
- [Secure MCP servers] https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/secure-mcp-servers/
- [Managed OAuth] https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/
- [Allow MCP servers to access self-hosted applications] https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/linked-apps/
- [Validate JWTs] https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- [Application token] https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/
- [Application paths] https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- [Account limits] https://developers.cloudflare.com/cloudflare-one/account-limits/
- [Access apps API(destinations / `via_mcp_server_portal`)] https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/methods/create/
- [Workers: Cloudflare Access(`ctx.access` / Static Assets / WebSocket の制限)] https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- [GA changelog] https://developers.cloudflare.com/changelog/post/2026-09-24-mcp-portals-ga/
- [Access changelog] https://developers.cloudflare.com/cloudflare-one/changelog/access/ (2025-08-26 open beta「all customers across all plans」/ 2026-03-20 Managed OAuth / 2026-06-18 Cloudflare IdP デフォルト)
- [Workers Access changelog] https://developers.cloudflare.com/changelog/post/2026-08-14-workers-access/
- [Blog: Introducing MCP Server Portals] https://blog.cloudflare.com/zero-trust-mcp-server-portals/
- [Zero Trust For Everyone(Free 50 users)] https://blog.cloudflare.com/teams-plans/
- [teams-pricing] https://en-us.www.cloudflare.com/teams-pricing/
- [Claude connector auth(callback URL)] https://claude.com/docs/connectors/building/authentication
- [claude-ai-mcp#410] https://github.com/anthropics/claude-ai-mcp/issues/410
- [claude-ai-mcp#980] https://github.com/anthropics/claude-ai-mcp/issues/980
- [claude-ai-mcp#992] https://github.com/anthropics/claude-ai-mcp/issues/992
- [claude-code#93671] https://github.com/anthropics/claude-code/issues/93671
- [imap-mcp PR#29(Managed OAuth + Worker の実測)] https://github.com/lswith/imap-mcp/pull/29
