# Payload admin の Cloudflare Access 自動ログイン Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cloudflare Access を通過した人が、Access JWT の email でそのまま Payload admin にログインされた状態にする(stg/prod は password ログイン無効)。

**Architecture:** pnpm workspace パッケージ `packages/payload-cloudflare-access` に、JWT 検証(Payload 非依存)・CSRF 判定・email→user 解決・Payload custom strategy・plugin・ログアウトボタンを置く。plugin は `CF_ACCESS_TEAM_DOMAIN` と `CF_ACCESS_AUD` が揃ったときだけ strategy 追加と `disableLocalStrategy: { enableFields: true }` を行い、importMap に載るログアウトボタンは常に登録する。MCP の `/oauth/authorize` は Access user があれば「承認」ボタンだけ、無ければ従来の password form の二経路にする。

**Tech Stack:** pnpm workspace / Payload 3.84.1 custom auth strategy / jose(RS256, JWKS)/ neverthrow / Next.js 15 + OpenNext / vitest(unit=node, browser=playwright)/ react-aria-components

**Spec:** `docs/superpowers/specs/2026-10-05-payload-cloudflare-access-design.md`

## Global Constraints

- パッケージ名 `@napolab/payload-cloudflare-access`、配置 `packages/payload-cloudflare-access`、`private: true`、`type: "module"`、TS ソース直参照(ビルド工程なし)。
- `exports` は subpath のみ: `"./plugin"` → `./src/plugin/index.ts`、`"./client/logout-button"` → `./src/client/logout-button/index.tsx`。パッケージは Payload 専用(② MCP は `@hono/cloudflare-access` を使うので検証関数を公開しない)。`index.ts` の re-export barrel は作らない。
- パッケージ内で `@opennextjs/cloudflare` とアプリの alias(`@lib/*`, `@payload-types` など)を import しない。
- `tsconfig.json` の `paths` は変更しない。
- strategy 名は `'cloudflare-access'`。header 名 `Cf-Access-Jwt-Assertion`、cookie 名 `CF_Authorization`、JWKS は `https://<teamDomain>.cloudflareaccess.com/cdn-cgi/access/certs`、iss は `https://<teamDomain>.cloudflareaccess.com`、ログアウト先は `/cdn-cgi/access/logout`。
- JWT 検証: `algorithms: ['RS256']`、issuer、audience(**リスト**。いずれかに一致すれば可)、exp / nbf を `clockTolerance: 30`(秒。`@hono/cloudflare-access` と同値)で、`type === 'app'`、`email` は空でない string。
- `CF_ACCESS_AUD` はカンマ区切りで複数 AUD を受け付ける。stg ではホスト全体アプリ(`/api/*` などに付く)とパス単位アプリ(`/admin*`)の 2 つの AUD が混在するため。
- `jose` は 6.x を使う(5.x は Node 専用ビルドを持ち、bundler の export condition で本番とテストの実装が分かれる。memory `bundler-export-condition-trap`)。
- モジュールスコープの可変状態(memo 用 `Map` など)を置かない。JWKS の key resolver は plugin のクロージャで 1 回だけ作る。
- strategy は throw しない。失敗は `{ user: null }` + `payload.logger.warn` / `error`(Payload は strategy の例外を握りつぶすため)。
- `Cf-Access-Authenticated-User-Email` ヘッダーは読まない。
- コードスタイル: arrow function のみ / `let`・`forEach`・`!`・`any`・IIFE 禁止 / `String()`・`Number()`・`Boolean()` 禁止 / 早期 return / エラーは class / 識別子の頭字語は大文字(`JWT`, `URL`, `ID`)。
- ファイル配置: モジュールごとにディレクトリを切り、実装は `src/<name>/index.ts(x)`、テストは同じディレクトリの `src/<name>/<name>.test.ts(x)`(例: `src/verify/index.ts` + `src/verify/verify.test.ts`)。`index.ts` は実装を持つので barrel ではない。
- テスト: `*.test.ts` は node(unit)、DOM を触るものは `*.test.tsx`(browser)。
- 各タスクの終わりに `pnpm lint && pnpm typecheck` と該当テストを通す。**commit はしない**(CLAUDE.md: 勝手に commit しないこと)。各タスク完了時に difit を起動して本人にレビューを依頼し、承認後に本人の指示で commit する。

## Review Focus

1. **Access JWT はあるが Origin が別サイト**(cookie 経路の cross-site POST)→ 拒否されること。Task 2 の `csrf` テストと Task 5 の strategy テスト(`rejects cross-site cookie request`)で固定する。
2. **匿名アクセス(`/api/media/*` などトークン無し)**→ JWKS を取りに行かず `{ user: null }`。Task 5 `does not resolve keys without a token` で固定する。
3. **AUD が複数(stg)・空要素を含む**(`CF_ACCESS_AUD="a, b,"`)→ trim して空要素を除き、どちらの AUD の JWT も通ること。Task 3 `accepts any listed audience` と Task 5 `parses a comma-separated aud` で固定する。
4. **env が片方だけ設定・空文字**(`CF_ACCESS_AUD=""` など)→ plugin は無効のまま password ログインが残ること。Task 5 `stays disabled when one option is empty` で固定する。
5. **同じ email の初回アクセスが並走**(admin が複数 XHR を同時に投げる)→ create の衝突後に再検索して同じ user を返すこと。Task 4 `refinds after a failed create` で固定する。
6. **email の大文字小文字違い**(IdP が `Napo@Example.com` を返す)→ 既存の `napo@example.com` に解決され、重複 user が作られないこと。Task 4 `normalizes email case` で固定する。

