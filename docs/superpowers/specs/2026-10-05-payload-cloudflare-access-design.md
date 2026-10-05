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
                       Cloudflare Access(パス単位アプリ: /admin*, /oauth/authorize*)
                                     │  JWT を Cf-Access-Jwt-Assertion header と
                                     │  CF_Authorization cookie で付与
browser ─▶ worker(Hono) ─▶ Next ─▶ Payload ─▶ strategy "cloudflare-access"
                                                 │
                     packages/payload-cloudflare-access
                     各モジュールは src/<name>/index.ts、テストは src/<name>/<name>.test.ts
                     ├─ verify/          JWT → { email }        (Payload 非依存)
                     ├─ token/           取り出し元 plugin(header-source / cookie-source)+ runner
                     ├─ csrf/            cookie 由来の Origin / Sec-Fetch-Site 検査
                     ├─ resolve-user/    email → user(自動作成)
                     ├─ strategy/        上記を合成した AuthStrategy
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
- エラーは class で表現する(`src/errors/`。`AccessJWTError` 系: `InvalidAccessToken`(jose の失敗を `cause` に保持)/ `WrongAccessTokenType` / `MissingAccessEmail`。ほかに `ResolveUserError` / `CrossSiteCookieRequest` / `AccessTargetCollectionNotFound`)。

### 4.3 `csrf/index.ts`

Payload 組み込みの cookie 抽出(`node_modules/payload/dist/auth/extractJWT.js` の `cookie`)は method を見ず、cookie 由来なら常に次の判定をする。custom strategy にはこの検査が無いため、**同じ判定をそのまま再現する**(plan 作成時に 3.84.1 の dist で確認済み)。

- 条件: `source === 'cookie'`(method は問わない。header 由来は Access がエッジで付けたものなので検査しない)
- `Origin` がある → `payload.config.csrf` が空、または `csrf` に含まれていれば許可
- `Origin` が無い → `csrf` が空、または `Sec-Fetch-Site` が `same-origin` / `same-site` / `none` なら許可
- それ以外(cross-site・ヘッダー欠落の非ブラウザ)は拒否
- 許可リストは `payload.config.csrf`(sanitize 済みで `serverURL` を含む)を使う。plugin に serverURL を渡す必要はない
- cookie の SameSite 属性には依存しない

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
  ├ cookie 由来 → csrf 検査 NG なら { user: null } + warn(CrossSiteCookieRequest。JWKS は取りに行かない)
  ├ verifyAccessJWT NG → { user: null } + 構造化 warn { err, source }(throw しない: Payload が握りつぶすため。生の JWT はログに出さない)
  ├ resolveAccessUser NG → { user: null } + error log
  └ { user: { ...doc, collection, _strategy: 'cloudflare-access' } }
