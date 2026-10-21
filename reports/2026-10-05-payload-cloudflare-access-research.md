# Payload admin × Cloudflare Access 自動ログイン調査

調査日: 2026-10-05 / 対象: `payload@3.84.1`, `@payloadcms/next@3.84.1`, `@payloadcms/ui@3.84.1`, `jose@5.10.0`(transitive)

## 結論(3行)

1. Payload v3 向けの Cloudflare Access 連携は、メンテされた公式・準公式の plugin がない。見つかったのは 0★・1 commit の `@nivoventures/payload-cloudflare-jwt-auth@0.0.1`(2025-05)だけで、採用には値しない。`auth.strategies` に自前の strategy を差す実装が正攻法。
2. Workers ネイティブの `ctx.access`(2026-08 GA)は、この repo では使えない。`[assets]` 付き Worker は内部 router が `ctx.access` を user Worker に渡さないため。さらに Worker 単位の Access は WebSocket(`CURSOR_ROOM` DO)を 403 にする。したがって構成は **hostname/path 単位の Access app(例: `napochaan.com/admin*`)+ `jose` による JWT 検証**に決まる。
3. 実装は plugin `(config) => config` で users collection を in-place で map し、`strategies` を追加し、`disableLocalStrategy: { enableFields: true }` を **Access の env が揃った環境でだけ**有効化する。検証は header→`CF_Authorization` cookie の順。既存コードでは `/oauth/authorize`(MCP OAuth)が `payload.login` を使っていて本番で `Forbidden` になるため、同時に改修が必要。

---

## 既存統合の有無