---

## File Structure

```
pnpm-workspace.yaml                                      (新規) packages/*
packages/payload-cloudflare-access/
  package.json                                           (新規)
  src/errors/index.ts                          (新規) AccessJWTError 系・ResolveUserError
  src/token/types.ts                           (新規) AccessToken / TokenSource
  src/token/runner/index.ts + runner.test.ts   (新規) createTokenRunner(先に ok を返した source を採用)
  src/token/header-source/index.ts + header-source.test.ts (新規) headerTokenSource
  src/token/cookie-source/index.ts + cookie-source.test.ts (新規) cookieTokenSource
  src/token/index.ts + token.test.ts           (新規) registry [header, cookie] と extractAccessToken
  src/csrf/index.ts + csrf.test.ts             (新規) isAllowedCookieRequest
  src/verify/index.ts + verify.test.ts         (新規) verifyAccessJWT / createAccessKeys
  src/resolve-user/index.ts + resolve-user.test.ts (新規) UserStore / createPayloadUserStore / resolveAccessUser
  src/strategy/index.ts + strategy.test.ts     (新規) authenticateAccess / createAccessStrategy
  src/plugin/index.ts + plugin.test.ts         (新規) cloudflareAccessPlugin / parseAudiences
  src/client/logout-button/index.tsx + logout-button.test.tsx (新規) LogoutButton
next.config.ts                                           (変更) transpilePackages
vitest.config.ts                                         (変更) packages/ の test include + optimizeDeps
src/payload.config.ts                                    (変更) plugin 登録
src/app/(payload)/admin/importMap.js                     (再生成)
src/__mocks__/payloadcms-ui.tsx                          (新規) browser テスト用の @payloadcms/ui スタブ
worker/access-verify-runtime.test.ts                     (新規) workerd 上で verifyAccessJWT が動くことの確認
src/app/(site)/oauth/authorize/page.tsx                  (変更) Access user で分岐
src/app/(site)/oauth/authorize/_actions/authorize.ts     (変更) authorizeWithAccess 追加
src/app/(site)/oauth/authorize/_components/access-authorize-form/index.tsx + access-authorize-form.test.tsx (新規)
.dev.vars.example                                        (変更) CF_ACCESS_* 空値
cloudflare-env.d.ts                                      (再生成, gitignore)
docs/cloudflare-access.md                                (新規) runbook
.claude/rules/cross-module-sync-test.md                  (変更しない)
```

---

### Task 1: workspace の土台とローダー検証

認証コードを書く前に、空のパッケージを全ローダーが読めることを確かめる(spec §7)。1 つでも通らなければ作業を止めて本人に報告する(tsdown 方式への切り替えは spec 更新が必要)。

**Files:**

- Create: `pnpm-workspace.yaml`, `packages/payload-cloudflare-access/package.json`, `packages/payload-cloudflare-access/src/plugin/index.ts`, `packages/payload-cloudflare-access/src/client/logout-button/index.tsx`, `packages/payload-cloudflare-access/src/plugin/plugin.test.ts`
- Modify: `package.json`(依存追加), `next.config.ts`, `vitest.config.ts`, `src/payload.config.ts`, `src/app/(payload)/admin/importMap.js`(再生成)

**Interfaces:**

- Produces:
  - `cloudflareAccessPlugin(options: CloudflareAccessPluginOptions): Plugin`(この時点では logout component 登録のみ)
  - `type CloudflareAccessPluginOptions = { teamDomain: string | undefined; aud: string | undefined; collection?: string }`
  - `LogoutButton: (props: { accessLogout: boolean }) => ReactElement`(この時点では Payload の `Logout` を描画するだけ)
  - `ACCESS_LOGOUT_BUTTON_PATH = '@napolab/payload-cloudflare-access/client/logout-button#LogoutButton'`(plugin/index.ts から export)

- [ ] **Step 1: workspace を作る**

`pnpm-workspace.yaml` に `packages: ['packages/*']`。`packages/payload-cloudflare-access/package.json` を Global Constraints の name / private / type / exports で作り、`peerDependencies` に `payload`, `react`, `@payloadcms/ui`, `react-aria-components`(アプリと同じ範囲指定)を書く。
Run: `pnpm add @napolab/payload-cloudflare-access@workspace:*` → `package.json` の dependencies に `"workspace:*"` が入り、`node_modules/@napolab/payload-cloudflare-access` が symlink になる。

- [ ] **Step 2: 失敗するテストを書く**(`src/plugin/plugin.test.ts`)

```ts
test('registers the logout button even when Access is not configured', () => {
  const config = cloudflareAccessPlugin({ teamDomain: undefined, aud: undefined })(baseConfig);
  expect(config.admin?.components?.logout?.Button).toEqual({
    path: ACCESS_LOGOUT_BUTTON_PATH,
    clientProps: { accessLogout: false },
  });
});
```