```

- `createAccessStrategy({ teamDomain, aud, collection, keys })` が `AuthStrategy` を返し、中身は `authenticateAccess(options, { headers, payload })`。`{ user: null }` は毎回新しく作る(module スコープに共有オブジェクトを置かない)。

### 4.6 `plugin/index.ts`

```ts
type CloudflareAccessPluginOptions = {
  teamDomain: string | undefined; // trim して扱う
  aud: string | undefined;        // カンマ区切り。parseAudiences で trim・空要素除去
  collection?: string;            // 省略時: config.admin.user → 先頭の auth collection
};
export const parseAudiences = (raw: string | undefined): readonly string[];
export const cloudflareAccessPlugin = (options: CloudflareAccessPluginOptions): Plugin;
```

| 設定                             | env 未設定(local / build / CLI) | env 設定済み(stg / prod) |
| -------------------------------- | ------------------------------- | ------------------------ |
| `admin.components.logout.Button` | **常に登録**                    | 常に登録                 |
| `auth.strategies` に追加         | しない                          | する                     |
| `auth.disableLocalStrategy`      | 変更しない                      | `{ enableFields: true }` |
| ログアウトボタンの遷移先         | Payload 既定の logout           | `/cdn-cgi/access/logout` |

- **importMap に載るものは env で分岐させない。** `payload generate:importmap` と `next build` は `CF_ACCESS_*` が無い状態で config を評価する。env で登録を切り替えると、本番で importMap に無い component を参照して admin が壊れる。
- ログアウトボタンの遷移先は `clientProps`(`{ accessLogout: boolean }`)で渡す。clientProps は importMap に影響しない。
- users collection は配列の位置を保ったまま map で差し替える(payload-oauth2 のように末尾へ移動しない)。
- `enabled` は trim した `teamDomain` が空でなく、かつ `parseAudiences(aud)` が 1 件以上のとき。`NODE_ENV` では判定しない。片方だけ・空白だけの設定は黙って無効(password ログインのまま)。
- enabled のとき、対象 collection を `options.collection` → `config.admin.user` → `config.collections` の先頭の auth collection の順に決める。見つからない・auth collection でない場合は config build 時に `AccessTargetCollectionNotFound` を throw する(env が揃っているのに黙って password ログインを残す fail-open を防ぐ)。env 未設定の build / CLI / importmap はこの判定に到達しない。
- JWKS の key resolver(`createAccessKeys(teamDomain)`)は enabled のとき plugin のクロージャで 1 回だけ作り、strategy に渡す。
- 対象 collection の既存 `auth` オプション(`cookies` など)と既存 `strategies` は保持し、strategy は末尾に追加する。`auth: true` は object に正規化する。

### 4.7 `client/logout-button/index.tsx`

- `'use client'`。`accessLogout` が true なら react-aria-components の `Link`(`href="/cdn-cgi/access/logout"`、`aria-label="ログアウト"`、Payload の nav と同じ `className="nav__log-out"`、中身は `LogOutIcon`)、false なら Payload の既定 `Logout`(`@payloadcms/ui`)をそのまま描画する。
- Access のログアウトは Access のセッション cookie を消す。Payload 側のセッションはそもそも無いので、これだけで完結する。

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

### 5.2 `/oauth/authorize`(MCP OAuth 認可ページ)

password ログインを無効化すると `payload.login` が Forbidden になり、MCP の認可が全滅する。② を実施するまでの間も動くように二経路にする。

- page(RSC)で `payload.auth({ headers })` を呼ぶ
  - user あり(Access 経由): 「{email} として許可する」ボタンだけの form(`AccessAuthorizeForm`)。action `authorizeWithAccess` は formData から `authRequestQuery` だけを読み、`payload.auth({ headers: await headers() })` で user を取り直して `completeAuthorization` する(form の値から user を受け取らない。node テストで固定)
  - user なし(local dev): 既存の email + password form のまま
  - `payload.auth` が throw したら(D1 障害など)page は password form に倒す。merge 時点では Access 未有効で、今動いている同意画面を 500 にしないため。Access 有効時はこの form ではログインできないので bypass にはならない
- 承認ボタンだけの同意画面は password という暗黙のガードを持たないので、次の 2 つで守る
  - cross-site POST: Next の Server Actions の Origin / Host 検査(`serverActions.allowedOrigins` を広げない)
  - clickjacking: worker の Hono middleware(`worker/middleware/frame-guard.ts`)で `/oauth/authorize`(パーセントデコード後のパスも)に `Content-Security-Policy: frame-ancestors 'none'` と `X-Frame-Options: DENY` を付ける
- prod / stg の Access パス単位アプリに `/oauth/authorize*` を含める

### 5.3 wrangler / env

- `[env.staging.vars]` と `[env.production.vars]` に `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD`(秘密情報ではないので vars)。stg と prod の AUD は別の値になる。
- top-level `[vars]`(local)には置かない → local では plugin が無効。
- `.dev.vars.example` に空値で追記する(`CF_ACCESS_TEAM_DOMAIN=` / `CF_ACCESS_AUD=`)。`cf:types` が型を生成するための入力であり、空値なので plugin は無効のまま。
- `pnpm cf:types` で `cloudflare-env.d.ts` を再生成する。

### 5.4 runbook `docs/cloudflare-access.md`

- Zero Trust でのアプリ作成手順(stg / prod とも self-hosted、パス `/admin*` と `/oauth/authorize*`)、ポリシー(本人の email のみ)、IdP
- AUD の取得場所と wrangler vars への反映、`pnpm cf:types`
- stg はホスト全体のアプリとパス単位アプリが共存する。どちらの AUD が JWT に入るかを実測し、runbook に記録する
- 切り戻し: wrangler vars から `CF_ACCESS_*` を消して deploy すると password ログインに戻る(schema は変わらないので migration 不要)。ただし自動作成した user は password を持たないので、事前に本人の user に password を設定しておく

## 6. テスト(vitest, TDD)

テストは `packages/payload-cloudflare-access` 内で、モジュールのディレクトリに `<name>.test.ts(x)` として置く(例: `src/verify/index.ts` と `src/verify/verify.test.ts`)。鍵はテスト内で生成した RS256 鍵ペア + `createLocalJWKSet` を使い、ネットワークに出ない。

| 対象                 | ケース                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extractAccessToken` | header のみ / cookie のみ / 両方(header を優先) / どちらも無い / 他の cookie と混在                                                                         |
| `verifyAccessJWT`    | 正常 / 期限切れ / aud 不一致 / iss 不一致 / 署名改ざん / alg 違い / `type` が app 以外 / email なし(service token)                                          |
| `csrf`               | header 由来は検査しない / cookie + Origin 一致・不一致 / Origin 無し + Sec-Fetch-Site(same-origin・same-site・none・cross-site・欠落) / csrf 空なら常に許可 |
| `resolveAccessUser`  | 既存 user / 新規作成 / 大文字小文字の正規化 / create 衝突 → 再 find                                                                                         |
| `strategy`           | トークン無しで JWKS を呼ばない / 各失敗で `{ user: null }` かつ throw しない / 成功時の `collection` と `_strategy`                                         |
| `plugin`             | env 無し: strategies・disableLocalStrategy が変わらず、logout component は登録される / env あり: 両方が設定される / collection の配列位置が変わらない       |
| `logout-button`      | `accessLogout` で描画が切り替わる(browser mode, `.test.tsx`)                                                                                                |
| `/oauth/authorize`   | Access user あり → 承認ボタン、無し → password form                                                                                                         |

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