| 名前                                                                                     | URL                                                                                              | Cloudflare Access 対応                                                        | メンテ状況 / 備考                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nivoventures/payload-cloudflare-jwt-auth`                                              | https://github.com/nivoventures/payload-cloudflare-jwt-auth                                      | あり。`cf-access-jwt-assertion` を jose で検証し、未登録 email を自動作成する | 0★、commit 1 回(2025-05-28)、npm `0.0.1` のみ(https://registry.npmjs.org/@nivoventures%2fpayload-cloudflare-jwt-auth)。repo に LICENSE ファイルがない(package.json 上は MIT)。user を `{email, collection, id}` だけに切り詰めて返す。cookie fallback、`_strategy`、作成 race への対処がない。**採用非推奨**。設計の参考に留める |
| EmDash `packages/cloudflare/src/auth/cloudflare-access.ts`                               | https://github.com/emdash-cms/emdash/blob/main/packages/cloudflare/src/auth/cloudflare-access.ts | あり(Payload ではなく Astro 製 CMS)                                           | 13k★、活発(2026-10-05 push)。header→cookie fallback、`clockTolerance: 60`、JWKS の isolate キャッシュ、`get-identity` による groups 取得まであり、**参照実装として最良**                                                                                                                                                         |
| `@hono/cloudflare-access`                                                                | https://github.com/honojs/middleware/tree/main/packages/cloudflare-access                        | あり(Hono middleware)                                                         | `0.4.0`(https://registry.npmjs.org/@hono/cloudflare-access)。RS256 固定、iss/aud/exp/nbf を検証し、kid 不明時は JWKS を再取得する。token がないと 401 を返すので全ルートには掛けられない。`worker/app.ts` で `/admin*` に二重防御として掛ける用途なら使える                                                                      |
| jacobmiller22/chrishop (Story 5.6)                                                       | https://github.com/jacobmiller22/chrishop/issues/139                                             | Access を `/admin/*` の前段ゲートに使うだけ                                   | Payload への自動ログインはしない(Terraform と CLI の例)                                                                                                                                                                                                                                                                          |
| `payload-oauth2`                                                                         | https://github.com/WilsonLe/payload-oauth2                                                       | なし(OAuth2 / OIDC)                                                           | 198★、2026-05 更新。**既存 auth collection に strategy を後付けする plugin の実例**として参考になる                                                                                                                                                                                                                              |
| `payload-authjs`                                                                         | https://github.com/CrawlerCode/payload-authjs                                                    | なし(Auth.js)                                                                 | 207★、2026-05 更新。strategy に加え `hooks.me`(exp 供給)と `hooks.afterLogout`(外部 session 破棄)を後付けする実例                                                                                                                                                                                                                |
| payload.market の auth カテゴリ 20 件(Better Auth、Keycloak、OIDC、WorkOS、Zitadel など) | https://payload.market/plugins/category/auth                                                     | **どれも Access / trusted header には非対応**                                 | IdP の OAuth フローを自前で持つ設計で、Access の前段認証と二重になる                                                                                                                                                                                                                                                             |
| npm 検索("payload cloudflare access" / "payloadcms cf-access" / "payload zero trust")    | https://registry.npmjs.org/-/v1/search?text=payload%20cloudflare%20access                        | 該当なし                                                                      | 2026-10-05 時点                                                                                                                                                                                                                                                                                                                  |

GitHub のコード検索で `Cf-Access-Jwt-Assertion` を含む TS を見ると、Backstage(`auth-backend-module-cloudflare-access-provider`)、cloudflare/wildebeest、Sink などの非 Payload 実装は多数ある。Payload 向けは上の nivoventures だけだった。

---

## Payload custom strategy API(3.84.1 で確認)

### 型(`node_modules/payload/dist/auth/types.d.ts`)

```ts
export type AuthStrategyFunctionArgs = {
  canSetHeaders?: boolean;      // response header を設定できる文脈かどうか
  headers: Request['headers'];
  isGraphQL?: boolean;
  payload: Payload;
  strategyName?: string;        // AuthStrategy.name が注入される
};
export type AuthStrategyResult = {
  responseHeaders?: Headers;
  user: ({ _strategy?: string; collection?: string } & TypedUser) | null;
};
export type AuthStrategy = { authenticate: AuthStrategyFunction; name: string };

// IncomingAuthType 内
disableLocalStrategy?: { enableFields?: true; optionalPassword?: true } | true;
strategies?: AuthStrategy[];
```

- **docs との差分**: main の docs では引数に `req` がある(https://raw.githubusercontent.com/payloadcms/payload/main/docs/authentication/custom-strategies.mdx)。3.84.1 の型にはない。`headers` / `payload` / `strategyName` だけで書くこと。
- **`optionalPassword` は 3.84.1 では型だけに存在**し、dist の runtime 参照は 0 件だった(`grep -rn optionalPassword payload/dist` の結果は `.d.ts` 2 件だけ)。docs の例(https://payloadcms.com/docs/authentication/overview#disable-local-strategy)に倣って書いても無害だが、効果はない。
- 返す user には `collection` が必須(docs: 「Send the user with the collection slug back」)。`_strategy` は Payload 側が付けないので自分で入れる。組み込みの `jwt.js:39` は `user._strategy = strategyName` を自前で設定しており、`me` operation はそれを `user._strategy` にコピーする。

### 実行順と挙動(`payload/dist/index.js:415-440`、`auth/executeAuthStrategies.js`)

1. 各 auth collection の `auth.strategies` が先に並ぶ。次に `useAPIKey` の strategy、最後に `local-jwt` が並ぶ。
2. **すべての auth collection が `disableLocalStrategy` だと `local-jwt` は登録されない**。Payload 自身の `payload-token` cookie は読まれなくなる。
3. 先頭から順に実行し、最初に `user` を返した strategy で確定する。throw は `logError` されて次へ進む(握りつぶされる)。
4. 呼び出し元は REST/GraphQL の `createPayloadRequest`(`utilities/createPayloadRequest.js:79`)、admin RSC / server function の `initReq`(`@payloadcms/next/dist/utilities/initReq.js:42`)、Local API の `payload.auth({ headers })`(`auth/operations/auth.js:9`)。**`/api/*` へのすべてのリクエスト(公開画像の `/api/media/file/*` も含む)で毎回実行される**。

### `disableLocalStrategy` の影響(3.84.1 dist で確認)

| 箇所                                                   | 挙動                                                                                                                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth/getAuthFields.js:13`                             | `true` だと email / salt / hash / sessions などの auth field がスキーマから消える。`{ enableFields: true }` なら残る。**dev/prod でスキーマを揃えるには object 形式が必須**(migration 差分を出さない) |
| `auth/operations/login.js:31`                          | `loginOperation` が即座に `Forbidden` を投げる(`payload.login` も同じ)                                                                                                                                |
| `auth/operations/registerFirstUser.js:9`               | first-user 登録も `Forbidden` になる                                                                                                                                                                  |
| `collections/operations/create.js:180`                 | local strategy が無効だと password の hash 登録をスキップする。**password なしの `payload.create({ data: { email } })` が通る**                                                                       |
| `@payloadcms/next/dist/views/Login/index.js`           | `req.user` があれば `redirect`。無効時は `LoginForm` を描画せず、`beforeLogin` / `afterLogin` の custom component だけを描画する                                                                      |
| `@payloadcms/next/dist/views/Root/index.js:188-193`    | 無効時は `/admin/create-first-user` を `/admin` に redirect する。DB が空でも first-user 画面へは誘導しない                                                                                           |
| `@payloadcms/ui/dist/views/Edit/Auth/index.js:262,288` | user 編集画面の「パスワード変更」ボタンが消える                                                                                                                                                       |
| `auth/operations/logout.js`                            | `afterLogout` hook を実行し、Payload cookie を消すだけ。Access の cookie は残る                                                                                                                       |

### admin UI のセッション挙動(`@payloadcms/ui/dist/providers/Auth/index.js`)

- mount 時に `/api/users/me` を取得し、`setNewUser(json)` を呼ぶ。`json.exp` があれば、期限前の「ログイン継続」モーダルと期限での強制ログアウトタイマーが立つ。
- custom strategy で Payload token が存在しないと、`meOperation` は `exp` を返さない(`auth/operations/me.js`: `currentToken` があるときだけ `decodeJwt`)。**タイマーは一切立たない**。Access の期限切れはリクエスト時の再検証で検知されるだけになる。
- `hooks.me` で `{ user, exp }` を返すと exp を供給できる(先例: payload-authjs の me hook、https://github.com/CrawlerCode/payload-authjs/blob/main/packages/payload-authjs/src/payload/collection/hooks/me.ts)。
- logout ボタンは `admin.components.logout.Button` で差し替えられる(`payload/dist/config/types.d.ts:719`)。

---

## plugin で後付け登録する方法(コード例)

Payload plugin のシグネチャは `(incomingConfig: Config) => Config`。先例:

- payload-oauth2(https://github.com/WilsonLe/payload-oauth2/blob/main/src/plugin.ts と `modify-auth-collection.ts`)は collection を探して `strategies` に追加し、同名の strategy を除外する。注意点として、変更した collection を**配列末尾へ移動する**(admin nav の順序が変わる)。下の例は in-place の `map` にしている。
- payload-authjs(https://github.com/CrawlerCode/payload-authjs/blob/main/packages/payload-authjs/src/payload/collection/index.ts)は `strategies: [AuthjsAuthStrategy(collection), ...existing]` で先頭に追加し、`hooks.me` / `refresh` / `afterLogout` を append する。

以下は repo 規約(arrow 関数のみ、`let` 禁止、no barrel、early return)に沿った設計スケッチ。動作は未検証。

```ts
// src/plugins/cloudflare-access/index.ts
import type { CollectionConfig, Config, Plugin } from 'payload';

import { createAccessStrategy } from './strategy';

export type CloudflareAccessOptions = {
  collection: string;               // 'users'
  teamDomain: string | undefined;   // 'https://<team>.cloudflareaccess.com'
  aud: string | undefined;          // Access app の AUD tag(stg/prod で別 app なら別値)
};

const isEnabled = (o: CloudflareAccessOptions): o is CloudflareAccessOptions & { teamDomain: string; aud: string } =>
  o.teamDomain !== undefined && o.teamDomain !== '' && o.aud !== undefined && o.aud !== '';

const withAccessStrategy = (
  collection: CollectionConfig,
  options: CloudflareAccessOptions & { teamDomain: string; aud: string },
): CollectionConfig => {
  const auth = typeof collection.auth === 'object' ? collection.auth : {};
  const strategy = createAccessStrategy(options);
  return {
    ...collection,
    auth: {
      ...auth,
      // object 形式なので email/hash/sessions 列は残り、dev とスキーマが一致する
      disableLocalStrategy: { enableFields: true },
      strategies: [strategy, ...(auth.strategies ?? []).filter((s) => s.name !== strategy.name)],
    },
  };
};

export const cloudflareAccessPlugin =
  (options: CloudflareAccessOptions): Plugin =>
  (incomingConfig: Config): Config => {
    // env が揃っていない環境(local dev や Access 未設定の stg)では何もしない。
    // NODE_ENV で切り替えると、Access 未設定の環境でログイン手段がゼロになる
    if (!isEnabled(options)) return incomingConfig;
    return {
      ...incomingConfig,
      collections: (incomingConfig.collections ?? []).map((c) =>
        c.slug === options.collection ? withAccessStrategy(c, options) : c,
      ),
      // 必要なら admin.components.logout.Button も差し替える(後述)
    };
  };
```

```ts
// src/plugins/cloudflare-access/strategy.ts
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthStrategy, Payload } from 'payload';

const STRATEGY_NAME = 'cloudflare-access';
const CF_COOKIE = /(?:^|;\s*)CF_Authorization=([^;]+)/;

// header 優先、なければ cookie。path 単位の app だと admin の XHR(/api/users/me 等)には header が来ないため
const extractToken = (headers: Headers): string | undefined => {
  const header = headers.get('cf-access-jwt-assertion');
  if (header !== null && header !== '') return header;
  return CF_COOKIE.exec(headers.get('cookie') ?? '')?.[1];
};

const findOrCreateUser = async (payload: Payload, collection: string, email: string) => {
  const found = await payload.find({ collection, where: { email: { equals: email } }, limit: 1, depth: 0 });
  const [existing] = found.docs;
  if (existing !== undefined) return existing;
  try {
    return await payload.create({ collection, data: { email } });
  } catch {
    // 初回表示で /me と /access が並走すると unique 制約で負ける。勝った側を再取得する
    const retry = await payload.find({ collection, where: { email: { equals: email } }, limit: 1, depth: 0 });
    return retry.docs[0];
  }
};

export const createAccessStrategy = (o: { collection: string; teamDomain: string; aud: string }): AuthStrategy => {
  const jwks = createRemoteJWKSet(new URL(`${o.teamDomain}/cdn-cgi/access/certs`)); // isolate 単位でキャッシュされる
  return {
    name: STRATEGY_NAME,
    authenticate: async ({ headers, payload }) => {
      const token = extractToken(headers);
      if (token === undefined) return { user: null };
      const { payload: claims } = await jwtVerify(token, jwks, {
        issuer: o.teamDomain,
        audience: o.aud,
        algorithms: ['RS256'],
      }); // 失敗時の throw は executeAuthStrategies が logError して user: null 扱い
      // service token の JWT には email がない(sub は "")。人間だけを通す
      if (typeof claims.email !== 'string' || claims.email === '') return { user: null };
      const email = claims.email.toLowerCase().trim(); // Payload の email field は保存時に小文字化する
      const user = await findOrCreateUser(payload, o.collection, email);
      if (user === undefined) return { user: null };
      return { user: { ...user, collection: o.collection, _strategy: STRATEGY_NAME } };
    },
  };
};
```

`payload.config.ts` では `plugins: [cloudflareAccessPlugin({ collection: 'users', teamDomain: cfEnv.CF_ACCESS_TEAM_DOMAIN, aud: cfEnv.CF_ACCESS_AUD }), ...]` のように渡す。`.dev.vars` には入れないので、local では無効のままになる。

補足:

- `access.create` は `req.user !== null` などで縛られている。Local API の `payload.create` は default で `overrideAccess: true` なので、自動作成は通る。
- 「未知の Access email を自動作成する」と、**Access policy に通った人は全員が admin 権限を持つ**ことになる。現状の users には role がない。Access policy(許可する email の列挙)が唯一の認可境界になる点を明示しておくこと。

---

## Access JWT 検証方法

### 公式仕様(https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)

- token の所在: `Cf-Access-Jwt-Assertion` request header(推奨)と `CF_Authorization` cookie。docs の記述は「the cookie is not guaranteed to be passed」。
- 公開鍵: `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`。鍵は 6 週ごとにローテートし、旧鍵は 7 日有効。鍵をハードコードせず JWKS で `kid` マッチさせる。
- 検証する claim: `aud`(Access application の AUD tag)と `iss`(`https://<team>.cloudflareaccess.com`)。`exp` / `nbf` は jose の `jwtVerify` が標準で検証する。
- 公式の Workers 例は `jose` の `createRemoteJWKSet` + `jwtVerify(token, JWKS, { issuer: env.TEAM_DOMAIN, audience: env.POLICY_AUD })` で、env は `POLICY_AUD` と `TEAM_DOMAIN`。
- claim の中身(https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/): `alg: RS256`。identity token は `email` / `sub` / `type: "app"` / `identity_nonce` / `country` を含む。**service token は `email` がなく、`sub: ""`、代わりに `common_name` を持つ**。groups は custom claim に明示設定したときだけ入り、約 1KB を超えると切り詰められる。完全な identity は `/cdn-cgi/access/get-identity` で取る。
- docs の明記: 「Unless your application is connected to Access through Cloudflare Tunnel, your application must validate the token … Validation of the header alone is not sufficient」(同ページ)。

### Workers ネイティブの `ctx.access`(この repo では不可)

- 2026-08-14 に追加された(https://developers.cloudflare.com/changelog/post/2026-08-14-workers-access/)。`ctx.access.aud` と `await ctx.access.getIdentity()` を使えば JWT のパースが不要になり、local でも `wrangler.jsonc` の `access.dev: { aud, identity }` で模擬できる(https://developers.cloudflare.com/workers/configuration/cloudflare-access/#test-ctxaccess-locally)。
- ただし同 docs に制限が 2 つある。どちらもこの repo に当てはまる。
  - 「Workers with Static Assets execute behind an internal router Worker … the router does not pass `ctx.access` to the user Worker.」この repo の `wrangler.toml` は `[assets] directory = ".open-next/assets"`(OpenNext)なので **`ctx.access` は常に `undefined` になる**。
  - Worker 単位の Access は「WebSocket upgrade requests … will fail with a 403」。`CURSOR_ROOM`(DO + WS)があるので Worker 単位の Access は使えない。→ **hostname/path 単位の self-hosted app** にする(同 docs の「Protect a specific hostname, Custom Domain, or path」)。
- 旧来の one-click Access(2025-10、https://developers.cloudflare.com/changelog/post/2025-10-03-one-click-access-for-workers/)でも、JWT の自前検証は必要と明記されている。

### この repo での Access app の切り方

- path は wildcard で指定する(https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)。推奨: `napochaan.com/admin*`(stg は `stg.napochaan.com/admin*`)と `/oauth/authorize*`(後述)。
- **`/api/*` は Access に入れない**。`/api/media` は公開画像の配信で、repo 内に約 30 箇所の参照がある。`/api/mcp` は独自 OAuth。admin の XHR(`/api/users/me`、`/api/access`、collection REST)には header が付かないが、`CF_Authorization` cookie は domain スコープで届くので、cookie fallback で検証する。Cookie Path Attribute は既定で OFF であり、ON にすると path が違う `/api` に cookie が届かなくなるので **OFF のまま**にする(https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/#cookie-path-attribute)。
- 代替案として、`/api/users*` を同じ app の追加 path にする手もある。ただし collection REST(`/api/news` など)は残るので、cookie fallback はどのみち必要。
- 二重防御として、`worker/app.ts`(Hono)の `/admin*` に `@hono/cloudflare-access` を掛け、Payload 到達前に弾くこともできる。

---

## 落とし穴

1. **`Cf-Access-Authenticated-User-Email` を信用しない**。Access を通らない経路では誰でも付けられる(例: https://github.com/the-metafactory/cortex/issues/1410、https://jamieede.com/posts/hardened-admin-auth-cloudflare-pages/)。`CF_Authorization` cookie も「あるだけ」では信用せず、必ず署名・`aud`・`iss` を検証する。
2. **Access を迂回する入口**。この repo は全 env で `workers_dev = false` / `preview_urls = false`(`wrangler.toml`)なので現状は閉じている。将来これらを有効にすると、その hostname は Access app の外になる。JWT 検証が header の有無ではなく `aud` で縛られている限り、偽造は不可能。
3. **`/oauth/authorize` が本番で壊れる**。`src/app/(site)/oauth/authorize/_actions/authorize.ts:35` は `payload.login({ collection: 'users', data: { email, password } })` を使う。`disableLocalStrategy` を有効にすると `loginOperation` が `Forbidden` を投げ、MCP の OAuth 認可が全滅する。`/oauth/authorize` を Access app の path に含め、`payload.auth({ headers })` で user を解決する形(`src/app/next/preview/route.ts` と同じ方式)に改修する必要がある。
4. **有効化の判定を `NODE_ENV` にしない**。Access 未設定の stg で local strategy だけ無効になると、ログイン画面に何も出ず(LoginForm は非描画)、入る手段がなくなる。`CF_ACCESS_TEAM_DOMAIN` と `CF_ACCESS_AUD` が揃ったときだけ有効にする。stg と prod を別の Access app にするなら AUD も env ごとに分ける。
5. **セッションはリクエストごと**。`local-jwt` が登録されないため Payload の JWT cookie は発行も参照もされず、admin の全リクエスト(RSC、server function、XHR)で毎回 JWT 検証と users の検索が走る。JWKS は `createRemoteJWKSet` が isolate 内でキャッシュする。users の検索コストが気になるなら、isolate 内で `token → user` を exp まで memo する。
6. **公開ページでも strategy が走る**。admin ユーザーは domain スコープの `CF_Authorization` を持っているので、公開サイトの `/api/media/file/*` リクエストでも検証と DB 検索が起きる。token がない一般訪問者には early return でほぼ無コスト。
7. **logout が効かない**。admin の logout は `POST /api/users/logout` で Payload cookie を消すだけで、Access の cookie は残るため、`/admin/login` に戻ると strategy が即座に再認証して `/admin` へ redirect する。`admin.components.logout.Button` を差し替えて `/cdn-cgi/access/logout` へ遷移させる。これは全 Access app の session を失効させ、旧 token は 20〜30 秒で無効になる(https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/#log-out-as-a-user)。app 単位の logout は不可。
8. **期限表示**。exp が返らないので admin の「ログイン継続」モーダルや自動ログアウトは動かない。必要なら `hooks.me` で Access JWT の `exp` を返す(payload-authjs の先例)。Access 側で期限が切れた後の XHR は、Access の外の path なら単に未認証(401/403)になる。`/admin*` の画面遷移時には Access のログインに飛ぶ。Access には AJAX 用に期限切れで 401 を返す設定もある(同 session-management ページ)。
9. **自動作成の race**。初回表示で `/me` と `/access` などが並走し、unique な email で create が衝突する。上の例のように create 失敗時は再 find する。
10. **email の正規化**。Payload の auth email field は保存時に `toLowerCase().trim()` する(`payload/dist/auth/baseFields/email.js:14`)。検索側でも小文字化しないと、大文字を含む IdP email で毎回 create を試みて失敗する。
11. **strategy の例外は握りつぶされる**。`executeAuthStrategies` は catch して `logError` するだけ。JWT の期限切れなどは error ログに出るので、ノイズにするかどうかを決め、期待される失敗は自前で catch して `{ user: null }` を返すかを判断する。
12. **docs と installed version のずれ**。`req` 引数(docs main にはあるが 3.84.1 にはない)と `optionalPassword`(3.84.1 では no-op)。また docs にある通り、strategy の変更は HMR されず、dev server の再起動が必要(https://payloadcms.com/docs/authentication/custom-strategies)。
13. **local 開発**。`ctx.access` の `access.dev` 模擬は static assets 付き Worker では効かず、そもそも `next dev` では使えない。local は strategy を無効にし(env 未設定)、既存の email + password と `autoLogin.prefillOnly` を維持するのが最も単純。strategy 自体のテストは、vitest で自前生成した RS256 鍵と JWKS(`createLocalJWKSet` / `jose` の `SignJWT`)を使う単体テストで行う。
14. **Workers Cache**。prod は `[env.production.cache] enabled = true`。`/api/users/me` は既存の worker middleware で `private, no-store` になる(`worker/app.test.ts:64-65`)。Access で保護した `/admin*` と `/oauth/authorize` の応答も、cache されない(`private`/`no-store`)ことを stg で確認すること。Cookie や header は cache key に入らない(memory の perf-tuning メモと同じ)。
15. 参考: Workers 上の Server Action 認証問題(https://github.com/payloadcms/payload/issues/14656、3.64.0 + OpenNext 1.12、open)。この repo は admin が現に動いているので直接は当てはまらない見込み。ただし strategy 導入後は stg で admin の保存(server function)を必ず E2E 確認する。

---

## 参考URL

- Payload Custom Strategies: https://payloadcms.com/docs/authentication/custom-strategies (source: https://raw.githubusercontent.com/payloadcms/payload/main/docs/authentication/custom-strategies.mdx)
- Payload Auth overview / Disable Local Strategy: https://payloadcms.com/docs/authentication/overview (source: https://raw.githubusercontent.com/payloadcms/payload/main/docs/authentication/overview.mdx)
- payload-oauth2: https://github.com/WilsonLe/payload-oauth2
- payload-authjs: https://github.com/CrawlerCode/payload-authjs
- nivoventures/payload-cloudflare-jwt-auth: https://github.com/nivoventures/payload-cloudflare-jwt-auth
- EmDash Cloudflare Access 実装: https://github.com/emdash-cms/emdash/blob/main/packages/cloudflare/src/auth/cloudflare-access.ts
- Hono cloudflare-access middleware: https://github.com/honojs/middleware/tree/main/packages/cloudflare-access
- payload.market auth plugins: https://payload.market/plugins/category/auth
- chrishop Access gate: https://github.com/jacobmiller22/chrishop/issues/139
- Cloudflare Validate JWTs: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- Cloudflare Application token: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/
- Cloudflare Authorization cookie: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/
- Cloudflare Session management / logout: https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/
- Cloudflare Application paths: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- Workers × Access(`ctx.access`、static assets 制限、WS 制限): https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- Changelog 2026-08-14 Workers Access: https://developers.cloudflare.com/changelog/post/2026-08-14-workers-access/
- Changelog 2025-10-03 one-click Access: https://developers.cloudflare.com/changelog/post/2025-10-03-one-click-access-for-workers/
- cloudflare-docs issue #33810(`ctx.access` の記載漏れ): https://github.com/cloudflare/cloudflare-docs/issues/33810
- email header spoof 事例: https://github.com/the-metafactory/cortex/issues/1410 / https://jamieede.com/posts/hardened-admin-auth-cloudflare-pages/
- Payload issue #14656: https://github.com/payloadcms/payload/issues/14656

### ローカルで確認したファイル(3.84.1)

- `node_modules/payload/dist/auth/types.d.ts`(137-243: strategy の型、`disableLocalStrategy`)
- `node_modules/payload/dist/index.js`(415-440: strategy の登録順、`local-jwt` の条件)
- `node_modules/payload/dist/auth/executeAuthStrategies.js`
- `node_modules/payload/dist/auth/getAuthFields.js`、`auth/operations/{login,logout,me,refresh,registerFirstUser}.js`、`collections/operations/create.js`、`auth/strategies/jwt.js`
- `node_modules/@payloadcms/next/dist/views/{Login,Root}/index.js`、`utilities/initReq.js`
- `node_modules/@payloadcms/ui/dist/providers/Auth/index.js`、`views/Edit/Auth/index.js`
- repo: `src/collections/users.ts`、`src/payload.config.ts`、`src/app/(site)/oauth/authorize/_actions/authorize.ts`、`src/app/next/preview/route.ts`、`wrangler.toml`