`baseConfig` は `{ admin: { user: 'users' }, collections: [{ slug: 'users', auth: true, fields: [] }] } satisfies Config` 程度の最小 config。

- [ ] **Step 3: テストが解決されないことを確認する**

`vitest.config.ts` の unit project の include に `'packages/*/src/**/*.test.ts'`、browser project の include に `'packages/*/src/**/*.test.tsx'` を追加してから実行。
Run: `pnpm vitest run --project unit packages/payload-cloudflare-access`
Expected: FAIL(`cloudflareAccessPlugin` 未定義)

- [ ] **Step 4: 最小実装**

`plugin/index.ts`: config を受けて `admin.components.logout.Button` を `{ path: ACCESS_LOGOUT_BUTTON_PATH, clientProps: { accessLogout: false } }` に設定して返す(既存の `admin.components` は spread で保持)。`client/logout-button/index.tsx`: `'use client'`、`Logout`(`@payloadcms/ui`)をそのまま返す。

- [ ] **Step 5: アプリに組み込む**

- `next.config.ts`: `transpilePackages: ['@napolab/payload-cloudflare-access']`
- `src/payload.config.ts`: `plugins` の先頭に `cloudflareAccessPlugin({ teamDomain: undefined, aud: undefined })`(Task 5 で env に差し替える)
- Run: `pnpm payload generate:importmap` → `importMap.js` に `@napolab/payload-cloudflare-access/client/logout-button#LogoutButton` の行が追加される

- [ ] **Step 6: 全ローダーで検証する**

| Run                                                                 | Expected                                                   |
| ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `pnpm vitest run --project unit packages/payload-cloudflare-access` | PASS                                                       |
| `pnpm payload migrate:status`                                       | 一覧が表示され、パッケージの import エラーが出ない         |
| `pnpm typecheck`                                                    | エラー 0                                                   |
| `pnpm lint`                                                         | エラー 0                                                   |
| `pnpm vitest run --project browser src/app/\(site\)/oauth`          | PASS(browser project がワークスペースを含む状態で壊れない) |
| `pnpm build`                                                        | 成功                                                       |
| `rm -rf node_modules && pnpm install --frozen-lockfile`             | 成功(CI の clean install 相当)                             |

どれかが失敗したら原因をまとめて本人に報告し、ここで止める。

`next dev --turbopack`(webpack とは別の resolver)は本人しか起動できないため、レビュー依頼時に「`pnpm dev` で `/admin` を開いてログアウトボタンが表示されるか」を確認してもらう。

- [ ] **Step 7: レビュー依頼**

difit を起動して本人にレビューを依頼する(commit しない)。

---

### Task 2: トークンの取り出し元(plugin 構成)と CSRF 判定

トークンの取り出し元は prefix-match-processor skill(`.claude/skills/prefix-match-processor`)の形にする: 取り出し元ごとに 1 plugin 1 ディレクトリ、`run(headers): Result<AccessToken, Headers>` で、扱わないときは `err(headers)`。runner は先に `ok` を返した plugin を採用する。registry(順序 = header → cookie)はパッケージ内部だけで持ち、plugin の options には出さない。

**Files:**

- Create:
  - `packages/payload-cloudflare-access/src/token/types.ts`(型のみ)
  - `src/token/runner/index.ts` + `src/token/runner/runner.test.ts`
  - `src/token/header-source/index.ts` + `src/token/header-source/header-source.test.ts`
  - `src/token/cookie-source/index.ts` + `src/token/cookie-source/cookie-source.test.ts`
  - `src/token/index.ts` + `src/token/token.test.ts`(registry と `extractAccessToken`)
  - `src/csrf/index.ts` + `src/csrf/csrf.test.ts`

**Interfaces:**

- Produces:
  - types.ts: `type AccessTokenSourceName = 'header' | 'cookie'`、`type AccessToken = { token: string; source: AccessTokenSourceName }`、`type TokenSource = { run: (headers: Headers) => Result<AccessToken, Headers> }`
  - runner: `createTokenRunner(sources: readonly TokenSource[]): (headers: Headers) => Result<AccessToken, Headers>`(先頭から順に試し、最初の `ok` を返す。全部 `err` なら `err(headers)`。skill の再帰 `run` の形)
  - header-source: `headerTokenSource: TokenSource`(`Cf-Access-Jwt-Assertion`)
  - cookie-source: `cookieTokenSource: TokenSource`(`CF_Authorization`)
  - token: `extractAccessToken: (headers: Headers) => Result<AccessToken, Headers>` = `createTokenRunner([headerTokenSource, cookieTokenSource])`
  - csrf: `isAllowedCookieRequest(headers: Headers, csrf: readonly string[]): boolean`
- CSRF 検査は cookie-source に同居させない。strategy(Task 5)が `source === 'cookie'` のときに掛け、拒否を warn ログに残す。

- [ ] **Step 1: 失敗するテストを書く**

`runner.test.ts`(テスト内のダミー source で、registry に依存しない):

- `returns the first ok` → `[miss, hitA, hitB]` で hitA の結果、hitB の `run` は呼ばれない
- `returns err with the input when nothing matches` → `[miss, miss]` で `err` かつ値が入力と同じ `Headers`
- `returns err for an empty list`

