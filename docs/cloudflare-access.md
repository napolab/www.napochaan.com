# Cloudflare Access による Payload admin 自動ログイン runbook

Cloudflare Access を通過した人を、Access が発行した JWT の email で Payload admin にそのままログインさせる。plugin は npm の `@napolab/payload-cloudflare-access`(Payload 側: plugin / strategy / resolve-user / logout / password-guard / ログアウトボタン)と `@napolab/cloudflare-access-core`(Payload 非依存: JWT 検証 / AUD / team 名 / token 取り出し / CSRF)で、`apps/cms/package.json` で完全固定(`^` なし)している。ソースは別 repo [`napolab/payload-plugins`](https://github.com/napolab/payload-plugins)(2026-10-26 に `packages/payload-cloudflare-access` から切り出した)。設計は `docs/superpowers/specs/2026-10-05-payload-cloudflare-access-design.md`、調査は `reports/2026-10-05-payload-cloudflare-access-research.md` を参照。

**CMS 分離後の構成**（`docs/superpowers/specs/2026-11-12-cms-split-design.md`）: Payload・admin・REST・MCP は **cms Worker**（`apps/cms`）にあり、cms のホスト（`cms.napochaan.com` / `cms-stg.napochaan.com`）全体を Access の self-hosted アプリ 1 つ（Managed OAuth ON）が覆う。例外は `/api/media-upload` のパス単位 **Bypass アプリ**（認可はクエリの HMAC 署名だけ）。公開サイト（web Worker）は Payload を持たず、admin も MCP も無い。web は prod（`napochaan.com`）に Access を付けず、stg（`stg.napochaan.com`）だけホスト全体の Access 配下（本人専用）。web → cms は Service Binding（`env.CMS`）なので Access を通らない。以下で「stg」「prod」と書くのは cms の環境（`cms-stg` / `cms`）のこと。

stg / prod で `CF_ACCESS_*` が揃ったときだけ有効になる。有効な間は email + password ログインが無効になり、**Access のポリシーが唯一の認可境界**になる（users に role は無い。ポリシーを通った人は全員 admin 権限を持つ）。password の設定・変更も拒否される（下の「有効な間の password 書き込み拒否」）。

MCP（`/mcp`）は同じホスト全体アプリ（Managed OAuth）+ MCP Portal 経由で認証する。admin と MCP は同じアプリ・同じ AUD を共有する（`CF_ACCESS_AUD` と `CF_ACCESS_MCP_AUD` に同じ値）。OAuth 同意画面（`/oauth/authorize`）と OAuthProvider は廃止した。設計は `docs/superpowers/specs/2026-10-22-mcp-access-portal-design.md`、手順は下の「MCP（`/mcp` アプリと MCP Portal）」。

全ての `wrangler` / Payload CLI コマンドは account id が必要（無いと exit 13）:

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
```

| env     | cms host                  | wrangler 設定（`apps/cms/wrangler.jsonc`）  |
| ------- | ------------------------- | ------------------------------------------- |
| staging | `cms-stg.napochaan.com`   | `env.staging.vars`                          |
| prod    | `cms.napochaan.com`       | `env.production.vars`                       |

### Access アプリ構成

| env  | Access アプリ                                                                                                                                  | AUD                                                              |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| cms-stg | **ホスト全体の self-hosted アプリ 1 つ**（`cms-stg.napochaan.com`、id `d3d96d5f…`、Managed OAuth ON）。admin も `/mcp` もこれが覆う          | `c582e273…`（`CF_ACCESS_AUD` と `CF_ACCESS_MCP_AUD` に同じ値）   |
| cms-stg | **Bypass アプリ**（`cms-stg.napochaan.com/api/media-upload`、id `a1a923cc…`、policy: everyone）。サブパスも bypass される                    | `27823ee1…`（Worker は検証しない。vars には入れない）            |
| cms（prod） | 同じ 2 アプリ構成を `cms.napochaan.com` に作る（**未作成。TODO**）                                                                        | 作成後に `env.production.vars` の `CF_ACCESS_AUD` / `CF_ACCESS_MCP_AUD` へ |
| web stg | `stg.napochaan.com` のホスト全体アプリ（本人専用。web は JWT を検証しない）                                                                   | —                                                                |
| web prod | なし                                                                                                                                         | —                                                                |

- ポリシーは `naporitan`（本人の email のみ）だけ。IdP は GitHub。ホスト全体アプリと Bypass アプリはどちらも Managed OAuth 設定・セッション等を stg の既存アプリからコピーしてある。
- ホスト全体アプリと `/api/media-upload` の Bypass アプリは同じホストで併用できる（spike で確認: `reports/2026-11-12-cms-split-spike.md` §5。`/api/media-upload` とサブパスは Worker に届き、`/api/media-uploadX` や `/` `/admin` `/mcp` は 401）。
- ホスト全体アプリは `/api/*` も覆う。ログイン後の全リクエストに `Cf-Access-Jwt-Assertion` が付くので、通るのは header 経路。
- Managed OAuth が ON のため、未認証の非ブラウザ要求は cms のどのパスでも `401`（`/api/media-upload` を除く）、ブラウザのページ遷移は Access のログインへ `302`。
- 以前の prod の構成（`napochaan.com/admin*` と `napochaan.com/mcp` のパス単位アプリ 2 つ、別 AUD）は cms 分離で廃止する対象（公開サイトが `napochaan.com` に残るため、cms 移行後はこれらのアプリは使われない）。

## 有効化の条件（先に読む）

`apps/cms/src/payload.config.ts` が `cfEnv.CF_ACCESS_TEAM_DOMAIN` と `cfEnv.CF_ACCESS_AUD` を plugin に渡す。plugin は **両方が空でない**ときだけ有効になる（`napolab/payload-plugins` の `packages/payload-cloudflare-access/src/plugin/index.ts`）。

| `CF_ACCESS_TEAM_DOMAIN` | `CF_ACCESS_AUD`                          | 結果                                          |
| ----------------------- | ---------------------------------------- | --------------------------------------------- |
| あり                    | あり                                     | 有効（strategy 追加 + password ログイン無効） |
| あり                    | 未設定 / 空 / 空白だけ（`,` だけも含む） | **黙って無効**（password ログインのまま）     |
| 未設定 / 空             | あり                                     | **黙って無効**（password ログインのまま）     |
| team 名にならない値     | あり                                     | config の評価時に `InvalidAccessTeamDomain`   |

- `NODE_ENV` では判定しない。片方だけ・空白だけでも例外は出ず、ログにも出ない（例外は、両方そろって有効化するときに `CF_ACCESS_TEAM_DOMAIN` が team 名にならない場合だけ。下記）。有効化したつもりで無効のままになっていないか、検証（手順 4）で必ず確かめる。
- `CF_ACCESS_AUD` は**カンマ区切りで複数指定できる**（各要素は trim され、空要素は捨てられる）。JWT の `aud` がどれか 1 つに一致すれば通る。cms はホスト全体のアプリ 1 つ（admin / MCP 共通）なので、通常は 1 つの値でよい。
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

   | env  | アプリ                                                                                      |
   | ---- | ------------------------------------------------------------------------------------------- |
   | stg  | `cms-stg.napochaan.com`（ホスト全体 1 つ。admin と `/mcp` を覆う）+ `/api/media-upload` の Bypass |
   | prod | `cms.napochaan.com`（同上）                                                                 |

   どちらも Managed OAuth を ON にしたホスト全体アプリ 1 つが admin と MCP の両方を担う。`/api/media-upload` だけは別のパス単位アプリ（Bypass、policy: everyone）にする。upload の認可は Worker 側の HMAC 署名（`create_upload_url` が発行）だけで行う。

3. **ポリシー**: Allow、include は**本人の email のみ**。
4. ホスト全体アプリと共存させるパス単位アプリは `/api/media-upload` の Bypass **だけ**にする（`/admin*` や `/mcp` のパス単位アプリは作らない）。admin / MCP の JWT の `aud` は常にホスト全体アプリの AUD になるので、vars に入れる AUD は 1 つ（手順 3）。Bypass アプリの AUD は Worker が検証しないので控えても vars には入れない。
5. **Cookie の SameSite を Lax にする**（各アプリの設定 → Cookie settings。多層防御）。Lax でもトップレベルの GET 遷移には cookie が付くので、Access ログイン後の redirect は動く。クロスサイトの POST やサブリソース（img / iframe / fetch）には cookie が付かなくなる。strategy 自体も header 由来・cookie 由来ともクロスサイト要求を拒否するので、これに依存はしない。
6. **Cookie Path Attribute は OFF のまま**にする（既定。ホスト全体アプリには関係しない）。ON にするとパス単位で cookie が絞られ、admin の XHR（`/api/*`）が認証できなくなりうる（[Authorization cookie](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/#cookie-path-attribute)）。

## 3. AUD を控えて wrangler vars に反映する

**値が確定するまで vars を追加しない。** 誤った AUD で有効化すると、strategy がすべての JWT を拒否して誰も admin に入れなくなる（password ログインも無効になっているため）。

1. 各 Access アプリの AUD tag を控える（アプリの Overview / 設定画面に表示される Application Audience (AUD) Tag）。
2. `apps/cms/wrangler.jsonc` に追加する。top-level の `vars`（local）には**置かない**。local では plugin を無効のままにする。

   ```jsonc
   "env": {
     "staging": {
       "vars": {
         // ...既存の vars（WEB_ORIGIN / CMS_ORIGIN）...
         "CF_ACCESS_TEAM_DOMAIN": "<team>",
         "CF_ACCESS_AUD": "<host-wide app の AUD>",      // 1 つ
         "CF_ACCESS_MCP_AUD": "<host-wide app の AUD>"   // admin と同じ値（MCP は下の節）
       }
     },
     "production": {
       "vars": {
         "CF_ACCESS_TEAM_DOMAIN": "<team>",
         "CF_ACCESS_AUD": "<host-wide app の AUD>",
         "CF_ACCESS_MCP_AUD": "<host-wide app の AUD>"
       }
     }
   }
   ```

   AUD は秘密情報ではないので secret ではなく vars でよい。stg と prod の AUD は別の値になる。

3. 型を再生成する（`.dev.vars.example` に空値の `CF_ACCESS_TEAM_DOMAIN=` / `CF_ACCESS_AUD=` が入っているので `CloudflareEnv` に型が出る）:

   ```bash
   pnpm --filter cms cf:types
   ```

4. deploy する。まず stg だけ（cms → web）:

   ```bash
   pnpm deploy:staging
   ```

   prod は stg の検証（手順 4）が済んでから `pnpm deploy:production`（cms → web → warm-up）。

## 4. stg 検証チェックリスト

cms-stg の deploy 後、次を順に確かめる。

**前提**: cms のホスト全体アプリは全パス（`/api/*` を含む）に `Cf-Access-Jwt-Assertion` header を付ける。ログイン後の全リクエストが header 経路になり、`CF_Authorization` cookie 経路は検証されない（cookie 経路を使うパス単位アプリは廃止した）。項目 6（別 origin の probe）は header 由来も CSRF 検査を受けるので、`{"user":null}` を期待値として確認できる。

- [ ] 1. cms-stg にホスト全体のアプリ（Managed OAuth ON、policy `naporitan` のみ）と `/api/media-upload` の Bypass アプリを作り、ホスト全体アプリの AUD を `env.staging.vars` の `CF_ACCESS_AUD` / `CF_ACCESS_MCP_AUD` に設定して deploy した
- [ ] 2. `/admin` に入ると自動ログインされ、ログインフォームが出ない
- [ ] 3. admin 内の操作（一覧・保存・画像アップロード）が通る（Server Action による保存も含む）
- [ ] 4. 未登録 email で入ると user が自動作成される
- [ ] 5. admin の nav のログアウトで Access のログアウト画面に遷移し（`POST /api/users/access-logout` → `303 Location: /cdn-cgi/access/logout`）、再度 `/admin` に行くと Access のログインを求められる。IdP のセッションが残っていると、ログイン画面を経ずにそのまま再ログインされることがある（IdP 側のログアウトは別）。
  - DevTools → Network で `access-logout` の応答に `payload-token` と `__prerender_bypass` を消す `Set-Cookie` が 2 本あり、Application → Cookies からも両方が消えている
  - 別 origin からの POST は 403 で、`Set-Cookie` も `Location` も返らない。ホスト全体アプリが `/api/*` も覆うので、`CF_Authorization` を付けないと Access に弾かれる（非ブラウザは `401`、ブラウザは `302`）。JWT を DevTools からコピーする: `curl -si -X POST -H 'Origin: https://evil.example' --cookie CF_Authorization=<JWT> https://cms-stg.napochaan.com/api/users/access-logout`
- [ ] 6. 別 origin からのリクエストで認証が解決されない（`user: null`）。JWT は Access ログイン済みブラウザの DevTools → Application → Cookies からコピーする。probe には `GET /api/users/me` を使う:

  ```bash
  curl -i https://cms-stg.napochaan.com/api/users/me \
    -H 'Origin: https://evil.example' \
    --cookie 'CF_Authorization=<自分の JWT>'
  ```

  期待値は `{"user":null}`（`Origin` が `payload.config.csrf` = cms 自身の origin に無いので user を解決しない）。`wrangler tail` には `Cloudflare Access authentication rejected` の warn が `CrossSiteAccessRequest` と `source` 付きで出る。比較用に `Origin: https://cms-stg.napochaan.com` を付けると `user` が返る。

  `Origin` が無いときの扱いは経路で違う（`napolab/payload-plugins` の `packages/cloudflare-access-core/src/csrf/index.ts`）。header 由来は `Sec-Fetch-Site: cross-site` かつ `Sec-Fetch-Dest` が `document` 以外（img / iframe / fetch など）だけを拒否する。

- [ ] 7. JWT なしの `/api/users/me` は Access に弾かれる（非ブラウザは `401`、ブラウザは `302`。`user: null` の JSON は返らない）
- [ ] 7a. Live Preview（admin の iframe が web の `/next/preview` を開く）が、Access ログイン済みの編集者で表示できる。web stg もホスト全体 Access 配下なので、同じブラウザで web stg にもログイン済みであること
- [ ] 8. `/mcp` の確認は下の「MCP（`/mcp` アプリと MCP Portal）」のチェックリストで行う
- [ ] 8a. Access 有効な間、password の書き込みが 403 で拒否される（下の「有効な間の password 書き込み拒否」）
- [ ] 8c. 上の curl で、cross-site の深い `/admin/...` が `302 /admin` になる（admin-landing）
- [ ] 8b. `POST /api/media-upload`（`create_upload_url` で発行した署名付き URL）が、Access ログイン無しで Worker に届く（署名が不正なら 4xx が Worker から返る。Access の `401` ではない）。`/api/media-uploadX` は `401`
- [ ] 9. 実際に JWT に入る AUD が、設定した AUD と一致することを記録した（下の「AUD の実測記録」）

加えて次も確かめる。

- [ ] **別タブでログアウトした後の挙動**: 2 つのタブで admin を開き、片方で Access からログアウトする。もう片方で admin を操作（保存・一覧の再取得・画面遷移）して、次のどちらになるかを記録する。
  - フォームの無いログイン画面に落ちる（local strategy が無効なので LoginForm は描画されない）
  - Access の再ログインに誘導される（ホスト全体アプリなので、こちらになる想定）
  - XHR（`/api/*`）は Access の `401` / `302` になる想定。実測値を記録する。

  実測結果（検証時に追記）:

### MCP（`/mcp` アプリと MCP Portal）

```
Claude Desktop ─▶ MCP Portal (mcp.napochaan.com)
                   │ Access Managed OAuth（DCR。同意 = Access ログイン）
                   ▼
   <cms host>/mcp  ← Access アプリ（policy naporitan。cms のホスト全体アプリ）
                   │ Cf-Access-Jwt-Assertion を付けて origin へ
                   ▼
   cms worker /mcp ルート → pathname を /api/mcp に書き換えて forward
                   ▼
   apps/cms/src/app/api/mcp/route.ts
     1. JWT を CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_MCP_AUD で検証
     2. email で既存 Payload user を find（作らない）
```

- 失敗時: JWT 無し・不正・user 不在は `403`、`CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_MCP_AUD` 未設定は `500`（fail closed）。user の検索自体の失敗（D1 障害など）も `403` ではなく `500`。
- 外部からの `/api/mcp` 直叩きは `mcp-guard` が 404 にする。`x-mcp-user-id` は廃止した。
- **`CF_ACCESS_MCP_AUD`**（カンマ区切り可）: cms はホスト全体アプリ 1 つなので、`CF_ACCESS_AUD` と**同じ AUD** を入れる（admin / MCP の AUD 分離は効かない。受容したトレードオフ）。コードが `CF_ACCESS_MCP_AUD` だけを読むため、別 var として持つ。`CF_ACCESS_TEAM_DOMAIN` は admin と共用する。
- **OAuth discovery**: cms はホスト全体アプリ（Managed OAuth ON）なので、Access 自身が `/.well-known/oauth-protected-resource/mcp`、`/.well-known/oauth-authorization-server`、`/.well-known/cloudflare-access-protected-resource/mcp`（応答ヘッダー `cf-version`）を返す。Access が返さない構成（パス単位アプリ）に備えた cms worker 側のフォールバックとして `apps/cms/src/worker-routes/mcp-oauth-metadata` が残っており、`CF_ACCESS_TEAM_DOMAIN` と `CF_ACCESS_MCP_AUD` が揃っているときだけ標準 discovery（RFC 9728 / RFC 8414）を返す（`public, max-age=300`。上流の失敗は `502` + `no-store`）。ホスト全体アプリの前段では Access が先に応答するので通常は到達しない。
- MCP は admin の plugin が有効かどうかに関係なく動く。逆に、admin を password ログインに戻す目的で `CF_ACCESS_TEAM_DOMAIN` まで消すと `/mcp` が 500 になる（下の「切り戻し」）。

#### Cloudflare 側の設定

`cf` での書き込みは `CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72 pnpm dlx cf@latest --profile napochaan …` で、`--dry-run` → 確認 → 実行 → 再読み込みで確認。

MCP は cms のホスト全体アプリ（`cms-stg.napochaan.com` / `cms.napochaan.com`。admin と共用）が担う。次の設定にする:

- `type: self_hosted`、policy は再利用ポリシー `naporitan`（本人の email のみ allow、bypass 無し）、IdP は GitHub-naporin0624、`session_duration: 24h`、`http_only_cookie_attribute: true`、`app_launcher_visible: false`
- Managed OAuth を ON: grant `336h` / access token `15m`
- Dynamic Client Registration を許可し、`allowed_uris` は `https://mcp.napochaan.com/servers-callback` と dash の mcp-server oauth-callback（`https://dash.cloudflare.com/<account id>/one/access-controls/ai-controls/mcp-server/oauth-callback/*`）。localhost / loopback は許可
- claude.ai 直結用の callback は入れない（Portal 経由のみ）

MCP Portal `napochaan-mcp-portal`（`mcp.napochaan.com`）:

- server id は prod が `napochaan`、stg が `napochaanstg`（アンダースコア無し）。`auth_type: oauth`（DCR）で登録し、Require user auth を ON
- **cms 分離で server の URL が変わる**（`https://cms-stg.napochaan.com/mcp` / `https://cms.napochaan.com/mcp`）。server の URL を更新して `napochaanstg` / `napochaan` を再認証する（既存の token は旧ホスト・旧アプリ向けに発行されたもので、cms のホスト全体アプリでは使えない。dashboard の「Save and connect server」→ Claude Desktop 側も接続し直す）
- 管理者の初回 OAuth は dashboard の「Save and connect server」でしかできない（本人の操作）
- API の PUT は `servers` 配列を**全体置換**する。追加するときは既存の server（`inbox` など）も含めて送るか、dashboard で足す

#### 有効化の手順

1. cms のホスト全体アプリ（Managed OAuth ON）を作り、AUD を控える（admin と同じ AUD）。
2. `apps/cms/wrangler.jsonc` の `env.<env>.vars` に `"CF_ACCESS_MCP_AUD": "<ホスト全体アプリの AUD>"` を足す（`CF_ACCESS_TEAM_DOMAIN` は admin の手順 3 で入っているもの）。値が確定するまで足さない。誤っていると全 MCP リクエストが 403 になる。
3. Portal に server を登録して connect し、Claude Desktop から Portal 経由で接続する。
4. prod は `cms.napochaan.com` のホスト全体アプリと vars（手順 1・2）が揃うまで、`/mcp` は 500（fail closed）のまま。揃うまで Portal の `napochaan` は旧 URL（`napochaan.com/mcp`、cms 分離後は 404）を指さない — 揃えてから URL を切り替える。

#### 過去の本番 deploy の凍結（2026-10-22 解除済み、記録）

OAuthProvider を消したコードは、本番の `/mcp` アプリと vars が揃う前に本番へ出すと本番 MCP が止まる、という凍結だった。コードに旧経路の分岐は残していない。cms 分離後も同様に、`cms.napochaan.com` の Access アプリと vars（`CF_ACCESS_AUD` / `CF_ACCESS_MCP_AUD`）が揃うまで本番 MCP は動かない（`apps/cms/wrangler.jsonc` の TODO）。

#### チェックリスト

- [ ] stg: JWT 無しの `POST https://cms-stg.napochaan.com/mcp` が Access の `401` + `WWW-Authenticate: Bearer … resource_metadata=…` を返す
- [ ] stg: `GET https://cms-stg.napochaan.com/api/mcp`（外部から直叩き）が `404`。ホスト全体のアプリが `/api/*` も覆うので、Access 未ログインだと Access に弾かれて（非ブラウザは `401`、ブラウザは `302`）`mcp-guard` まで届かない。Access にログインした状態で確かめる
- [ ] stg: Access が `/.well-known/oauth-protected-resource/mcp` と `/.well-known/oauth-authorization-server` を返す（`cf-version` ヘッダー付き。worker の `mcp-oauth-metadata` ではない）
- [ ] stg: `napochaanstg` の URL を `https://cms-stg.napochaan.com/mcp` に更新して再認証した
- [ ] stg: Claude Desktop から Portal（`napochaanstg`）経由で `list_posts` / `get_post` / テスト下書きの `update_post` / `create_upload_url` → upload が通る
- [ ] stg: origin に届く JWT の `aud` と `type` を実測した。`aud` がホスト全体アプリの AUD（`CF_ACCESS_MCP_AUD`）と違えば vars を直す（Portal に server を登録すると mcp 種別のアプリが別 AUD で自動作成されることがある。どちらが届くかは未確認）。`type` が `app` でなければ verify の扱いを見直す
- [x] prod（cms 分離前の `napochaan.com/mcp`）: Portal の `napochaan` を登録・認証し、sync で 18 tools を取得（`route.ts` の JWT 検証と user 解決を通過）。cms 分離後の `cms.napochaan.com` では再確認が要る
- [ ] prod: `cms.napochaan.com` の Access アプリ・vars を揃え、Portal の `napochaan` の URL を `https://cms.napochaan.com/mcp` に更新して再認証した
- [ ] prod: Claude Desktop の旧コネクタ（`napochaan.com/mcp` 直結）を外し、Portal 経由に付け直した
- [x] prod: 凍結を解除した（2026-10-22）

`OAUTH_KV` は binding をこの PR で外し、namespace 本体（`napochaan-mcp-oauth-staging` / `napochaan-mcp-oauth-production`）も 2026-10-22 に削除した。

### 有効な間の password 書き込み拒否

`disableLocalStrategy: { enableFields: true }` で hash 列を残しているので、何もしないと Payload は REST / local API の create / update に含まれる `password` を hash して保存する。保存された password は Access の範囲では使われないが、切り戻して local strategy が戻った瞬間に生きた資格情報になる。そこで plugin は、有効な間だけ対象の auth collection に `beforeOperation` hook を先頭に足し、`operation` が `create` / `update`（ID 指定・一括とも）で `data` に `password` キーがあれば（値に関係なく）拒否する（`napolab/payload-plugins` の `packages/payload-cloudflare-access/src/password-guard/index.ts`）。field hook（`beforeChange`）で消すのでは遅い（Payload の `updateDocument` は field hook より前に `data.password` を取り出す）。`forgotPassword` / `resetPassword` は `disableLocalStrategy` の間 Payload 自身が Forbidden にする。

- 応答は 403、message は `Cloudflare Access 有効時はパスワードを設定できません`。
- `CLOUDFLARE_ENV` で Access 有効な env を向けた Payload CLI / seed にも効く。`pnpm --filter cms seed:import`（`dev@napochaan.com` を password 付きで作る）はその env では失敗する。content だけなら `seed:import:prod` を使う（users に触れない）。
- 確認（Access ログイン済みの JWT を使う。`<id>` は自分の user の id）:

  ```bash
  curl -i -X PATCH https://cms-stg.napochaan.com/api/users/<id> \
    -H 'Origin: https://cms-stg.napochaan.com' -H 'Content-Type: application/json' \
    --cookie 'CF_Authorization=<自分の JWT>' \
    -d '{"password":"x"}'
  ```

  期待値は 403 と上の message。`password` を含まない更新（`{"name":"x"}`）は通る。

### AUD の実測記録

cms はホスト全体のアプリ 1 つなので、admin / MCP の JWT の `aud` は常にその AUD のはず。設定した AUD と実際の `aud` が一致することを実測して表に残す（値は検証時に埋める）。`/api/media-upload`（Bypass）は JWT が付かない。

測り方は 2 つ。

- `wrangler tail --env <env>` で strategy の warn（`Cloudflare Access authentication rejected`）を見る。AUD が `CF_ACCESS_AUD` に無いと、検証失敗として warn が出る（`source` が `header` か `cookie` かも出る）。
- ブラウザの DevTools で JWT（`Cf-Access-Jwt-Assertion` header、または `CF_Authorization` cookie）をコピーして decode し、`aud` を読む。

| リクエスト                           | token の経路（header / cookie） | JWT の `aud`（どのアプリか） |
| ------------------------------------ | ------------------------------- | ---------------------------- |
| `/admin` の画面遷移                  |                                 |                              |
| admin の XHR（`/api/users/me` など） |                                 |                              |
| `/mcp`（Portal 経由）                |                                 |                              |

## 5. prod へ反映

stg の検証が済んだら、`cms.napochaan.com` のホスト全体アプリ（Managed OAuth ON）と `/api/media-upload` の Bypass アプリを作り、手順 3 を `apps/cms/wrangler.jsonc` の `env.production.vars` で行って `pnpm deploy:production`（cms → web）。**未着手**（`apps/cms/wrangler.jsonc` に TODO。AUD が入るまで prod の Access plugin は無効、`/mcp` は 500）。

旧構成（cms 分離前、`napochaan.com` 上のパス単位アプリ。cms 移行後は使われないので、prod の cms が動いたら削除する）:

| アプリ                 | id          | AUD（旧 `[env.production.vars]`）  |
| ---------------------- | ----------- | ---------------------------------- |
| `napochaan.com/admin*` | `a0d523ec…` | `73b87411…`（`CF_ACCESS_AUD`）     |
| `napochaan.com/mcp`    | `9baf3237…` | `5f5acc5a…`（`CF_ACCESS_MCP_AUD`） |

prod 後の確認:

- [ ] `https://cms.napochaan.com/admin` で Access のログイン → 自動で admin に入る（admin の XHR `/api/users/me` が 200、strategy `cloudflare-access`）
- [ ] `/mcp` は上の「MCP（`/mcp` アプリと MCP Portal）」のチェックリストで確かめる
- [ ] 公開ページ（`https://napochaan.com/`）と `/api/media/file/*` が Access なしで見える（web prod に Access は無い）
- [ ] 手順 4 の項目 8b（`/api/media-upload` の Bypass）が prod でも通る

## 切り戻し

1. `apps/cms/wrangler.jsonc` の `env.<env>.vars` から `CF_ACCESS_AUD` を**消して** deploy する（`CF_ACCESS_TEAM_DOMAIN` は `/mcp` も使うので、MCP を生かすなら残す。plugin は `CF_ACCESS_AUD` が空なら無効になる）。

- plugin が無効に戻り、strategy が外れて `disableLocalStrategy` も外れる。email + password ログインが復活する。
- **migration は不要。** `disableLocalStrategy: { enableFields: true }` なので email / hash 列は schema に残ったまま（schema は dev と一致している）。
- 自動作成した user は password を持たないので、そのままでは入れない。手順 1 で本人の user に password を設定しておくこと。
- 設定ミスで admin に誰も入れなくなったときも、これで戻る。
- Access 有効な間は password の書き込みが拒否されるので、有効な間に新しく password を持った user は居ない（手順 1 で事前に設定した本人の user と、有効化より前から居た user だけ）。
- **注意（CLI 経由で作った user）**: `CF_ACCESS_*` を wrangler の env に入れた後は、その env を向けた Payload CLI（`CLOUDFLARE_ENV=staging|production pnpm --filter cms payload …`、seed スクリプトなど）も plugin を有効の状態で読み込み、local strategy が無効になる。この経路で作った user も password を持たない（`password` を渡すと 403 で拒否される）。通常の運用では問題にならず、切り戻しのときだけ効く（手順 1 の password 事前設定は、Access 有効化前に済ませる）。

**MCP の切り戻し**: `CF_ACCESS_*` を消しても MCP は元に戻らない（OAuthProvider はコードから消してある）。この PR のコードを revert し、KV namespace を作り直して（2026-10-22 に削除済み。旧 token / client 登録は失われているので、利用者は接続し直す）`wrangler` 設定の `OAUTH_KV` binding（各 env）に新しい id を入れて deploy する。旧経路に戻すなら `/mcp` の Access アプリも外す（残すと Access が先に認証を要求する）。この切り戻しは**未検証**。

## 注意

- **cms のホスト全体アプリは `/api/*` も覆う。** `/api/media-upload` だけを Bypass にする（認可は route の HMAC 署名のみ。`worker-app` は触らず Next の mount に落とす）。公開画像（`/api/media/file/*`）は web Worker が配信し、cms へは `env.CMS`（Service Binding）で取りに行くので Access を通らない。`/api/mcp` は外部から `mcp-guard` が 404 にし、MCP は `/mcp` から cms worker が forward する。admin の XHR は Access の header（`Cf-Access-Jwt-Assertion`）で認証する。
- **Worker 単位の Access（`ctx.access`）を使わない。** `[assets]` 付き Worker（OpenNext）には `ctx.access` が渡らない。また Worker 単位の Access は WebSocket upgrade を 403 にするので、`CURSOR_ROOM` が動かなくなる（[Workers: Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)）。self-hosted アプリ + アプリ内の JWT 検証にしている。
- **admin に入れない場合は、まず `wrangler tail --env <env>` で strategy の warn を見る**（`Cloudflare Access authentication rejected`: token / CSRF / 検証の失敗、`Cloudflare Access user resolution failed`: users の検索・作成の失敗）。
- **Access の env が設定されているのに対象の auth collection が無いと、config の build 時に `AccessTargetCollectionNotFound` で落ちる。** 黙って無効にすると password ログインが残る（fail-open）ので、これは意図した fail-loud。対象は `collection` option → `admin.user` → 最初の auth collection の順で決まる。
- **ログアウトは `POST /api/<slug>/access-logout`（plugin が対象 collection に足す endpoint）を経て `/cdn-cgi/access/logout` へ。** `/cdn-cgi/access/logout` は Access のセッション cookie しか消さない。そのままだと次の 2 つがブラウザに残るので、endpoint が先に消してから `303` で Access のログアウトへ送る（`Cache-Control: no-store`）。
  - `payload-token`（名前は `<cookiePrefix>-token`）: Access の user にも `/api/users/refresh-token` が発行する。`local-jwt` が登録されないので今は読まれないが、Access を外して切り戻した瞬間に生きる。Domain / SameSite / Secure は collection の `auth.cookies` に合わせる（Payload の `generateExpiredPayloadCookie`）。
  - `__prerender_bypass`（Next の draft mode）: 残すと、ログアウト後もそのブラウザで preview ページが下書きを表示し続ける。Next が付けるのと同じ `Path=/; HttpOnly; Secure; SameSite=None` で消す。
  - 別サイトの form POST で本人をログアウトさせないよう、cookie 経路と同じ CSRF 検査（`Origin` が `payload.config.csrf` に無い・`Sec-Fetch-Site: cross-site` なら拒否）を通らなければ 403 を返し、cookie には触れない。
  - Access のログアウトは全 Access アプリのセッションを失効させる（アプリ単位のログアウトは不可）。IdP のセッションは残るので、次に `/admin` へ来たとき IdP がそのまま通して、ログイン画面を経ずに再ログインされることがある。
  - 対象 collection が `endpoints: false` だと、config の build 時に `AccessLogoutEndpointsDisabled` で落ちる（endpoint を足すと Payload が既定の REST まで戻してしまうため。`AccessTargetCollectionNotFound` と同じ fail-loud）。
- **クロスサイトのトップレベル GET は `/admin` にだけ通す。** Access ログイン後の着地（Origin 無しのクロスサイト top-level GET）を通すため、header 由来の strategy はこれを CSRF 検査で拒否しない。strategy は headers しか見られずパスを判定できないので、cms worker（`apps/cms/src/worker-app/admin-landing`、OpenNext の mount より前に登録）が、`GET` / `HEAD` で `Sec-Fetch-Site: cross-site` かつ `Sec-Fetch-Dest: document` の要求のうち `/admin/` 配下の深いパス（`/admin` と `/admin/` は除く。percent-encoding は decode しても判定）を `302 Location: /admin`（`Cache-Control: no-store`）で返す。別サイトのリンクから `/admin/collections/<autosave を持つ collection>/create` などを踏ませて、GET の描画で下書きや一覧の preference を書かせる経路を塞ぐため。代償として、Access のログイン前に開いていた深いパス（ブックマークなど）はログイン後に `/admin` へ着地する。開き直せばよい。順序は `worker-app.test.ts` が検出する。確認（Access ログイン済みの JWT を使う）: `curl -sI https://cms-stg.napochaan.com/admin/collections/blog -H 'Sec-Fetch-Site: cross-site' -H 'Sec-Fetch-Dest: document' --cookie 'CF_Authorization=<自分の JWT>' | grep -i -E '^(HTTP|location|cache-control)'` の期待値は `302` / `location: /admin` / `cache-control: no-store`（`Sec-Fetch-Site: same-origin` なら 200）。
  - 残りとして、fetch metadata を送らない古いブラウザ（Safari 16.4 未満など）は、クロスサイトの遷移や `<img>` などの GET を `Origin` も `Sec-Fetch-*` も無しで送るので、このリダイレクトにも CSRF 検査にもかからずに通る（判定上は curl と区別できない）。この場合は空の下書きが 1 件できうる。データの漏洩・改変は無いので許容している。見覚えの無い空の下書きがあれば消してよい。POST などは `Origin` が付くので拒否される。
- **`Cf-Access-Authenticated-User-Email` ヘッダーは信用しない。** 実装も読んでいない。Access を通らない経路では誰でも付けられる。JWT の署名・`iss`・`aud` を検証した email だけを使う。
- `workers_dev` / `preview_urls` は全 env で false。Access を迂回する入口は無い。将来有効にするとその hostname は Access アプリの外になる。
- セッションはリクエストごと。Payload の JWT cookie では認証しない（`local-jwt` が登録されないので、`/api/users/refresh-token` が発行する `payload-token` も読まれない）。admin の各リクエストで Access JWT の検証と users の検索が走る。Access の `exp` は admin に伝わらないので、期限切れ警告モーダルは出ない。
- MCP は admin の plugin を通らない。`/mcp` は（admin と同じホスト全体アプリ）、`route.ts` が自分で JWT を検証し、既存 user を find するだけ（auto-create しない）。user が居なければ 403。

## ローカル開発

`apps/cms/.dev.vars` の `CF_ACCESS_TEAM_DOMAIN=` / `CF_ACCESS_AUD=` / `CF_ACCESS_MCP_AUD=` は**空のまま**にする。plugin は無効で、従来どおり email + password ログイン（と `autoLogin.prefillOnly`）が使える。`pnpm seed:import` も password 付きの dev admin を作れる（plugin が有効だと password の書き込みが拒否されて失敗する）。`CF_ACCESS_MCP_AUD` が空だと `/api/mcp` は 500（fail closed）で、`next dev` は worker シェルを経由しないので、MCP の動作確認は stg で行う。web には Access も Payload も無い。

`.dev.vars` にキーを追加・変更したら型を再生成する:

```bash
pnpm --filter cms cf:types
```

直らないときは古い `tsconfig.tsbuildinfo` を消す。どちらも gitignore の生成物で、差分には出ない。

## 参考

- [Validate JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Application token](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/)
- [Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)
- [Session management / logout](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/)
- [Workers: Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
