# Cloudflare Access による Payload admin 自動ログイン runbook

Cloudflare Access を通過した人を、Access が発行した JWT の email で Payload admin にそのままログインさせる。plugin は `packages/payload-cloudflare-access`、設計は `docs/superpowers/specs/2026-10-05-payload-cloudflare-access-design.md`、調査は `reports/2026-10-05-payload-cloudflare-access-research.md` を参照。

stg / prod で `CF_ACCESS_*` が揃ったときだけ有効になる。有効な間は email + password ログインが無効になり、**Access のポリシーが唯一の認可境界**になる（users に role は無い。ポリシーを通った人は全員 admin 権限を持つ）。password の設定・変更も拒否される（下の「有効な間の password 書き込み拒否」）。

MCP（`/mcp`）は Access アプリ（Managed OAuth）+ MCP Portal 経由で認証する。prod では admin 用とは**別の**パス単位アプリ（別 AUD）、stg はホスト全体の 1 つのアプリを admin と共用する（下の「stg と prod のアプリ構成」）。OAuth 同意画面（`/oauth/authorize`）と OAuthProvider は廃止した。設計は `docs/superpowers/specs/2026-10-22-mcp-access-portal-design.md`、手順は下の「MCP（`/mcp` アプリと MCP Portal）」。本番 deploy の凍結（同節）は 2026-10-22 に解除した（本番 vars = PR #62、本番 deploy 後の確認済み）。