`header-source.test.ts`:

- `reads the Cf-Access-Jwt-Assertion header` → `ok({ token: 'h', source: 'header' })`
- `trims the header value` → `' h '` で `token: 'h'`
- `returns err without the header` / `returns err for an empty header value`

`cookie-source.test.ts`:

- `reads CF_Authorization among other cookies` → `cookie: 'a=1; CF_Authorization=c; b=2'` で `ok({ token: 'c', source: 'cookie' })`
- `keeps "=" inside the cookie value` → `CF_Authorization=x=y` で `token: 'x=y'`
- `does not match a cookie whose name only ends with CF_Authorization` → `XCF_Authorization=c` で `err`
- `returns err without the cookie` / `returns err for an empty cookie value`

`token.test.ts`(registry の順序を固定する):

- `prefers the header over the cookie` → 両方あるとき `source: 'header'`
- `falls back to the cookie` → cookie だけのとき `source: 'cookie'`
- `returns err without header or cookie`

`csrf.test.ts`(Payload 3.84.1 `extractJWT.js` の `cookie` 判定表をそのまま固定する。冒頭コメントでその出典を書く):

| test                                                       | headers                         | csrf                        | expected |
| ---------------------------------------------------------- | ------------------------------- | --------------------------- | -------- |
| `allows a listed Origin`                                   | `Origin: https://napochaan.com` | `['https://napochaan.com']` | true     |
| `rejects an unlisted Origin`                               | `Origin: https://evil.example`  | 同上                        | false    |
| `allows any Origin when csrf is empty`                     | `Origin: https://evil.example`  | `[]`                        | true     |
| `allows same-origin fetch without Origin`                  | `Sec-Fetch-Site: same-origin`   | `['https://napochaan.com']` | true     |
| `allows same-site fetch without Origin`                    | `Sec-Fetch-Site: same-site`     | 同上                        | true     |
| `allows direct navigation without Origin`                  | `Sec-Fetch-Site: none`          | 同上                        | true     |
| `rejects cross-site fetch without Origin`                  | `Sec-Fetch-Site: cross-site`    | 同上                        | false    |
| `rejects a request with neither Origin nor Sec-Fetch-Site` | なし                            | 同上                        | false    |

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm vitest run --project unit packages/payload-cloudflare-access/src/token packages/payload-cloudflare-access/src/csrf`
Expected: FAIL(モジュール未定義)

- [ ] **Step 3: 実装する**

`cookie-source`: `headers.get('cookie')` を `;` で分割して trim → 最初の `=` で name と value に分割(値に `=` を含み得るため)→ name が完全一致するものを採る。`csrf/index.ts`: 上の表を早期 return で実装。

- [ ] **Step 4: 通ることを確認する**

Run: 同上 → PASS。`pnpm lint && pnpm typecheck` → エラー 0。

- [ ] **Step 5: レビュー依頼**(difit、commit しない)

---

### Task 3: Access JWT の検証

**Files:**

- Create: `packages/payload-cloudflare-access/src/errors/index.ts`, `src/verify/index.ts`, `src/verify/verify.test.ts`
- Modify: `packages/payload-cloudflare-access/package.json`(`jose` を dependencies に)

**Interfaces:**

- Consumes: なし
- Produces:
  - `type AccessIdentity = { email: string }`
  - `type VerifyAccessJWTArgs = { token: string; teamDomain: string; aud: readonly string[]; keys: JWTVerifyGetKey }`
  - `verifyAccessJWT(args: VerifyAccessJWTArgs): ResultAsync<AccessIdentity, AccessJWTError>`
  - `createAccessKeys(teamDomain: string): JWTVerifyGetKey`(memo しない。呼び出し側=plugin が 1 回だけ作って使い回す)
  - `accessIssuer(teamDomain: string): string` → `https://${teamDomain}.cloudflareaccess.com`
  - errors/index.ts: `abstract class AccessJWTError extends Error`、`class InvalidAccessToken`(jose の検証失敗を `cause` に保持)、`class WrongAccessTokenType`、`class MissingAccessEmail`

- [ ] **Step 1: 依存を追加する**

Run: `pnpm --filter @napolab/payload-cloudflare-access add jose@^6`
Expected: パッケージの `package.json` に `"jose": "^6.x"`。ワークスペースには jose 5.10.0(他依存の transitive)も居るので、パッケージが 6 を解決していることを `node -e "console.log(require.resolve('jose', { paths: ['packages/payload-cloudflare-access'] }))"` で確認する。

- [ ] **Step 2: 失敗するテストを書く**(`verify.test.ts`)

`beforeAll` で `generateKeyPair('RS256')` → `exportJWK` に `kid` を付けて `createLocalJWKSet({ keys: [jwk] })`。ヘルパ `sign(claims, opts?)` は `new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid }).setIssuer(accessIssuer('napolab')).setAudience('aud-1').setExpirationTime('5m')` を既定にし、上書きできるようにする。