1. stg にパス単位アプリ(`/admin*`, `/oauth/authorize*`)を作り、AUD を `[env.staging.vars]` に設定して deploy
2. `/admin` に入ると自動ログインされ、ログインフォームが出ないこと
3. admin 内の操作(一覧・保存・画像アップロード)が cookie 経路で通ること
4. 未登録 email で入ると user が作成されること
5. ログアウトで Access のログアウト画面に遷移し、再度 `/admin` に行くと Access のログインを求められること
6. 別 origin からの POST(`curl -H 'Origin: https://evil.example' --cookie CF_Authorization=...`)が 401/403 になること
7. JWT なしの `/api/users/me` が未認証になること
8. MCP の `/oauth/authorize` が Access user で承認でき、claude.ai / Claude Code から MCP が使えること
9. どの AUD が JWT に入るかを記録する

## 9. リスク

| リスク                                                                                          | 対応                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Access の設定ミスで admin に誰も入れない                                                        | env を消して deploy すれば password ログインに戻る。事前に本人の user に password を設定しておく        |
| 4 種類のローダー(Next / Payload CLI / vitest / tsgo)のどれかがワークスペースの `.ts` を読めない | 7 章で最初に検証。ダメなら tsdown                                                                       |
| Payload の cookie CSRF 判定が将来のバージョンで変わる                                           | `csrf/index.ts` のテストに Payload 3.84.1 の判定表を固定し、upgrade 時に `extractJWT.js` と突き合わせる |
| Access JWT の `exp` が admin に伝わらず期限切れ警告が出ない                                     | 許容する(Access のセッション切れは Access 側でログインし直しになる)                                     |
| JWKS の取得失敗(Cloudflare 側の障害)                                                            | `{ user: null }` + error log。admin に入れないが、データは壊れない                                      |
