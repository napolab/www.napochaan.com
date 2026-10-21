# Payload admin の Cloudflare Access 自動ログイン — 設計

- 日付: 2026-10-05
- 対象: サブプロジェクト ① admin ログイン(② MCP の Access 移行は別 spec)
- 調査: `reports/2026-10-05-payload-cloudflare-access-research.md` / `reports/2026-10-05-mcp-portal-access-research.md`

## 1. 目的と要件

Cloudflare Access を通過した人が、Access の発行した identity(email)でそのまま Payload admin にログインされた状態になる。

| #   | 要件                                                                                                                                                | 出典                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| R1  | Access JWT の email に対応する Payload user で自動ログインする                                                                                      | 本人                                       |
| R2  | 未登録 email は user を自動作成する                                                                                                                 | 本人                                       |
| R3  | stg/prod では email + password ログインを無効化する。local dev は従来どおり password                                                                | 本人                                       |
| R4  | users に role は持たせない。誰を入れるかは Access ポリシーが唯一の境界                                                                              | 本人                                       |
| R5  | plugin は pnpm workspace の別パッケージ `packages/payload-cloudflare-access`(`@napolab/payload-cloudflare-access`)。TS ソース直参照、ビルド工程なし | 本人                                       |
| R6  | ② MCP は `@hono/cloudflare-access` を worker の `/mcp` に置いて検証する(本パッケージの検証は使わない)。本パッケージは Payload 専用                  | 本人(2026-10-05 hono adapter 調査後に変更) |
| R7  | stg にも prod と同じパス単位 Access アプリを足し、cookie 経路を実環境で検証する                                                                     | 本人                                       |
| R8  | Access 有効な間は password の書き込みを拒否する(切り戻し後に生きた資格情報を残さない)                                                               | 本人(2026-10-06 PR #53 監査後)             |
| R9  | `/oauth/authorize` は Access 化しない(PR 前の password 同意に戻す)。`/mcp` は ② で Access + MCP Server Portal に移す                                | 本人(2026-10-06 PR #53 監査後)             |

### 非目標

- MCP の OAuthProvider / `OAUTH_KV` 撤去(② で staging 実測後に判断)
- role / 権限モデル
- `apps/` への移動などの monorepo 全面再編
- npm 公開(必要になったら tsdown を足す)

## 2. 前提(調査で確定済み)

- `@hono/cloudflare-access@0.4.0` は Hono middleware で、トークンが無いと 401 を返す(任意認証にできない)。Payload strategy(Hono Context の外)からは呼べず、`/api/*` の匿名リクエストも止めてしまうため ① には使わない。`type` / email の検査と cookie の CSRF 検査は持たない。② の `/mcp`(Access 必須)にはそのまま使える。

- Payload 3.84.1 の custom strategy: `authenticate({ headers, payload, canSetHeaders, isGraphQL, strategyName })` → `{ user: { collection, _strategy, ...doc } | null, responseHeaders? }`。docs にある `req` 引数は 3.84.1 に存在しない。
- custom strategy は組み込みより先に実行され、例外は `logError` で握りつぶされる。
- `disableLocalStrategy: { enableFields: true }` は email / hash 列を残すので schema が dev と一致する(migration 不要)。ログイン画面のフォームが消え、`payload.login` は Forbidden になる。
- local strategy が全 auth collection で無効だと Payload JWT(`local-jwt`)が登録されず、セッションは作られない。毎リクエストで Access JWT を検証する。
- Workers ネイティブの `ctx.access` は `[assets]` 付き Worker に渡らず、Worker 単位の Access は WebSocket(`CURSOR_ROOM`)を 403 にする。→ パス単位 Access アプリ + アプリ内 JWT 検証。
- `Cf-Access-Authenticated-User-Email` ヘッダーは信用しない。`workers_dev` / `preview_urls` は全 env で false(Access を迂回する入口はない)。

## 3. 全体構成

```
                       Cloudflare Access(パス単位アプリ: /admin*)
                                     │  JWT を Cf-Access-Jwt-Assertion header と
                                     │  CF_Authorization cookie で付与
browser ─▶ worker(Hono: path-policy = admin-landing / admin-frame) ─▶ Next ─▶ Payload ─▶ strategy "cloudflare-access"
                                                 │
                     packages/payload-cloudflare-access
                     各モジュールは src/<name>/index.ts、テストは src/<name>/<name>.test.ts
                     ├─ verify/          JWT → { email }        (Payload 非依存)
                     ├─ token/           取り出し元 plugin(header-source / cookie-source)+ runner
                     ├─ csrf/            header / cookie それぞれの Origin / Sec-Fetch-* 検査
                     ├─ resolve-user/    email → user(自動作成)
                     ├─ strategy/        上記を合成した AuthStrategy(ACCESS_STRATEGY_NAME もここ)
                     ├─ password-guard/  有効な間の password 書き込みを拒否する beforeOperation hook
                     ├─ team-domain/     CF_ACCESS_TEAM_DOMAIN の正規化と検証
                     ├─ logout-endpoint/ Payload / draft mode の cookie を消して Access のログアウトへ 303 する collection endpoint
                     ├─ plugin/          cloudflareAccessPlugin(options)(config) => config
                     ├─ errors/          エラー class
                     └─ client/logout-button/
```

- `/admin*` の配下で動く admin の XHR(`/api/users/me` など)は Access アプリの範囲外なので header が付かない。そのため cookie(`CF_Authorization`)でも検証する。
- `/api/*` は Access アプリに入れない(`/api/media` は公開画像配信)。

## 4. パッケージ

### 4.1 配置とモジュール解決

- `pnpm-workspace.yaml` に `packages: ['packages/*']`。アプリ本体はリポジトリルートのまま。
- `packages/payload-cloudflare-access/package.json`
  - `name: "@napolab/payload-cloudflare-access"`, `private: true`, `type: "module"`
  - `exports` は subpath でモジュールを直接公開する(no-barrel: `index.ts` の re-export は作らない)
    - `"./plugin"` → `./src/plugin/index.ts`(アプリが使う)
    - `"./client/logout-button"` → `./src/client/logout-button/index.tsx`(importMap が参照する)
  - `dependencies`: `jose`。`peerDependencies`: `payload`, `react`, `@payloadcms/ui`
- アプリ側: `pnpm add @napolab/payload-cloudflare-access@workspace:*`、`next.config.ts` の `transpilePackages` に追加。
- パッケージ内では `@opennextjs/cloudflare` を import しない。team domain / AUD は呼び出し側が渡す。

### 4.2 `verify/index.ts`

```ts
type AccessIdentity = { email: string };
type VerifyAccessJWTArgs = {
  token: string;
  teamDomain: string;          // "napolab" → iss = https://napolab.cloudflareaccess.com
  aud: readonly string[];      // CF_ACCESS_AUD をカンマ区切りで分割(stg はホスト全体 + パス単位の 2 つ)
  keys: JWTVerifyGetKey;        // 本番: createRemoteJWKSet(certsURL)、テスト: createLocalJWKSet
};
export const verifyAccessJWT = (args: VerifyAccessJWTArgs): ResultAsync<AccessIdentity, AccessJWTError>;
export const createAccessKeys = (teamDomain: string): JWTVerifyGetKey; // plugin のクロージャで 1 回だけ作る
export const extractAccessToken: (headers: Headers) => Result<AccessToken, Headers>; // token/ の registry
```

- 検証: `algorithms: ['RS256']`、`issuer`、`audience`、`exp` / `nbf`(jose 標準、`clockTolerance: 30` 秒)、`type === 'app'`、`email` は空でない string。
- 時刻ずれの許容 30 秒、鍵ローテーション時の JWKS 再取得(知らない kid)、`crit` 拒否、aud の配列一致は `@hono/cloudflare-access@0.4.0` と同じ挙動。後者 3 つは jose の `jwtVerify` / `createRemoteJWKSet` が標準で行う。
- service token の JWT(`email` なし / `common_name` のみ)は `MissingAccessEmail` で拒否する。
- `extractAccessToken`(`src/token/`): トークンの取り出し元を prefix-match-processor の形の plugin にする。`headerTokenSource`(`Cf-Access-Jwt-Assertion`)と `cookieTokenSource`(`CF_Authorization`)をそれぞれ 1 ディレクトリに置き、`run(headers): Result<AccessToken, Headers>` で扱わないときは `err(headers)`。registry `[header, cookie]` を runner が先頭から試し、最初の `ok` を採用する。registry はパッケージ内部だけで持ち、plugin の options には出さない(必要になったら `tokenSources` を足す)。CSRF 検査は cookie source に同居させず strategy 側で掛ける(拒否を warn ログに残すため)。
- エラーは class で表現する(`src/errors/`。`AccessJWTError` 系: `InvalidAccessToken`(jose の失敗を `cause` に保持)/ `WrongAccessTokenType` / `MissingAccessEmail`。ほかに `ResolveUserError` / `CrossSiteAccessRequest`(header 由来・cookie 由来の CSRF 拒否を共通で表す)/ `AccessTargetCollectionNotFound` / `InvalidAccessTeamDomain` / `AccessLogoutEndpointsDisabled`)。

### 4.3 `csrf/index.ts`

header 由来・cookie 由来の**両方**を検査する(method は問わない)。`Cf-Access-Jwt-Assertion` header は Access がエッジで付けるが、その元はブラウザが自動で送る `CF_Authorization` cookie なので、クロスサイトの要求にも header が乗ってくる(stg のホスト全体アプリなら `/api/*` へのクロスサイト multipart POST、prod なら `/admin*` のサブリソース読み込み)。経路ごとに正規の要求の形が違うので、判定は 2 つに分ける。許可リストはどちらも `payload.config.csrf`(sanitize 済みで `serverURL` を含む)を使う。plugin に serverURL を渡す必要はない。

`isAllowedCookieRequest(headers, csrf)`: Payload 組み込みの cookie 抽出(`node_modules/payload/dist/auth/extractJWT.js` の `cookie`)は method を見ず、cookie 由来なら常に次の判定をする。custom strategy にはこの検査が無いため、**同じ判定をそのまま再現する**(plan 作成時に 3.84.1 の dist で確認済み)。

- `Origin` がある → `payload.config.csrf` が空、または `csrf` に含まれていれば許可
- `Origin` が無い → `csrf` が空、または `Sec-Fetch-Site` が `same-origin` / `same-site` / `none` なら許可
- それ以外(cross-site・ヘッダー欠落の非ブラウザ)は拒否

`isAllowedHeaderRequest(headers, csrf)`: cookie の表をそのまま使うと正規の経路が落ちる。Access のログイン後の `/admin` への着地は、IdP 経由のリダイレクトの末尾なので **Origin の無いクロスサイトのトップレベル GET** だから。クロスサイトの document を許可する分岐はこの着地のためだけにある。strategy は headers しか受け取らずパスを見られないので、`/admin` より深いパスへのクロスサイト遷移は worker が `/admin` へリダイレクトする(§5.2)。

- `Origin` がある(`"null"` も含む) → `csrf` が空、または `csrf` に含まれていれば許可
- `Origin` が無く、`Sec-Fetch-Site: cross-site` かつ `Sec-Fetch-Dest` が `document` 以外(img / iframe / script / fetch などのサブリソース) → 拒否
- それ以外 → 許可(トップレベル遷移、Origin を付けない同一 origin の GET、fetch metadata を送らない非ブラウザ)

| 正規 / 攻撃の経路                                    | 要求の形                                         | 判定 |
| ---------------------------------------------------- | ------------------------------------------------ | ---- |
| Access ログイン後の `/admin` への着地                | GET, cross-site, Dest `document`, Origin なし    | 許可 |
| admin の同一 origin XHR(GET)                         | same-origin, Origin なし                         | 許可 |
| admin の同一 origin XHR(POST / PATCH)、Server Action | Origin = serverURL                               | 許可 |
| 有効な JWT を付けた curl                             | Origin も fetch metadata も無い                  | 許可 |
| クロスサイトの form / fetch POST                     | Origin = 攻撃者の origin                         | 拒否 |
| クロスサイトの `<img>` / `<iframe>`                  | cross-site, Dest `image` / `iframe`, Origin なし | 拒否 |

- 多層防御として Access アプリの cookie の SameSite を Lax にする(runbook)。Lax でもトップレベル GET には cookie が付くので、Access の redirect は動く。strategy の判定はこの設定に依存しない。
- クロスサイトのトップレベル GET で `/admin/collections/<autosave を持つ collection>/create` を踏ませて空の下書きを作らせる(Payload の Document view は GET で下書きを作る)経路は、worker の `/admin` へのリダイレクト(§5.2)で塞ぐ。
- **残るリスク(対処しない)**: fetch metadata を送らないブラウザ(Safari 16.4 未満など)は、クロスサイトの遷移や `<img>` などの GET を `Origin` も `Sec-Fetch-*` も無しで送るので、worker のリダイレクトにも掛からず許可の分岐に入る(非ブラウザの curl と区別できない)。この場合は上の空の下書きが 1 件できうる。データの漏洩・改変は無い。POST などは `Origin` が付くので拒否される。

### 4.4 `resolve-user/index.ts`

```ts
// Payload の find/create の doc は実行時に collection を持たないので外す。collection と _strategy は strategy が付ける
export type AccessUser = Omit<TypedUser, 'collection'>;
export type UserStore = {
  findByEmail: (email: string) => Promise<AccessUser | undefined>;
  create: (email: string) => Promise<AccessUser>;
};
export const createPayloadUserStore = (payload: Pick<Payload, 'find' | 'create'>, collection: CollectionSlug): UserStore;
export const resolveAccessUser = (store: UserStore, identity: AccessIdentity): ResultAsync<AccessUser, ResolveUserError>;
```

1. email を小文字化して `store.findByEmail`(= `payload.find({ collection, where: { email: { equals } }, limit: 1, depth: 0, overrideAccess: true })`)
2. 見つからなければ `store.create`(= `payload.create({ collection, data: { email }, overrideAccess: true })`。password なし。`enableFields` により email 列はある)
3. create が失敗したら(同時の初回アクセスで unique 制約に当たる)もう一度 find する。それでも無ければ create のエラーを `cause` にした `ResolveUserError`
4. local API の `overrideAccess: true` を使うため、`users.access.create`(最初の 1 人だけ許可)はここでは効かない。意図した挙動であることをコメントで明記する

### 4.5 `strategy/index.ts`

```
authenticate({ headers, payload })
  ├ extractAccessToken → err なら { user: null }(JWKS を取りに行かない: 匿名の /api/media 等)
  ├ csrf 検査 NG(header 由来 → isAllowedHeaderRequest / cookie 由来 → isAllowedCookieRequest)
  │   → { user: null } + 構造化 warn { err: CrossSiteAccessRequest, source }(JWKS は取りに行かない)
  ├ verifyAccessJWT NG → { user: null } + 構造化 warn { err, source }(throw しない: Payload が握りつぶすため。生の JWT はログに出さない)
  ├ resolveAccessUser NG → { user: null } + error log
  └ { user: { ...doc, collection, _strategy: 'cloudflare-access' } }
```

- `createAccessStrategy({ teamDomain, aud, collection, keys })` が `AuthStrategy` を返し、中身は `authenticateAccess(options, { headers, payload })`。`{ user: null }` は毎回新しく作る(module スコープに共有オブジェクトを置かない)。

### 4.6 `plugin/index.ts`

```ts
type CloudflareAccessPluginOptions = {
  teamDomain: string | undefined; // normalizeTeamDomain で team 名に正規化する(下記)
  aud: string | undefined;        // カンマ区切り。parseAudiences で trim・空要素除去
  collection?: string;            // 省略時: config.admin.user → 先頭の auth collection
};
export const parseAudiences = (raw: string | undefined): readonly string[];
export const cloudflareAccessPlugin = (options: CloudflareAccessPluginOptions): Plugin;
```

| 設定                             | env 未設定(local / build / CLI) | env 設定済み(stg / prod)                      |
| -------------------------------- | ------------------------------- | --------------------------------------------- |
| `admin.components.logout.Button` | **常に登録**                    | 常に登録                                      |
| `auth.strategies` に追加         | しない                          | する                                          |
| `auth.disableLocalStrategy`      | 変更しない                      | `{ enableFields: true }`                      |
| `hooks.beforeOperation`          | 変更しない                      | 先頭に `rejectPasswordWrites`                 |
| 対象 collection の `endpoints`   | 変更しない                      | 末尾に `POST /access-logout`                  |
| ログアウトボタン                 | Payload 既定の logout           | `/api/<slug>/access-logout` へ POST する form |

- **importMap に載るものは env で分岐させない。** `payload generate:importmap` と `next build` は `CF_ACCESS_*` が無い状態で config を評価する。env で登録を切り替えると、本番で importMap に無い component を参照して admin が壊れる。
- ログアウトボタンの送信先は `clientProps`(`{ accessLogoutAction: string | null }`)で渡す。enabled なら `` `${config.routes?.api ?? '/api'}/${target}${ACCESS_LOGOUT_ENDPOINT_PATH}` ``、無効なら `null`。clientProps は importMap に影響しない。
- enabled のとき、対象 collection の `endpoints` の末尾に `createAccessLogoutEndpoint(target)`(§4.7)を足す。既存の endpoint は前に残す。`endpoints: false` なら config build 時に `AccessLogoutEndpointsDisabled` を throw する。足すと Payload の sanitize が `endpoints !== false` を見て既定の REST まで戻してしまう(`collections/config/sanitize.js`)ので、黙って足さない。
- users collection は配列の位置を保ったまま map で差し替える(payload-oauth2 のように末尾へ移動しない)。
- `enabled` は正規化した `teamDomain` が空でなく、かつ `parseAudiences(aud)` が 1 件以上のとき。`NODE_ENV` では判定しない。片方だけ・空白だけの設定は黙って無効(password ログインのまま)。
- `teamDomain` の正規化(`src/team-domain/`): trim → 小文字化 → 先頭の `https://` / `http://` を除く → 末尾の `/` を除く → 末尾の `.cloudflareaccess.com` を除く → `^[a-z0-9-]+$` に一致しなければ config build 時に `InvalidAccessTeamDomain`(元の値と期待する形「`napolab` のような team 名だけ」をメッセージに出す)を throw する。`napolab` / `https://napolab.cloudflareaccess.com/` などはすべて `napolab` になる。誤った team で有効化すると issuer / JWKS URL が食い違い、password ログインも無効なので誰も admin に入れない(不正な文字は `new URL` が config 評価中に throw する)。検証するのは有効化するとき(trim 後の `teamDomain` が空でなく、かつ `parseAudiences(aud)` が 1 件以上)だけ。どちらかが空なら、`teamDomain` が不正でも throw せず無効にする。team 名は Access アプリを作って AUD が出る前に設定するのが普通で、無効な間の typo で config 評価(Payload を使う全ページと deploy の Payload CLI)を落とさないため。
- enabled のとき、対象 collection を `options.collection` → `config.admin.user` → `config.collections` の先頭の auth collection の順に決める。見つからない・auth collection でない場合は config build 時に `AccessTargetCollectionNotFound` を throw する(env が揃っているのに黙って password ログインを残す fail-open を防ぐ)。env 未設定の build / CLI / importmap はこの判定に到達しない。
- JWKS の key resolver(`createAccessKeys(teamDomain)`)は enabled のとき plugin のクロージャで 1 回だけ作り、strategy に渡す。
- 対象 collection の既存 `auth` オプション(`cookies` など)と既存 `strategies` は保持し、strategy は末尾に追加する。`auth: true` は object に正規化する。
- enabled のとき、対象 collection の `hooks.beforeOperation` の**先頭**に `rejectPasswordWrites`(`src/password-guard/`)を足す。既存の hook と他の種類の hook はそのまま残す。`operation` が `create` / `update`(Payload 3.84.1 は updateByID も一括 update も `'update'` で渡す)で、`args.data` が `password` を own property として持てば(値は問わない)`PasswordWriteForbidden`(Payload の `APIError`、403、message「Cloudflare Access 有効時はパスワードを設定できません」)を throw する。
  - 理由: `enableFields` で hash 列を残しているので、Payload は create / update の `data.password` を hash して保存する。その資格情報は切り戻して local strategy が戻った瞬間に生きる。
  - `beforeChange` で消すのでは遅い: `updateDocument`(`collections/operations/utilities/update.js`)は field hook より前に `data.password` を取り出す。`beforeOperation` はその前に走る唯一の hook。
  - `forgotPassword` / `resetPassword` は `disableLocalStrategy` の間 Payload 自身が Forbidden にするので対象外。
  - `PasswordWriteForbidden` は Payload の runtime に依存するので `errors/` ではなく `password-guard/` に置く(`errors/` は import を持たない module のまま。`verify` を workerd で読む `worker/access-verify-runtime.test.ts` が壊れないように)。
  - 副作用: Access 有効な env を向けた `pnpm seed:import`(password 付きの dev admin を作る)は失敗する。content だけなら `seed:import:prod`。

### 4.7 `logout-endpoint/index.ts`

`/cdn-cgi/access/logout` は Access のセッション cookie しか消さない。次の 2 つがブラウザに残るので、同一 origin の endpoint で消してから Access のログアウトへ送る。

- `<cookiePrefix>-token`(`payload-token`): Access の user にも `/api/<slug>/refresh-token` が発行する(Payload 3.84.1 `auth/operations/refresh.js` は `disableLocalStrategy` のとき session を見ずに署名して `setCookie: true` を返す)。`local-jwt` が登録されないので今は読まれないが、切り戻して local strategy が戻った瞬間に生きる。
- `__prerender_bypass`(Next の draft mode): 残すと、ログアウト後もそのブラウザで preview ページが下書きを表示し続ける。

```ts
export const ACCESS_LOGOUT_ENDPOINT_PATH = '/access-logout';
export const ACCESS_LOGOUT_PATH = '/cdn-cgi/access/logout';
export const PRERENDER_BYPASS_COOKIE_NAME = '__prerender_bypass';
export const createAccessLogoutEndpoint = (slug: TypedUser['collection']): Endpoint; // { path, method: 'post', handler }
```

- handler は小さい関数の合成: `toAccessLogoutContext(req, slug)`(headers / `payload.config.csrf` / `payload.config.cookiePrefix` / sanitize 済みの `payload.collections[slug].config.auth`)→ `respondToAccessLogout`。
  - `isSameSiteLogout`: `isAllowedCookieRequest(headers, csrf)`(§4.3 の cookie の表)。通らなければ `403`(`Cache-Control: no-store`、`Set-Cookie` なし)。別サイトの form POST で本人をログアウトさせない。
  - `expiredPayloadTokenCookie`: Payload の `generateExpiredPayloadCookie`(`payload/shared`)。名前は `cookiePrefix` から、Domain / SameSite / Secure は collection の `auth.cookies` から作る(発行時と違うと別の cookie として残る)。
  - `expiredDraftModeCookie`: `__prerender_bypass=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; Secure; SameSite=None`。名前は `next/dist/server/api-utils/index.js` の `COOKIE_NAME_PRERENDER_BYPASS`、属性は `next/dist/server/async-storage/draft-mode-provider.js` が本番で付けるものに合わせる。
  - 成功時は `303 Location: /cdn-cgi/access/logout`、`Set-Cookie` を 2 本(`Headers.append`)、`Cache-Control: no-store`。
- user が解決できたかは見ない(cookie を消すだけなので未ログインでも同じ応答でよい)。
- path の一致: Payload 3.84.1 は collection の endpoints を利用者の分 → auth / upload / 既定(`/:id` など)の順に並べ(`collections/config/sanitize.js`)、`handleEndpoints` は先頭から method と path で `find` するので、`POST /access-logout` は既定の route より先に一致する。`handleEndpoints` は応答 headers を `new Headers(...)` で作り直すが、`Set-Cookie` は 2 本のまま残る(テストで固定)。

### 4.8 `client/logout-button/index.tsx`

- `'use client'`。props は `{ accessLogoutAction: string | null }`。`null` なら Payload の既定 `Logout`(`@payloadcms/ui`)をそのまま描画する。
- それ以外は HTML だけで作る: `<form method="post" action={accessLogoutAction}>` の中に `<button type="submit" className="nav__log-out" aria-label={t('authentication:logOut')} title={t('authentication:logOut')}><LogOutIcon /></button>`(`t` は `@payloadcms/ui` の `useTranslation`。Payload の `Logout` と同じ label / icon / class)。
- Payload の admin CSS は button を class ごとにしか reset しないので、素の `<button>` に残る UA の枠と背景を `styles.module.css` で消し、`.nav__controls a:focus-visible` と同じ focus ring を付ける。form は既定の block のままにして `.nav__controls` の flex item(`gap` と `> :first-child` の margin を受ける)にする。

## 5. アプリ側の変更

### 5.1 `payload.config.ts`

```ts
plugins: [
  cloudflareAccessPlugin({
    teamDomain: cfEnv.CF_ACCESS_TEAM_DOMAIN,
    aud: cfEnv.CF_ACCESS_AUD,
  }),
  ...
]
```

### 5.2 worker の middleware(`worker/middleware/`)

worker の Hono 合成(`worker/app.ts`)に `pathPolicy()`(`worker/middleware/path-policy/`)を 1 つ足す。OpenNext の mount より前、`weakenETag` → `cacheControlHeaders` → `pathPolicy` の順。パスは middleware が 1 度だけパーセントデコードし(`safe-decode-pathname/`。不正な %-列は生のまま判定)、plugin の配列を先頭から照合して最初に match した action(redirect / frame)を採る(first match wins、`worker/lib/first-match-runner`)。具体的な plugin を先に置く(`admin-landing` → `admin-frame`)。redirect の 302 には frame ヘッダーを付けない(body が無いため)。

- `plugins/admin-frame`(clickjacking): `/admin`(完全一致か `/admin/` 始まり。`/administrator` は対象外)に `Content-Security-Policy: frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN`。上流の CSP に `frame-ancestors` が無いときだけ末尾に足す。Access が有効だと admin はクロスサイトの iframe の中でも認証済みで描画されるため。Live Preview が iframe に入れるのは `/next/preview` → サイト側の preview ページで、admin 自身を埋め込む画面は無い。
- `plugins/admin-landing`(クロスサイト遷移の着地制限): `GET` / `HEAD` で `Sec-Fetch-Site: cross-site` かつ `Sec-Fetch-Dest: document`、かつパスが `/admin/` で始まり `/admin/` そのものではない要求に `302 Location: /admin` + `Cache-Control: no-store` を返す(mount した handler は呼ばない)。`/admin` と `/admin/` は通す(Access ログイン後の着地先)。same-origin / same-site / `none` / fetch metadata 無し、`GET` / `HEAD` 以外は触らない。
  - 理由: strategy は Access ログイン後の着地のためにクロスサイトの document を認証する(§4.3)が、headers しか受け取らずパスを見られない。着地先の制限は worker で掛ける。
  - 302 は fetch metadata 次第で変わるので保存させない。`cacheControlHeaders` は status 200 にしか public を付けないので `no-store` のまま返る(Workers Cache にも入らない)。
  - 代償: Access ログイン前に開いた深いパス(ブックマーク)は、ログイン後 `/admin` に着地する。

### 5.3 `/oauth/authorize`(MCP OAuth 認可ページ)

Access 化しない。PR #53 より前と同じ email + password の同意画面(`payload.login`)のまま。password ログインを無効化すると `payload.login` が Forbidden になるので、**Access を有効にした環境では MCP の同意ができない**。② で `/mcp` を Access + MCP Server Portal に移すまでの制約として受け入れる(本人判断、2026-10-06)。

- 当初は Access user 向けに「{email} として許可する」ボタンだけの同意画面を足していたが、撤去した。同意画面のフレーム禁止(`frame-ancestors 'none'`)も一緒に外した。
- Access のパス単位アプリに `/oauth/authorize*` は含めない。

### 5.4 wrangler / env

- `[env.staging.vars]` と `[env.production.vars]` に `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD`(秘密情報ではないので vars)。stg と prod の AUD は別の値になる。
- top-level `[vars]`(local)には置かない → local では plugin が無効。
- `.dev.vars.example` に空値で追記する(`CF_ACCESS_TEAM_DOMAIN=` / `CF_ACCESS_AUD=`)。`cf:types` が型を生成するための入力であり、空値なので plugin は無効のまま。
- `pnpm cf:types` で `cloudflare-env.d.ts` を再生成する。

### 5.5 runbook `docs/cloudflare-access.md`

- Zero Trust でのアプリ作成手順(stg / prod とも self-hosted、パス `/admin*`)、ポリシー(本人の email のみ)、IdP
- AUD の取得場所と wrangler vars への反映、`pnpm cf:types`
- stg はホスト全体のアプリとパス単位アプリが共存する。どちらの AUD が JWT に入るかを実測し、runbook に記録する
- 切り戻し: stg に `/api*` の Bypass アプリを足していたら先に消す。その後 wrangler vars から `CF_ACCESS_*` を消して deploy すると password ログインに戻る(schema は変わらないので migration 不要)。ただし自動作成した user は password を持たず、有効な間は password を設定できない(R8)ので、有効化する前に本人の user に password を設定しておく
- MCP の同意は Access 有効な環境ではできない(§5.3)

## 6. テスト(vitest, TDD)

テストは `packages/payload-cloudflare-access` 内で、モジュールのディレクトリに `<name>.test.ts(x)` として置く(例: `src/verify/index.ts` と `src/verify/verify.test.ts`)。鍵はテスト内で生成した RS256 鍵ペア + `createLocalJWKSet` を使い、ネットワークに出ない。

| 対象                 | ケース                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extractAccessToken` | header のみ / cookie のみ / 両方(header を優先) / どちらも無い / 他の cookie と混在                                                                                                                                                                                                                                                                                                                      |
| `verifyAccessJWT`    | 正常 / 期限切れ / aud 不一致 / iss 不一致 / 署名改ざん / alg 違い / `type` が app 以外 / email なし(service token)                                                                                                                                                                                                                                                                                       |
| `csrf`               | cookie: Origin 一致・不一致 / Origin 無し + Sec-Fetch-Site(same-origin・same-site・none・cross-site・欠落) / csrf 空なら常に許可。header: §4.3 の表の各経路 / Origin `null` / csrf 空                                                                                                                                                                                                                    |
| `resolveAccessUser`  | 既存 user / 新規作成 / 大文字小文字の正規化 / create 衝突 → 再 find                                                                                                                                                                                                                                                                                                                                      |
| `strategy`           | トークン無しで JWKS を呼ばない / 各失敗で `{ user: null }` かつ throw しない / header・cookie とも cross-site は JWKS を呼ばずに拒否 / 成功時の `collection` と `_strategy`                                                                                                                                                                                                                              |
| `team-domain`        | 一般的な書き方を team 名に正規化 / 不正な値は `InvalidAccessTeamDomain` / 空は無効                                                                                                                                                                                                                                                                                                                       |
| `plugin`             | env 無し: strategies・disableLocalStrategy・hooks・endpoints が変わらず、logout component は `accessLogoutAction: null` で登録される / env あり: 両方が設定され、`beforeOperation` の先頭に password guard(既存 hook は保持)、logout endpoint を末尾に追加(既存 endpoint は保持・`endpoints: false` は throw)、`accessLogoutAction` は `routes.api` と対象 slug から / collection の配列位置が変わらない |
| `password-guard`     | create / update で `password` を持てば 403 の `PasswordWriteForbidden`(値は問わない・own property のみ) / `password` 無し・他の operation・data 無しは通す                                                                                                                                                                                                                                               |
| `worker/middleware`  | admin-landing: cross-site document の GET / HEAD で深い admin パス → 302 `/admin` + no-store、`/admin` `/admin/` と他の fetch metadata・method は通す、percent-encoding / admin-frame / path-policy の優先順 / `worker/app.test.ts` で合成順                                                                                                                                                             |
| `logout-endpoint`    | 303 + `Location` + 2 本の期限切れ cookie + no-store / cookie 名は `cookiePrefix`・Domain は `auth.cookies` から / `Headers` を作り直しても `Set-Cookie` が 2 本 / cross-site・別 Origin・`Origin: null` は 403 で `Set-Cookie` なし                                                                                                                                                                      |
| `logout-button`      | action があれば POST form(method / action / button の accessible name / UA の枠が消える)、`null` なら Payload の `Logout`(browser mode, `.test.tsx`)                                                                                                                                                                                                                                                     |

## 7. 実装の最初のタスク(土台の検証)

認証のコードを書く前に、空のパッケージで以下がすべて通ることを確かめる。どれかが通らなければ「TS ソース直参照」をやめて tsdown でビルドする方式に変え、spec を更新する。

1. `pnpm-workspace.yaml` と空パッケージを作り、`payload.config.ts` から 1 シンボル import する
2. `pnpm payload migrate:status`(Payload CLI がワークスペースの `.ts` を読めるか)
3. `pnpm payload generate:importmap`(`@napolab/payload-cloudflare-access/client/logout-button#LogoutButton` が解決されるか)
4. `pnpm typecheck`(tsgo が `exports` → `.ts` を解決するか。`tsconfig.paths` は変更しない)
5. vitest の node / browser 両方(CI の clean env で `optimizeDeps` 問題が出ないか)
6. `pnpm build`(Next + OpenNext)
7. CI(`.github` の setup composite)の `pnpm install` がワークスペースを含めて通るか

## 8. 検証(stg)

1. stg にパス単位アプリ(`/admin*`)を作り、AUD を `[env.staging.vars]` に設定して deploy
2. `/admin` に入ると自動ログインされ、ログインフォームが出ないこと
3. admin 内の操作(一覧・保存・画像アップロード)が cookie 経路で通ること
4. 未登録 email で入ると user が作成されること
5. ログアウトで `POST /api/users/access-logout` が `payload-token` と `__prerender_bypass` を消して Access のログアウト画面に 303 で遷移し、再度 `/admin` に行くと Access のログインを求められること(IdP のセッションが残っていると、ログイン画面を経ずに再ログインされることがある)。別 origin からの POST は 403 で cookie が変わらないこと
6. 別 origin からの要求(`curl -H 'Origin: https://evil.example' --cookie CF_Authorization=...`)で user が解決されないこと(header 由来・cookie 由来とも)
7. JWT なしの `/api/users/me` が未認証になること
8. `/oauth/authorize` が password の同意画面を出すこと(Access 有効な環境では承認できない。§5.3)
   - Access 有効な間、`password` を含む `PATCH /api/users/<id>` が 403 になること
   - 別サイトから `/admin` より深いパスへのトップレベル遷移が `/admin` へ 302 されること
9. どの AUD が JWT に入るかを記録する

## 9. リスク

| リスク                                                                                           | 対応                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access の設定ミスで admin に誰も入れない                                                         | env を消して deploy すれば password ログインに戻る。事前に本人の user に password を設定しておく                                                                                                                                                         |
| 4 種類のローダー(Next / Payload CLI / vitest / tsgo)のどれかがワークスペースの `.ts` を読めない  | 7 章で最初に検証。ダメなら tsdown                                                                                                                                                                                                                        |
| Payload の cookie CSRF 判定が将来のバージョンで変わる                                            | `csrf/index.ts` のテストに Payload 3.84.1 の判定表を固定し、upgrade 時に `extractJWT.js` と突き合わせる                                                                                                                                                  |
| Access JWT の `exp` が admin に伝わらず期限切れ警告が出ない                                      | 許容する(Access のセッション切れは Access 側でログインし直しになる)                                                                                                                                                                                      |
| JWKS の取得失敗(Cloudflare 側の障害)                                                             | `{ user: null }` + error log。admin に入れないが、データは壊れない                                                                                                                                                                                       |
| `CF_ACCESS_TEAM_DOMAIN` の書き間違い(issuer / JWKS URL が食い違って全員締め出し)                 | 一般的な書き方は正規化し、有効化するとき(aud もあるとき)に team 名にならない値は config 評価で `InvalidAccessTeamDomain` を投げる(aud が空の間は無効のまま throw しない)。deploy 前に気づけるとは限らないので、certs URL を curl で必ず確かめる(runbook) |
| クロスサイトのトップレベル GET で `/admin/collections/<autosave collection>/create` を踏まされる | worker が `/admin` より深いパスへのクロスサイト遷移を `/admin` へリダイレクトする(§5.2)                                                                                                                                                                  |
| fetch metadata を送らないブラウザ(Safari 16.4 未満など)のクロスサイト GET                        | `Origin` も `Sec-Fetch-*` も無いので worker のリダイレクトにも掛からず、header 由来の判定で許可される。空の下書きが 1 件できうるが、漏洩・改変は無いので許容する(§4.3)                                                                                   |
| Access 有効な間に REST / CLI で password を書かれ、切り戻し後にその資格情報が生きる              | 有効な間は `beforeOperation` で password の書き込みを 403 で拒否する(§4.6)                                                                                                                                                                               |
| Access 有効な環境で MCP の同意ができない                                                         | ② で `/mcp` を Access + MCP Server Portal に移すまで受け入れる。必要なら一時的に切り戻す(§5.3)                                                                                                                                                           |