| test                                     | 入力                                         | expected                              |
| ---------------------------------------- | -------------------------------------------- | ------------------------------------- |
| `returns the email of a valid app token` | `{ type: 'app', email: 'napo@example.com' }` | `ok({ email: 'napo@example.com' })`   |
| `accepts any listed audience`            | aud `'aud-2'`、`aud: ['aud-1', 'aud-2']`     | ok                                    |
| `rejects an expired token`               | exp を 60 秒前                               | `err` instanceof `InvalidAccessToken` |
| `tolerates 30 seconds of clock skew`     | exp を 10 秒前                               | ok                                    |
| `rejects a token that is not yet valid`  | nbf を 60 秒後                               | `InvalidAccessToken`                  |
| `rejects a wrong audience`               | aud `'other'`                                | `InvalidAccessToken`                  |
| `rejects a wrong issuer`                 | iss `https://evil.cloudflareaccess.com`      | `InvalidAccessToken`                  |
| `rejects a tampered signature`           | 別鍵で署名                                   | `InvalidAccessToken`                  |
| `rejects a non-RS256 token`              | HS256 で署名                                 | `InvalidAccessToken`                  |
| `rejects a non-app token`                | `{ type: 'org', email }`                     | `WrongAccessTokenType`                |
| `rejects a service token without email`  | `{ type: 'app', common_name: 'svc' }`        | `MissingAccessEmail`                  |
| `rejects an empty email`                 | `{ type: 'app', email: '' }`                 | `MissingAccessEmail`                  |

- [ ] **Step 3: 失敗を確認する**

Run: `pnpm vitest run --project unit packages/payload-cloudflare-access/src/verify/verify.test.ts` → FAIL

- [ ] **Step 4: 実装する**

`verifyAccessJWT`: `ResultAsync.fromPromise(jwtVerify(token, keys, { algorithms: ['RS256'], issuer: accessIssuer(teamDomain), audience: [...aud], clockTolerance: 30 }), (e) => new InvalidAccessToken(e))` → `andThen` で `type` 検査 → `email` 検査。`createAccessKeys`: `createRemoteJWKSet(new URL('/cdn-cgi/access/certs', accessIssuer(teamDomain)))` を返すだけ(jose の remote JWKS は自前でキャッシュする)。

- [ ] **Step 5: workerd 上でも動くことを確認する**

`worker/access-verify-runtime.test.ts`(workers project。`worker/mcp-v2-runtime.test.ts` と同じ形)で、ローカル鍵で署名した JWT を `verifyAccessJWT`(公開 export は無いので `../packages/payload-cloudflare-access/src/verify` を相対 import)に通して `ok` になることを 1 ケース確認する。
Run: `pnpm vitest run --project workers worker/access-verify-runtime.test.ts` → PASS

- [ ] **Step 6: 通ることを確認する**

Run: `pnpm vitest run --project unit packages/payload-cloudflare-access/src/verify/verify.test.ts` → PASS。`pnpm lint && pnpm typecheck` → エラー 0。

- [ ] **Step 7: レビュー依頼**(difit、commit しない)

---

### Task 4: email → Payload user の解決(自動作成)

**Files:**

- Create: `packages/payload-cloudflare-access/src/resolve-user/index.ts`, `src/resolve-user/resolve-user.test.ts`
- Modify: `packages/payload-cloudflare-access/src/errors/index.ts`(`ResolveUserError` 追加)

**Interfaces:**

- Consumes: `AccessIdentity`(Task 3)
- Produces:
  - `type AccessUser = TypedUser`(`payload` の型)
  - `type UserStore = { findByEmail: (email: string) => Promise<AccessUser | undefined>; create: (email: string) => Promise<AccessUser> }`
  - `createPayloadUserStore(payload: Pick<Payload, 'find' | 'create'>, collection: CollectionSlug): UserStore`
  - `resolveAccessUser(store: UserStore, identity: AccessIdentity): ResultAsync<AccessUser, ResolveUserError>`
  - errors/index.ts: `class ResolveUserError extends Error`(`cause` 保持)

- [ ] **Step 1: 失敗するテストを書く**(`resolve-user.test.ts`、in-memory の `UserStore` を使う)

| test                                                    | 状況                                                               | expected                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| `returns an existing user`                              | store に `napo@example.com`                                        | その user、`create` は呼ばれない                       |
| `creates a user for an unknown email`                   | store 空                                                           | `create('napo@example.com')` が 1 回、作成 user を返す |
| `normalizes email case`                                 | store に `napo@example.com`、identity `Napo@Example.COM`           | 既存 user、`create` は呼ばれない                       |
| `refinds after a failed create`                         | 1 回目の find は undefined、create は throw、2 回目の find で user | その user                                              |
| `fails when create fails and the user is still missing` | create throw、再 find も undefined                                 | `err` instanceof `ResolveUserError`                    |
| `fails when find throws`                                | find が throw                                                      | `ResolveUserError`                                     |