全ての `wrangler` / Payload CLI コマンドは account id が必要（無いと exit 13）:

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
```

| env     | host                | wrangler セクション     |
| ------- | ------------------- | ----------------------- |
| staging | `stg.napochaan.com` | `[env.staging.vars]`    |
| prod    | `napochaan.com`     | `[env.production.vars]` |

### stg と prod のアプリ構成

| env  | Access アプリ                                                                                                                   | AUD                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| stg  | **ホスト全体の self-hosted アプリ 1 つ**（`stg.napochaan.com`、id `7bc9e2a4…`、Managed OAuth ON）。admin も `/mcp` もこれが覆う | `98a71a22…`（`CF_ACCESS_AUD` と `CF_ACCESS_MCP_AUD` に同じ値） |
| prod | パス単位のアプリ 2 つ: `napochaan.com/admin*`（admin）と `napochaan.com/mcp`（MCP、Managed OAuth ON）                           | 別々の AUD（`CF_ACCESS_AUD` と `CF_ACCESS_MCP_AUD`）           |

- stg のポリシーは `naporitan`（本人の email のみ）だけ。IdP は GitHub。自宅 IP の bypass ポリシー（「なぽハウス」）と、stg の `/admin*` / `/mcp` のパス単位アプリは 2026-10-22 に廃止した。Bypass アプリはどこにも使わない。
- stg では admin と MCP の AUD 分離が効かない（受容したトレードオフ）。prod は分離を保つ。
- stg のホスト全体アプリは `/api/*` や公開ページも覆う。ログイン後の全リクエストに `Cf-Access-Jwt-Assertion` が付くので、stg で通るのは header 経路。`CF_Authorization` cookie 経路は prod で確認する。
- Managed OAuth が ON のため、未認証の非ブラウザ要求は stg のどのパスでも `401`、ブラウザのページ遷移は Access のログインへ `302`。

## 有効化の条件（先に読む）

`src/payload.config.ts` が `cfEnv.CF_ACCESS_TEAM_DOMAIN` と `cfEnv.CF_ACCESS_AUD` を plugin に渡す。plugin は **両方が空でない**ときだけ有効になる（`packages/payload-cloudflare-access/src/plugin/index.ts`）。

| `CF_ACCESS_TEAM_DOMAIN` | `CF_ACCESS_AUD`                          | 結果                                          |
| ----------------------- | ---------------------------------------- | --------------------------------------------- |
| あり                    | あり                                     | 有効（strategy 追加 + password ログイン無効） |
| あり                    | 未設定 / 空 / 空白だけ（`,` だけも含む） | **黙って無効**（password ログインのまま）     |
| 未設定 / 空             | あり                                     | **黙って無効**（password ログインのまま）     |
| team 名にならない値     | あり                                     | config の評価時に `InvalidAccessTeamDomain`   |

- `NODE_ENV` では判定しない。片方だけ・空白だけでも例外は出ず、ログにも出ない（例外は、両方そろって有効化するときに `CF_ACCESS_TEAM_DOMAIN` が team 名にならない場合だけ。下記）。有効化したつもりで無効のままになっていないか、検証（手順 4）で必ず確かめる。
- `CF_ACCESS_AUD` は**カンマ区切りで複数指定できる**（各要素は trim され、空要素は捨てられる）。JWT の `aud` がどれか 1 つに一致すれば通る。stg はホスト全体のアプリ 1 つ（admin / MCP 共通）、prod は admin 用のパス単位の 1 つ。
- `CF_ACCESS_TEAM_DOMAIN` は team 名だけ（`napolab` のように、`https://<team>.cloudflareaccess.com` の `<team>` 部分）を入れる。よくある書き方は team 名に正規化される（大文字、`https://` / `http://`、末尾の `/`、`.cloudflareaccess.com` 付き。`https://napolab.cloudflareaccess.com/` も `napolab` になる）。正規化しても `^[a-z0-9-]+$` にならない値（空白入り、別ドメインなど）は、`CF_ACCESS_AUD` もそろって有効化するときに Payload config の評価で `InvalidAccessTeamDomain` を投げる。`CF_ACCESS_AUD` が空の間は検証せず黙って無効のまま（team 名は Access アプリを作って AUD が出る前に入れるのが普通なので、その間の typo でサイトを落とさない）。有効化のときに落ちると Payload を使う全ページが 500 になる。`next build` は `CF_ACCESS_*` 無しで config を評価するので build では気づけない。deploy workflow の `deploy:database:check:<env>`（`CLOUDFLARE_ENV` 付きの Payload CLI）が deploy 前に config を評価するので、そこで気づける**かもしれない**が、その step が job を失敗させるかは確かめていない（Payload の bin は失敗しても exit 0 のことがある）。黙って通すと issuer / JWKS URL が食い違い、password ログインも無効なので誰も admin に入れなくなるため、意図して fail-loud にしている。
- **deploy 前に必ず team 名を確かめる**。上のとおり deploy 前に気づけるとは限らず、有効化された経路（JWT の検証）も deploy 前にどこでも実行されないので、team の certs URL が 200 を返すことを先に手で確かめる（存在しない team は 404 になる）:

  ```bash
  curl -s -o /dev/null -w '%{http_code}\n' https://<team>.cloudflareaccess.com/cdn-cgi/access/certs   # 200 になること
  ```

- `admin.components.logout.Button` は env に関わらず常に登録される（importMap に載るものを env で分岐させないため）。env が揃っているときだけ、ボタンが同一 origin の `POST /api/<slug>/access-logout` を送る form になり、cookie を消してから `/cdn-cgi/access/logout` へ移る（下の「注意」のログアウト）。

## 1. 事前準備: 本人の user に password を設定する（切り戻し用）

Access で自動作成された user は password を持たない。切り戻したとき（下の「切り戻し」）に入れなくなるので、**Access を有効にする前に**、本人の user に password を設定しておく。有効にした後は password の書き込みが 403 で拒否されるので、後からは設定できない。

1. 今の password ログインで admin に入る。
2. Users から自分の user を開き、password を設定して保存する。
3. その user の email が、Access の IdP が返す email と**同じ**であることを確認する（strategy は email を小文字化して検索する。違う email だと別 user が自動作成され、password を設定した user には入れない）。

## 2. Zero Trust: IdP とアプリを作る

Zero Trust ダッシュボードで設定する。画面の操作順は Cloudflare 側の更新で変わるので、ここでは何を作るかだけを書く。

1. **IdP**: 本人がログインできる IdP を登録する（One-time PIN でもよい）。ポリシーの email はこの IdP が返す email と一致させる。
2. **self-hosted アプリ**を作る（[Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)）。

   | env  | アプリ                                                         |
   | ---- | -------------------------------------------------------------- |
   | stg  | `stg.napochaan.com`（ホスト全体 1 つ。admin と `/mcp` を覆う） |
   | prod | `napochaan.com/admin*`（パス単位。ワイルドカードで指定する）   |

   prod では `/mcp` をこのアプリに入れない。別のパス単位アプリ（Managed OAuth ON）として作り、AUD も別にする（下の「MCP（`/mcp` アプリと MCP Portal）」）。stg は Managed OAuth を ON にしたホスト全体アプリ 1 つで admin と MCP の両方を担う。

3. **ポリシー**: Allow、include は**本人の email のみ**。
4. **stg はホスト全体のアプリ 1 つだけ**にする。パス単位のアプリ（`/admin*` / `/mcp`）や Bypass アプリとは共存させない。JWT の `aud` は常にそのアプリの AUD になるので、控える AUD は 1 つ（手順 3）。
5. **Cookie の SameSite を Lax にする**（各アプリの設定 → Cookie settings。多層防御）。Lax でもトップレベルの GET 遷移には cookie が付くので、Access ログイン後の redirect は動く。クロスサイトの POST やサブリソース（img / iframe / fetch）には cookie が付かなくなる。strategy 自体も header 由来・cookie 由来ともクロスサイト要求を拒否するので、これに依存はしない。
6. **Cookie Path Attribute は OFF のまま**にする（既定。prod のパス単位アプリの話で、stg のホスト全体アプリには関係しない）。ON にすると `/admin*` 以外の path に `CF_Authorization` cookie が届かなくなり、admin の XHR（`/api/*`）が認証できなくなる（[Authorization cookie](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/#cookie-path-attribute)）。

## 3. AUD を控えて wrangler vars に反映する

**値が確定するまで vars を追加しない。** 誤った AUD で有効化すると、strategy がすべての JWT を拒否して誰も admin に入れなくなる（password ログインも無効になっているため）。

1. 各 Access アプリの AUD tag を控える（アプリの Overview / 設定画面に表示される Application Audience (AUD) Tag）。
2. `wrangler.toml` に追加する。top-level の `[vars]`（local）には**置かない**。local では plugin を無効のままにする。

   ```toml
   [env.staging.vars]
   # ...既存の vars...
   CF_ACCESS_TEAM_DOMAIN = "<team>"
   CF_ACCESS_AUD = "<host-wide app の AUD>"                      # stg は 1 つ
   CF_ACCESS_MCP_AUD = "<host-wide app の AUD>"                  # stg は admin と同じ値（MCP は下の節）

   [env.production.vars]
   # ...既存の vars...
   CF_ACCESS_TEAM_DOMAIN = "<team>"
   CF_ACCESS_AUD = "<path app の AUD>"                           # prod は /admin* アプリの 1 つ
   ```

   AUD は秘密情報ではないので secret ではなく vars でよい。stg と prod の AUD は別の値になる。

3. 型を再生成する（`.dev.vars.example` に空値の `CF_ACCESS_TEAM_DOMAIN=` / `CF_ACCESS_AUD=` が入っているので `CloudflareEnv` に型が出る）:

   ```bash
   pnpm cf:types
   ```

4. deploy する。まず stg だけ:

   ```bash
   pnpm deploy:staging
   ```

   prod は stg の検証（手順 4）が済んでから `pnpm deploy:production`。

## 4. stg 検証チェックリスト

stg の deploy 後、次を順に確かめる。

**項目 3 / 7 / 7a の前提**: stg はホスト全体のアプリが `/api/*` にも `Cf-Access-Jwt-Assertion` header を付ける（Bypass は使わない）。ログイン後の stg の全リクエストが header 経路になり、cookie 経路は検証されない。cookie 経路が通る 3 / 7 / 7a は prod でだけ意味を持つので、**最初の prod deploy で確認する**（「5. prod へ反映」の引き継ぎ項目）。項目 6（別 origin の probe）は header 由来も CSRF 検査を受けるので、stg でも `{"user":null}` を期待値として確認できる（header 由来の判定の確認。cookie 由来の判定は prod で確認する）。

- [ ] 1. stg にホスト全体のアプリ（Managed OAuth ON、policy `naporitan` のみ）を作り、その AUD を `[env.staging.vars]` の `CF_ACCESS_AUD` / `CF_ACCESS_MCP_AUD` に設定して deploy した
- [ ] 2. `/admin` に入ると自動ログインされ、ログインフォームが出ない
- [ ] 3. admin 内の操作（一覧・保存・画像アップロード）が cookie 経路で通る（Server Action による保存も含む）。**cookie 経路は prod で確認**（上の前提を参照。stg では header 経路で通るだけで、cookie 経路の確認にならない）
- [ ] 4. 未登録 email で入ると user が自動作成される
- [ ] 5. admin の nav のログアウトで Access のログアウト画面に遷移し（`POST /api/users/access-logout` → `303 Location: /cdn-cgi/access/logout`）、再度 `/admin` に行くと Access のログインを求められる。IdP のセッションが残っていると、ログイン画面を経ずにそのまま再ログインされることがある（IdP 側のログアウトは別）。
  - DevTools → Network で `access-logout` の応答に `payload-token` と `__prerender_bypass` を消す `Set-Cookie` が 2 本あり、Application → Cookies からも両方が消えている（admin の Live Preview（`/next/preview` を経由して draft mode に入る）を開いてから試すと、`__prerender_bypass` がある状態から確かめられる。preview の URL を直接開くだけでは付かない）
  - 別 origin からの POST は 403 で、`Set-Cookie` も `Location` も返らない。stg はホスト全体のアプリが `/api/*` も覆うので、`CF_Authorization` を付けないと Access に弾かれ（非ブラウザは `401`、ブラウザは `302`）endpoint まで届かない（項目 6 と同じく JWT を DevTools からコピーする）: `curl -si -X POST -H 'Origin: https://evil.example' --cookie CF_Authorization=<JWT> https://stg.napochaan.com/api/users/access-logout`
- [ ] 6. 別 origin からのリクエストで認証が解決されない（`user: null`）。stg では `/api/*` に Access が header を付けるので header 由来の判定、prod では cookie 由来の判定を通るが、どちらも `Origin` が `payload.config.csrf` に無ければ user を解決しない。`CF_Authorization` の JWT は、Access ログイン済みブラウザの DevTools → Application → Cookies からコピーする（詳しくは下の「AUD の実測記録」）。probe には `GET /api/users/me` を使う（`POST /api/users/logout` は未認証だと 400 `No User` を返すだけで、CSRF で弾かれたのか判別できず誤解を招く）:

  ```bash
  curl -i https://stg.napochaan.com/api/users/me \
    -H 'Origin: https://evil.example' \
    --cookie 'CF_Authorization=<自分の JWT>'
  ```

  期待値は `{"user":null}`（`Origin` が `payload.config.csrf` に無いので、header 由来でも cookie 由来でも user を解決しない）。`wrangler tail` には `Cloudflare Access authentication rejected` の warn が `CrossSiteAccessRequest` と `source`（`header` / `cookie`）付きで出る。比較用に、`payload.config.csrf` に含まれるサイト自身の origin（stg なら `https://stg.napochaan.com`）を `Origin` に付けると `user` が返る。

  `Origin` が無いときの扱いは経路で違う（`packages/payload-cloudflare-access/src/csrf/index.ts`）。
  - cookie 由来（prod の `/api/*`）: `Sec-Fetch-Site` が `same-origin` / `same-site` / `none` でなければ拒否。`Origin` も `Sec-Fetch-Site` も無い curl も拒否される。
  - header 由来（stg の全パス、prod の `/admin*`）: `Sec-Fetch-Site: cross-site` かつ `Sec-Fetch-Dest` が `document` 以外（img / iframe / fetch など）だけを拒否する。Access ログイン後の `/admin` への着地は Origin の無いクロスサイトのトップレベル GET なので、これを通すため。`/admin` より深いパスへのクロスサイト遷移は、Payload に届く前に worker が `/admin` へリダイレクトする（下の「クロスサイト遷移の `/admin` への着地」）。fetch metadata の無い curl は通る（`user` が返る）。サブリソースの拒否を見るなら `-H 'Sec-Fetch-Site: cross-site' -H 'Sec-Fetch-Dest: image'` を付けて `{"user":null}` になることを確かめる。

- [ ] 7. JWT なしの `/api/users/me` が未認証になる（`user: null`）。**prod で確認**。stg では、`/api/users/me` は Access に弾かれる（非ブラウザは `401`、ブラウザは `302`。`user: null` の JSON は返らない）
- [ ] 7a. Live Preview と下書きプレビュー（`/next/preview`）が、Access ログイン済みの編集者で表示できる（`CF_Authorization` cookie 経路を通る）。**cookie 経路は prod で確認**（stg では header 経路で通るだけで、cookie 経路の確認にならない）
- [ ] 8. `/mcp` の確認は下の「MCP（`/mcp` アプリと MCP Portal）」のチェックリストで行う（prod は admin とは別アプリ・別 AUD。stg は admin と同じホスト全体アプリ）
- [ ] 8a. Access 有効な間、password の書き込みが 403 で拒否される（下の「有効な間の password 書き込み拒否」）
- [ ] 8b. 別サイトから `/admin` より深いパスへのトップレベル遷移が `/admin` へリダイレクトされる（下の「クロスサイト遷移の `/admin` への着地」）
- [ ] 9. 実際に JWT に入る AUD が、設定した AUD と一致することを記録した（下の「AUD の実測記録」）

加えて次も確かめる。

- [ ] **別タブでログアウトした後の挙動**: 2 つのタブで admin を開き、片方で Access からログアウトする。もう片方で admin を操作（保存・一覧の再取得・画面遷移）して、次のどちらになるかを記録する。
  - フォームの無いログイン画面に落ちる（local strategy が無効なので LoginForm は描画されない）
  - Access の再ログインに誘導される（`/admin*` の画面遷移は Access のアプリ範囲内なので、こちらになる想定）
  - XHR（`/api/*` は Access の範囲外）は単に未認証（401 / 403）になる想定。実測値を記録する。

  実測結果（検証時に追記）:

- [ ] **`/admin*` が別 origin の iframe に入らない**: 次のヘッダーが付いている（`worker/middleware/path-policy/plugins/admin-frame/index.ts`）。

  ```bash
  curl -sI 'https://stg.napochaan.com/admin' | grep -i -E 'content-security-policy|x-frame-options'
  ```

  | パス                                          | `Content-Security-Policy` | `X-Frame-Options` |
  | --------------------------------------------- | ------------------------- | ----------------- |
  | `/admin`（配下も。`/administrator` は対象外） | `frame-ancestors 'self'`  | `SAMEORIGIN`      |

  上流の CSP が既にあれば、`frame-ancestors` が無いときだけ末尾に足される。`/admin` を `'self'` にしているのは、Access が有効だと admin がクロスサイトの iframe の中でも認証済みで描画されるため（Live Preview が iframe に入れるのはサイト側の `/next/preview` で、admin 自身ではない）。

  Access 越しだと `curl` は Access のログイン画面に飛ばされる。その場合は、ログイン済みブラウザの DevTools（Network）で応答ヘッダーを見る。

### MCP（`/mcp` アプリと MCP Portal）

```
Claude Desktop ─▶ MCP Portal (mcp.napochaan.com)
                   │ Access Managed OAuth（DCR。同意 = Access ログイン）
                   ▼
   <host>/mcp  ← Access アプリ（policy naporitan。prod はパス単位、stg はホスト全体）
                   │ Cf-Access-Jwt-Assertion を付けて origin へ
                   ▼
   worker /mcp ルート → pathname を /api/mcp に書き換えて forward
                   ▼
   src/app/api/mcp/route.ts
     1. JWT を CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_MCP_AUD で検証
     2. email で既存 Payload user を find（作らない）
```

- 失敗時: JWT 無し・不正・user 不在は `403`、`CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_MCP_AUD` 未設定は `500`（fail closed）。user の検索自体の失敗（D1 障害など）も `403` ではなく `500`。
- 外部からの `/api/mcp` 直叩きは `mcp-guard` が 404 にする。`x-mcp-user-id` は廃止した。
- **`CF_ACCESS_MCP_AUD` は prod では MCP アプリ専用**（カンマ区切り可）。admin 用の `CF_ACCESS_AUD` と混ぜない。**stg はホスト全体アプリ 1 つなので、両方に同じ AUD を入れる**（admin / MCP の AUD 分離は stg では効かない。受容したトレードオフ）。`CF_ACCESS_TEAM_DOMAIN` は admin と共用する。
- **OAuth discovery**: stg はホスト全体アプリ（Managed OAuth ON）なので、Access 自身が `/.well-known/oauth-protected-resource/mcp`、`/.well-known/oauth-authorization-server`、`/.well-known/cloudflare-access-protected-resource/mcp`（応答ヘッダー `cf-version`）を返す。**prod はパス単位アプリなので worker が返す**: Access が返すのは `/.well-known/cloudflare-access-protected-resource/mcp` だけで、標準の `/.well-known/oauth-protected-resource/mcp`（RFC 9728）と `/.well-known/oauth-authorization-server`（RFC 8414）は origin に落ちる。Portal の DCR はこの標準 discovery を辿るので、404 だと「failed to register oauth client」になる。そこで `worker/routes/mcp-oauth-metadata` が、前者は `{ resource: "<origin>/mcp", authorization_servers: ["https://<team>.cloudflareaccess.com"] }` を、後者は team の AS metadata を書き換えずに中継して返す（`public, max-age=300`。上流の失敗は `502` + `no-store`）。`CF_ACCESS_TEAM_DOMAIN` と `CF_ACCESS_MCP_AUD` が揃っていないときは返さず、今まで通り 404。
- MCP は admin の plugin が有効かどうかに関係なく動く。逆に、admin を password ログインに戻す目的で `CF_ACCESS_TEAM_DOMAIN` まで消すと `/mcp` が 500 になる（下の「切り戻し」）。

#### Cloudflare 側の設定

`cf` での書き込みは `CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72 pnpm dlx cf@latest --profile napochaan …` で、`--dry-run` → 確認 → 実行 → 再読み込みで確認。

prod は `napochaan.com/mcp` のパス単位アプリ、stg は `stg.napochaan.com` のホスト全体アプリ（admin と共用）。どちらも次の設定にする:

- `type: self_hosted`、policy は再利用ポリシー `naporitan`（本人の email のみ allow、bypass 無し）、IdP は GitHub-naporin0624、`session_duration: 24h`、`http_only_cookie_attribute: true`、`app_launcher_visible: false`
- Managed OAuth を ON: grant `336h` / access token `15m`
- Dynamic Client Registration を許可し、`allowed_uris` は `https://mcp.napochaan.com/servers-callback` と dash の mcp-server oauth-callback（`https://dash.cloudflare.com/<account id>/one/access-controls/ai-controls/mcp-server/oauth-callback/*`）。localhost / loopback は許可
- claude.ai 直結用の callback は入れない（Portal 経由のみ）

MCP Portal `napochaan-mcp-portal`（`mcp.napochaan.com`）:

- server id は prod が `napochaan`、stg が `napochaanstg`（アンダースコア無し）。`auth_type: oauth`（DCR）で登録し、Require user auth を ON
- **stg の `/mcp` パス単位アプリを削除したら、`napochaanstg` を再認証する**（既存の token は `/mcp` パス単位アプリ向けに発行されたもので、ホスト全体アプリでは使えない。dashboard の「Save and connect server」→ Claude Desktop 側も接続し直す）
- 管理者の初回 OAuth は dashboard の「Save and connect server」でしかできない（本人の操作）
- API の PUT は `servers` 配列を**全体置換**する。追加するときは既存の server（`inbox` など）も含めて送るか、dashboard で足す

#### 有効化の手順

1. `/mcp` アプリを作り、AUD を控える（stg はホスト全体アプリを使うので、admin と同じ AUD）。
2. `wrangler.toml` の `[env.<env>.vars]` に `CF_ACCESS_MCP_AUD = "<MCP アプリの AUD>"` を足す（`CF_ACCESS_TEAM_DOMAIN` は admin の手順 3 で入っているもの）。値が確定するまで足さない。誤っていると全 MCP リクエストが 403 になる。
3. Portal に server を登録して connect し、Claude Desktop から Portal 経由で接続する。
4. prod は次項の凍結に従う。prod の `/mcp` アプリと vars（手順 1・2）が揃うまで本番を deploy しない。

#### 本番 deploy の凍結（2026-10-22 解除済み）

記録として残す。OAuthProvider を消したコードは、本番の `/mcp` アプリと vars が揃う前に本番へ出すと本番 MCP が止まる。コードに旧経路の分岐は残していない。

- **開始**: この PR（`feat/mcp-access-portal`）の merge。main への merge で stg は自動 deploy されるが、本番は手動 dispatch なので、dispatch しない限り出ない。
- **解除**: 本番 vars（`CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` / `CF_ACCESS_MCP_AUD`）を入れた PR を merge し、その状態で本番を deploy して、下の本番チェックが通ったとき。間に別件で本番を dispatch しない。

#### チェックリスト

- [ ] stg: JWT 無しの `POST https://stg.napochaan.com/mcp` が Access の `401` + `WWW-Authenticate: Bearer … resource_metadata=…` を返す
- [ ] stg: `GET https://stg.napochaan.com/api/mcp`（外部から直叩き）が `404`。stg はホスト全体のアプリが `/api/*` も覆うので、Access 未ログインだと Access に弾かれて（非ブラウザは `401`、ブラウザは `302`）`mcp-guard` まで届かない。Access にログインした状態で確かめる（または prod で確かめる）
- [ ] stg: Access が `/.well-known/oauth-protected-resource/mcp` と `/.well-known/oauth-authorization-server` を返す（`cf-version` ヘッダー付き。worker の `mcp-oauth-metadata` ではない）
- [ ] stg: `napochaanstg` を再認証した（`/mcp` パス単位アプリを削除したため）
- [ ] stg: Claude Desktop から Portal（`napochaanstg`）経由で `list_posts` / `get_post` / テスト下書きの `update_post` / `create_upload_url` → upload が通る
- [ ] stg: origin に届く JWT の `aud` と `type` を実測した。`aud` がホスト全体アプリの AUD（`CF_ACCESS_MCP_AUD`）と違えば vars を直す（Portal に server を登録すると mcp 種別のアプリが別 AUD で自動作成されることがある。どちらが届くかは未確認）。`type` が `app` でなければ verify の扱いを見直す
- [x] prod: `/mcp` アプリ作成・vars 反映・deploy の後、Portal の `napochaan` を登録・認証し、sync で 18 tools を取得（`route.ts` の JWT 検証と user 解決を通過）
- [ ] prod: Claude Desktop の旧コネクタ（`napochaan.com/mcp` 直結）を外し、Portal 経由に付け直した
- [x] prod: 凍結を解除した（2026-10-22）

`OAUTH_KV` は binding をこの PR で外し、namespace 本体（`napochaan-mcp-oauth-staging` / `napochaan-mcp-oauth-production`）も 2026-10-22 に削除した。

### 有効な間の password 書き込み拒否

`disableLocalStrategy: { enableFields: true }` で hash 列を残しているので、何もしないと Payload は REST / local API の create / update に含まれる `password` を hash して保存する。保存された password は Access の範囲では使われないが、切り戻して local strategy が戻った瞬間に生きた資格情報になる。そこで plugin は、有効な間だけ対象の auth collection に `beforeOperation` hook を先頭に足し、`operation` が `create` / `update`（ID 指定・一括とも）で `data` に `password` キーがあれば（値に関係なく）拒否する（`packages/payload-cloudflare-access/src/password-guard/index.ts`）。field hook（`beforeChange`）で消すのでは遅い（Payload の `updateDocument` は field hook より前に `data.password` を取り出す）。`forgotPassword` / `resetPassword` は `disableLocalStrategy` の間 Payload 自身が Forbidden にする。

- 応答は 403、message は `Cloudflare Access 有効時はパスワードを設定できません`。
- `CLOUDFLARE_ENV` で Access 有効な env を向けた Payload CLI / seed にも効く。`pnpm seed:import`（`dev@napochaan.com` を password 付きで作る）はその env では失敗する。content だけなら `seed:import:prod` を使う（users に触れない）。
- 確認（Access ログイン済みの JWT を使う。`<id>` は自分の user の id）:

  ```bash
  curl -i -X PATCH https://stg.napochaan.com/api/users/<id> \
    -H 'Origin: https://stg.napochaan.com' -H 'Content-Type: application/json' \
    --cookie 'CF_Authorization=<自分の JWT>' \
    -d '{"password":"x"}'
  ```

  期待値は 403 と上の message。`password` を含まない更新（`{"name":"x"}`）は通る。

### クロスサイト遷移の `/admin` への着地

Access ログイン直後の着地は IdP 経由のリダイレクトの末尾なので、Origin の無いクロスサイトのトップレベル GET になる。strategy はこれを通す必要があるが、headers しか受け取らないのでパスを見られない。そこで worker（`worker/middleware/path-policy/plugins/admin-landing/index.ts`。`path-policy` の plugin）が、`GET` / `HEAD` で `Sec-Fetch-Site: cross-site` かつ `Sec-Fetch-Dest: document` の要求のうち、パスが `/admin` より深い（`/admin/` で始まり、`/admin/` そのものではない。percent-encoding は decode して判定）ものを `302 Location: /admin`（`Cache-Control: no-store`）で返す。`/admin` と `/admin/` はそのまま通す。同一 origin / same-site / `none` / fetch metadata 無し、`GET` / `HEAD` 以外は触らない。

- 別サイトのリンクから `/admin/collections/<autosave を持つ collection>/create` などを踏ませて、GET の描画で下書きや一覧の preference を書かせる経路を塞ぐため。
- 代償: Access のログイン前に開いていた深いパス（ブックマークなど）は、ログイン後に `/admin` へ着地する。開き直せばよい。
- 確認（Access ログイン済みの JWT を使う）:

  ```bash
  curl -sI https://stg.napochaan.com/admin/collections/blog \
    -H 'Sec-Fetch-Site: cross-site' -H 'Sec-Fetch-Dest: document' \
    --cookie 'CF_Authorization=<自分の JWT>' | grep -i -E '^(HTTP|location|cache-control)'
  ```

  期待値は `302` / `location: /admin` / `cache-control: no-store`。`Sec-Fetch-Site: same-origin` にすると 200 になる。

### AUD の実測記録

stg はホスト全体のアプリ 1 つなので、JWT の `aud` は常にその AUD のはず。設定した AUD と実際の `aud` が一致することを実測して表に残す（値は検証時に埋める）。prod はパス単位のアプリ（`/admin*` と `/mcp`）が別 AUD なので、prod の deploy 後に同じ表で確かめる。

測り方は 2 つ。

- `wrangler tail --env <env>` で strategy の warn（`Cloudflare Access authentication rejected`）を見る。AUD が `CF_ACCESS_AUD` に無いと、検証失敗として warn が出る（`source` が `header` か `cookie` かも出る）。
- ブラウザの DevTools で JWT（`Cf-Access-Jwt-Assertion` header、または `CF_Authorization` cookie）をコピーして decode し、`aud` を読む。

| リクエスト                           | token の経路（header / cookie） | JWT の `aud`（どのアプリか） |
| ------------------------------------ | ------------------------------- | ---------------------------- |
| `/admin` の画面遷移                  |                                 |                              |
| admin の XHR（`/api/users/me` など） |                                 |                              |
| 公開ページ（`/`）                    |                                 |                              |
| `/api/media/file/*`（公開画像）      |                                 |                              |

### cookie 経路の確認は prod で

stg はホスト全体のアプリが `/api/*` にも `Cf-Access-Jwt-Assertion` header を付け、strategy は header を優先するので、stg では cookie 経路が検証されない（Bypass アプリは使わない）。cookie 経路（`CF_Authorization`）は prod の初回 deploy で確認する（下の「5. prod へ反映」）。

## 5. prod へ反映

stg の検証が済んだら、手順 3 を `[env.production.vars]` で行って `pnpm deploy:production`。

2026-10-22 に反映済み:

| アプリ                 | id          | AUD（`[env.production.vars]`）     |
| ---------------------- | ----------- | ---------------------------------- |
| `napochaan.com/admin*` | `a0d523ec…` | `73b87411…`（`CF_ACCESS_AUD`）     |
| `napochaan.com/mcp`    | `9baf3237…` | `5f5acc5a…`（`CF_ACCESS_MCP_AUD`） |

prod 後の確認:

- [x] `https://napochaan.com/admin` で Access のログイン → 自動で admin に入る（admin の XHR `/api/users/me` が cookie 経路で 200、strategy `cloudflare-access`）
- [ ] `/mcp` は上の「MCP（`/mcp` アプリと MCP Portal）」のチェックリストで確かめる（本番 deploy の凍結を解除するのもそこ）
- [ ] 公開ページと `/api/media/file/*` が Access なしで見える
- [ ] stg では cookie 経路を検証できないので、ここで確認する: 手順 4 の項目 3（admin 内の操作）/ 6（別 origin の probe）/ 7（JWT なしの `/api/users/me`）/ 7a（Live Preview と `/next/preview`）

## 切り戻し

1. `wrangler.toml` の `[env.<env>.vars]` から `CF_ACCESS_AUD` を**消して** deploy する（`CF_ACCESS_TEAM_DOMAIN` は `/mcp` も使うので、MCP を生かすなら残す。plugin は `CF_ACCESS_AUD` が空なら無効になる）。

- plugin が無効に戻り、strategy が外れて `disableLocalStrategy` も外れる。email + password ログインが復活する。
- **migration は不要。** `disableLocalStrategy: { enableFields: true }` なので email / hash 列は schema に残ったまま（schema は dev と一致している）。
- 自動作成した user は password を持たないので、そのままでは入れない。手順 1 で本人の user に password を設定しておくこと。
- 設定ミスで admin に誰も入れなくなったときも、これで戻る。
- Access 有効な間は password の書き込みが拒否されるので、有効な間に新しく password を持った user は居ない（手順 1 で事前に設定した本人の user と、有効化より前から居た user だけ）。
- **注意（CLI 経由で作った user）**: `CF_ACCESS_*` を wrangler の env に入れた後は、その env を向けた Payload CLI（`CLOUDFLARE_ENV=staging|production pnpm payload …`、seed スクリプトなど）も plugin を有効の状態で読み込み、local strategy が無効になる。この経路で作った user も password を持たない（`password` を渡すと 403 で拒否される）。通常の運用では問題にならず、切り戻しのときだけ効く（手順 1 の password 事前設定は、Access 有効化前に済ませる）。

**MCP の切り戻し**: `CF_ACCESS_*` を消しても MCP は元に戻らない（OAuthProvider はコードから消してある）。この PR のコードを revert し、KV namespace を作り直して（2026-10-22 に削除済み。旧 token / client 登録は失われているので、利用者は接続し直す）`wrangler.toml` の `OAUTH_KV` binding（各 env）に新しい id を入れて deploy する。旧経路に戻すなら `/mcp` の Access アプリも外す（残すと Access が先に認証を要求する）。この切り戻しは**未検証**。

## 注意

- **prod では `/api/*` を Access アプリに入れない。**（stg はホスト全体アプリが `/api/*` も覆うが、stg は全体が本人専用なので許容している。）`/api/media` は公開画像の配信（repo 内に約 30 箇所の参照がある）。`/api/mcp` は外部から `mcp-guard` が 404 にし、MCP は `/mcp` のアプリから worker が forward する（prod は別アプリ・別 AUD）。admin の XHR は `CF_Authorization` cookie で認証する。
- **Worker 単位の Access（`ctx.access`）を使わない。** `[assets]` 付き Worker（OpenNext）には `ctx.access` が渡らない。また Worker 単位の Access は WebSocket upgrade を 403 にするので、`CURSOR_ROOM` が動かなくなる（[Workers: Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)）。パス単位の self-hosted アプリ + アプリ内の JWT 検証にしている。
- **admin に入れない場合は、まず `wrangler tail --env <env>` で strategy の warn を見る**（`Cloudflare Access authentication rejected`: token / CSRF / 検証の失敗、`Cloudflare Access user resolution failed`: users の検索・作成の失敗）。
- **Access の env が設定されているのに対象の auth collection が無いと、config の build 時に `AccessTargetCollectionNotFound` で落ちる。** 黙って無効にすると password ログインが残る（fail-open）ので、これは意図した fail-loud。対象は `collection` option → `admin.user` → 最初の auth collection の順で決まる。
- **ログアウトは `POST /api/<slug>/access-logout`（plugin が対象 collection に足す endpoint）を経て `/cdn-cgi/access/logout` へ。** `/cdn-cgi/access/logout` は Access のセッション cookie しか消さない。そのままだと次の 2 つがブラウザに残るので、endpoint が先に消してから `303` で Access のログアウトへ送る（`Cache-Control: no-store`）。
  - `payload-token`（名前は `<cookiePrefix>-token`）: Access の user にも `/api/users/refresh-token` が発行する。`local-jwt` が登録されないので今は読まれないが、Access を外して切り戻した瞬間に生きる。Domain / SameSite / Secure は collection の `auth.cookies` に合わせる（Payload の `generateExpiredPayloadCookie`）。
  - `__prerender_bypass`（Next の draft mode）: 残すと、ログアウト後もそのブラウザで preview ページが下書きを表示し続ける。Next が付けるのと同じ `Path=/; HttpOnly; Secure; SameSite=None` で消す。
  - 別サイトの form POST で本人をログアウトさせないよう、cookie 経路と同じ CSRF 検査（`Origin` が `payload.config.csrf` に無い・`Sec-Fetch-Site: cross-site` なら拒否）を通らなければ 403 を返し、cookie には触れない。
  - Access のログアウトは全 Access アプリのセッションを失効させる（アプリ単位のログアウトは不可）。IdP のセッションは残るので、次に `/admin` へ来たとき IdP がそのまま通して、ログイン画面を経ずに再ログインされることがある。
  - 対象 collection が `endpoints: false` だと、config の build 時に `AccessLogoutEndpointsDisabled` で落ちる（endpoint を足すと Payload が既定の REST まで戻してしまうため。`AccessTargetCollectionNotFound` と同じ fail-loud）。
- **クロスサイトのトップレベル GET は `/admin` にだけ通す（残るリスク）。** Access ログイン後の着地を通すため、header 由来の Origin 無しのトップレベル遷移は CSRF 検査で拒否しない。`/admin` より深いパスへのクロスサイト遷移は worker が `/admin` へリダイレクトする（上の「クロスサイト遷移の `/admin` への着地」）ので、別サイトのリンクで `/admin/collections/<autosave を持つ collection>/create` を踏ませて空の下書きを作らせる（Payload の Document view は GET で下書きを作る）経路は塞いである。
  - 残りとして、fetch metadata を送らない古いブラウザ（Safari 16.4 未満など）は、クロスサイトの遷移や `<img>` などの GET を `Origin` も `Sec-Fetch-*` も無しで送るので、worker のリダイレクトにも CSRF 検査にもかからずに通る（判定上は curl と区別できない）。この場合は上の空の下書きが 1 件できうる。データの漏洩・改変は無いので許容している。見覚えの無い空の下書きがあれば消してよい。POST などは `Origin` が付くので拒否される。
- **`Cf-Access-Authenticated-User-Email` ヘッダーは信用しない。** 実装も読んでいない。Access を通らない経路では誰でも付けられる。JWT の署名・`iss`・`aud` を検証した email だけを使う。
- `workers_dev` / `preview_urls` は全 env で false。Access を迂回する入口は無い。将来有効にするとその hostname は Access アプリの外になる。
- セッションはリクエストごと。Payload の JWT cookie では認証しない（`local-jwt` が登録されないので、`/api/users/refresh-token` が発行する `payload-token` も読まれない）。admin の各リクエストで Access JWT の検証と users の検索が走る。Access の `exp` は admin に伝わらないので、期限切れ警告モーダルは出ない。
- MCP は admin の plugin を通らない。`/mcp` は（prod では別アプリ・別 AUD、stg では admin と同じホスト全体アプリ）、`route.ts` が自分で JWT を検証し、既存 user を find するだけ（auto-create しない）。user が居なければ 403。

## ローカル開発

`.dev.vars` の `CF_ACCESS_TEAM_DOMAIN=` / `CF_ACCESS_AUD=` / `CF_ACCESS_MCP_AUD=` は**空のまま**にする。plugin は無効で、従来どおり email + password ログイン（と `autoLogin.prefillOnly`）が使える。`pnpm seed:import` も password 付きの dev admin を作れる（plugin が有効だと password の書き込みが拒否されて失敗する）。`CF_ACCESS_MCP_AUD` が空だと `/api/mcp` は 500（fail closed）で、`next dev` は worker シェルを経由しないので、MCP の動作確認は stg で行う。

`.dev.vars` にキーを追加・変更したら型を再生成する:

```bash
pnpm cf:types
```

直らないときは古い `tsconfig.tsbuildinfo` を消す。どちらも gitignore の生成物で、差分には出ない。

## 参考

- [Validate JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Application token](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/)
- [Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)
- [Session management / logout](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/)
- [Workers: Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