`createPayloadUserStore` は別 describe で、`find` / `create` の呼び出し引数を検査する: `find({ collection, where: { email: { equals } }, limit: 1, depth: 0, overrideAccess: true })` と `create({ collection, data: { email }, overrideAccess: true })`。

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm vitest run --project unit packages/payload-cloudflare-access/src/resolve-user/resolve-user.test.ts` → FAIL

- [ ] **Step 3: 実装する**

`resolveAccessUser`: email を `toLowerCase()` → find → 見つかれば ok → 無ければ create → create が reject したら再 find(並走した初回アクセスの unique 衝突を吸収)→ それでも無ければ err。`createPayloadUserStore` の上に「local API の `overrideAccess: true` なので `users.access.create`(最初の 1 人だけ許可)はここでは効かない。Access ポリシーが唯一の境界(spec R4)」とコメントを書く。

- [ ] **Step 4: 通ることを確認する**

Run: 同上 → PASS。`pnpm lint && pnpm typecheck` → エラー 0。

- [ ] **Step 5: レビュー依頼**(difit、commit しない)

---

### Task 5: strategy と plugin の有効化

**Files:**

- Create: `packages/payload-cloudflare-access/src/strategy/index.ts`, `src/strategy/strategy.test.ts`
- Modify: `packages/payload-cloudflare-access/src/plugin/index.ts`, `src/plugin/plugin.test.ts`, `src/payload.config.ts`, `.dev.vars.example`

**Interfaces:**

- Consumes: `extractAccessToken`(`Result<AccessToken, Headers>` を返す), `isAllowedCookieRequest`(Task 2)/ `verifyAccessJWT`, `createAccessKeys`(Task 3)/ `createPayloadUserStore`, `resolveAccessUser`(Task 4)
- Produces:
  - `ACCESS_STRATEGY_NAME = 'cloudflare-access'`
  - `type AccessStrategyOptions = { teamDomain: string; aud: readonly string[]; collection: CollectionSlug; keys: JWTVerifyGetKey }`
  - `parseAudiences(raw: string | undefined): readonly string[]`(plugin/index.ts。カンマ分割 → trim → 空要素除去)
  - `type AuthenticatePayload = Pick<Payload, 'find' | 'create' | 'config' | 'logger'>`
  - `authenticateAccess(options: AccessStrategyOptions, args: { headers: Headers; payload: AuthenticatePayload }): Promise<AuthStrategyResult>`
  - `createAccessStrategy(options: AccessStrategyOptions): AuthStrategy`(`{ name: ACCESS_STRATEGY_NAME, authenticate: (args) => authenticateAccess(options, args) }`)
  - `cloudflareAccessPlugin` の完成形(下表)

- [ ] **Step 1: 失敗する strategy テストを書く**(`strategy.test.ts`)

Task 3 と同じローカル鍵を `keys` に注入する。`payload` は `find` / `create` を `vi.fn`、`config: { csrf: ['https://napochaan.com'] }`、`logger: { warn: vi.fn(), error: vi.fn() }` の最小オブジェクト(`satisfies` で `AuthenticatePayload` の必要部分に合わせる)。

| test                                                 | 入力                                           | expected                                                                              |
| ---------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `does not resolve keys without a token`              | headers 空、`keys` は呼ばれたら throw する関数 | `{ user: null }`、`keys` 未呼び出し                                                   |
| `authenticates via the header`                       | 有効 JWT を header に                          | `user.email`、`user.collection === 'users'`、`user._strategy === 'cloudflare-access'` |
| `authenticates via the cookie from the same origin`  | cookie + `Sec-Fetch-Site: same-origin`         | user あり                                                                             |
| `rejects cross-site cookie request`                  | cookie + `Origin: https://evil.example`        | `{ user: null }`、`logger.warn` 1 回、`keys` 未呼び出し                               |
| `returns null for an invalid token without throwing` | aud 違いの JWT                                 | `{ user: null }`、`logger.warn` 1 回                                                  |
| `returns null when user resolution fails`            | `find` が reject                               | `{ user: null }`、`logger.error` 1 回                                                 |

- [ ] **Step 2: plugin テストを拡張する**(`plugin.test.ts`)

| test                                                         | options                                                                         | expected                                                                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `leaves auth untouched when Access is not configured`        | `undefined / undefined`                                                         | users の `auth` が入力と同値、logout は `accessLogout: false`                                                                                            |
| `stays disabled when one option is empty`                    | `{ teamDomain: 'napolab', aud: '' }` と `{ teamDomain: 'napolab', aud: ' , ' }` | 同上                                                                                                                                                     |
| `parses a comma-separated aud`                               | `parseAudiences('aud-1, aud-2,')`                                               | `['aud-1', 'aud-2']`                                                                                                                                     |
| `adds the strategy and disables local login when configured` | `{ teamDomain: 'napolab', aud: 'aud-1' }`                                       | users の `auth.strategies` 末尾の name が `'cloudflare-access'`、`auth.disableLocalStrategy` が `{ enableFields: true }`、logout は `accessLogout: true` |
| `keeps existing strategies`                                  | users に既存 strategy 1 つ                                                      | 既存 + 追加の 2 つ                                                                                                                                       |
| `normalizes auth: true`                                      | users の `auth: true`                                                           | object に変換されて strategy が入る                                                                                                                      |
| `keeps the collection order`                                 | `[media, users, news]`                                                          | slug 順が同じ                                                                                                                                            |
| `targets options.collection over admin.user`                 | `collection: 'admins'`                                                          | `admins` だけが変わる                                                                                                                                    |

- [ ] **Step 3: 失敗を確認する**

Run: `pnpm vitest run --project unit packages/payload-cloudflare-access` → 新規テストが FAIL

- [ ] **Step 4: 実装する**

`authenticateAccess` の順序は spec §4.5 の通り: `extractAccessToken(headers)` が err → null / cookie かつ `!isAllowedCookieRequest(headers, payload.config.csrf)` → warn + null / verify err → warn(`{ err, source }` を構造化で)+ null / resolve err → error + null / ok → `{ user: { ...user, collection, _strategy: ACCESS_STRATEGY_NAME } }`。
`cloudflareAccessPlugin`: `enabled = teamDomain が空でない string かつ parseAudiences(aud) が 1 件以上`。enabled のとき `createAccessKeys(teamDomain)` をクロージャで 1 回だけ作り `createAccessStrategy` に渡す。対象 slug は `options.collection ?? config.admin?.user`。`config.collections` を `map` して対象だけ差し替え(`auth: true` は `{}` に正規化)、enabled のときだけ strategy 追加と `disableLocalStrategy: { enableFields: true }`。logout は常に登録し `accessLogout: enabled`。

- [ ] **Step 5: アプリ側を env に繋ぐ**

- `.dev.vars.example` に `CF_ACCESS_TEAM_DOMAIN=` と `CF_ACCESS_AUD=` を空値で追記(コメント: 「stg/prod は wrangler vars で設定。空なら plugin 無効で password ログイン」)。本人の `.dev.vars`(gitignore)にも同じ空値が要るので、**編集してよいか本人に確認してから**足し、`pnpm cf:types`。
- `cloudflare-env.d.ts` に 2 キーが出ることを確認(出なければ `tsconfig.tsbuildinfo` を消して再実行)。
- `src/payload.config.ts`: `cloudflareAccessPlugin({ teamDomain: cfEnv.CF_ACCESS_TEAM_DOMAIN, aud: cfEnv.CF_ACCESS_AUD })`。

- [ ] **Step 6: 通ることを確認する**

| Run                                                                 | Expected                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm vitest run --project unit packages/payload-cloudflare-access` | PASS                                                               |
| `pnpm payload generate:importmap`                                   | `importMap.js` に差分なし(env で importMap が変わらないことの確認) |
| `pnpm lint && pnpm typecheck`                                       | エラー 0                                                           |
| `pnpm build`                                                        | 成功                                                               |

- [ ] **Step 7: レビュー依頼**(difit、commit しない)

- [ ] **Step 8: stg プローブ(本人と一緒に。Task 6・7 に進む前)**

AUD がどう届くかは docs に明記がなく未実測。Task 6・7 の前に確かめ、結果で runbook を確定させる。

1. 本人が stg にパス単位アプリ(`/admin*`, `/oauth/authorize*`)を作成し、2 つの AUD(ホスト全体・パス単位)を控える
2. 本人の承認を得て `[env.staging.vars]` に `CF_ACCESS_TEAM_DOMAIN` と `CF_ACCESS_AUD="<path-aud>,<host-aud>"` を追加して deploy
3. ブラウザで `/admin` を開き、`/admin` と `/api/users/me` のリクエストそれぞれで JWT が header と cookie のどちらから来て、`aud` がどちらかを記録する(`wrangler tail --env staging` に strategy の warn を出すか、DevTools でトークンを decode)
4. 結果を runbook の「stg の AUD 実測」欄に書く。cookie 経路が stg で通らない(全リクエストに header が付く)場合は、runbook の「stg で cookie 経路を試す」節(下の Task 8)を使うか、本人と相談する

---

### Task 6: ログアウトボタン

**Files:**

- Modify: `packages/payload-cloudflare-access/src/client/logout-button/index.tsx`
- Create: `packages/payload-cloudflare-access/src/client/logout-button/logout-button.test.tsx`
- Create: `src/__mocks__/payloadcms-ui.tsx`(`export const Logout = () => <span data-testid="payload-logout" />`)
- Modify: `vitest.config.ts`(browser project の `resolve.alias` に `'@payloadcms/ui': path.resolve(__dirname, 'src/__mocks__/payloadcms-ui.tsx')`。`vi.mock` では Vite の依存スキャンが `@payloadcms/ui` の Node 専用依存を拾って mid-run reload するため、既存の `@lib/payload/client` と同じく alias で差し替える)

**Interfaces:**

- Consumes: `LogoutButton` の props(Task 1)
- Produces: なし

- [ ] **Step 1: 失敗するテストを書く**(browser mode)

- `links to the Access logout when accessLogout is true` → `getByRole('link', { name: 'ログアウト' })` の `href` が `/cdn-cgi/access/logout`
- `renders the Payload logout when accessLogout is false` → alias したスタブの `data-testid="payload-logout"` が描画される

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm vitest run --project browser packages/payload-cloudflare-access` → FAIL

- [ ] **Step 3: 実装する**

`accessLogout` が true なら react-aria-components の `Link`(`href="/cdn-cgi/access/logout"`、アクセシブルネーム「ログアウト」)。Payload admin には RouterProvider が無いので、ネイティブ遷移になる(意図通り: Cloudflare のエンドポイントへのフルページ遷移)。false なら `<Logout />`。見た目は Payload の `Logout` と揃えるため、`className="nav__log-out"` を付ける(Payload の nav が使うクラス。`node_modules/@payloadcms/ui/dist/elements/Logout` で確認して合わせる)。

- [ ] **Step 4: 通ることを確認する**

Run: 同上 → PASS。`pnpm lint && pnpm typecheck` → エラー 0。

- [ ] **Step 5: レビュー依頼**(difit、commit しない)

---

### Task 7: `/oauth/authorize` の二経路化

**Files:**

- Modify: `src/app/(site)/oauth/authorize/page.tsx`, `src/app/(site)/oauth/authorize/_actions/authorize.ts`
- Create: `src/app/(site)/oauth/authorize/_components/access-authorize-form/index.tsx`, `.../access-authorize-form/styles.css.ts`, `.../access-authorize-form/access-authorize-form.test.tsx`

**Interfaces:**

- Consumes: Payload の `payload.auth({ headers })`(strategy は Task 5 で登録済み)
- Produces:
  - `authorizeWithAccess(prev: AuthorizeState, formData: FormData): Promise<AuthorizeState>`(`'use server'`、`authorize.ts` に追加)
  - `AccessAuthorizeForm: (props: { authRequestQuery: string; clientName: string; email: string }) => ReactElement`

- [ ] **Step 1: 失敗するテストを書く**(`access-authorize-form.test.tsx`、既存 `authorize-form.test.tsx` の action mock の書き方に合わせる)

- `shows the Access email and an approve button` → 「napo@example.com として許可する」ボタンがあり、email / password の textbox が無い
- `submits the auth request query` → hidden input `authRequestQuery` の値が渡される
- `shows the error message from the action` → action が `{ status: 'error', message }` を返したら `role="alert"` に表示

- [ ] **Step 2: 失敗を確認する**

Run: `pnpm vitest run --project browser 'src/app/(site)/oauth/authorize'` → FAIL

- [ ] **Step 3: 実装する**

- `authorize.ts`: 既存の `completeAuthRequest` を共有する。`authorizeWithAccess` は formData から `authRequestQuery` だけを読み、user は `payload.auth({ headers: await headers() })` で取り直す(form の値から user を受け取らない)。`getPayloadClient` は既存と同じく動的 import。user が無ければ `{ status: 'error', message: 'Cloudflare Access のセッションが見つかりません。ページを再読み込みしてください。' }`。成功時は `redirect(redirectTo)`。
- `AccessAuthorizeForm`: 既存 `AuthorizeForm` と同じ `useActionState` + react-aria `Form` + `Button`。リード文は既存と同じ文言、ボタンは `{email} として許可する`。
- `page.tsx`: `getPayloadClient()` → `payload.auth({ headers: await headers() })`。user があれば `AccessAuthorizeForm`(`email={user.email}`)、無ければ既存の `AuthorizeForm`。

- [ ] **Step 4: 通ることを確認する**

Run: 同上 → PASS(既存 `authorize-form.test.tsx` も PASS のまま)。`pnpm lint && pnpm typecheck` → エラー 0。

- [ ] **Step 5: レビュー依頼**(difit、commit しない)

---

### Task 8: runbook

**Files:**

- Create: `docs/cloudflare-access.md`

- [ ] **Step 1: runbook を書く**(spec §5.4 と §8 の内容)

1. 事前準備: 本人の user に password を設定しておく(切り戻し用)
2. Zero Trust: IdP 設定 → self-hosted アプリを stg / prod に作成(パス `/admin*` と `/oauth/authorize*`、ポリシーは本人の email のみ)。stg はホスト全体のアプリが既にあり、パス単位アプリと共存させる
3. AUD を控える → `wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` に `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` を追加 → `pnpm cf:types` → deploy
4. stg 検証チェックリスト(spec §8 の 1〜9)+「別タブで Access からログアウトした後に admin を操作すると、ログイン画面(フォーム無し)に落ちるか / Access の再ログインに誘導されるか」。Task 5 Step 8 の AUD 実測結果を記録する欄を設ける
   - `CF_ACCESS_AUD` は stg ではカンマ区切りで 2 つ、prod では 1 つ
   - 「stg で cookie 経路を試す」節: stg はホスト全体アプリが `/api/*` にも header を付けるため、cookie 経路が通らない。prod と同じ挙動を試すには `stg.napochaan.com/api*` に **Bypass** ポリシーのアプリを足す。ただし stg の `/api/*` が Access なしで外から叩けるようになる(prod と同じ公開範囲)ので、採るかどうかは本人が決める
5. 切り戻し: `CF_ACCESS_*` を wrangler vars から消して deploy(migration 不要)
6. 注意: `/api/*` を Access アプリに入れない(`/api/media` が公開配信)/ Worker 単位の Access を使わない(WebSocket と `ctx.access` の制約)

- [ ] **Step 2: 確認する**

Run: `pnpm lint` → エラー 0(oxfmt が markdown を整形対象にしている場合)

- [ ] **Step 3: レビュー依頼**(difit、commit しない)

---

## 実装後(本人作業)

- Zero Trust でのアプリ作成と AUD 取得、`wrangler.toml` への vars 追加は値が確定してから(runbook の手順 2〜3)。**値が無いまま vars を追加しない**(誤った AUD で全員ログイン不能になる)。
- stg 検証(runbook 手順 4)→ prod。
