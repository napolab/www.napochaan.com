# MCP を Cloudflare Access + MCP Portal に移す Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/mcp` を Cloudflare Access(パス単位アプリ + Managed OAuth)で守って MCP Portal 経由で使えるようにし、OAuthProvider・`OAUTH_KV`・password 同意画面を消し、最後に本番でも Access を有効にする。

**Architecture:** worker は `/mcp` を `/api/mcp` に書き換えて OpenNext へ in-process forward するだけ。`src/app/api/mcp/route.ts` が `Cf-Access-Jwt-Assertion` を `packages/payload-cloudflare-access` の verify で検証し、email から既存 Payload user を find して MCP を処理する(`x-mcp-user-id` は廃止)。Cloudflare 側は `cf --profile napochaan` で Access アプリを作り、Portal 登録は本人が dashboard で行う。

**Tech Stack:** Cloudflare Workers + Hono 4、Next.js 16 on OpenNext、Payload 3.91、jose 6、neverthrow、vitest(node / browser / workers projects)、`cf` CLI(`pnpm dlx cf@latest`)。

**Spec:** `docs/superpowers/specs/2026-10-22-mcp-access-portal-design.md`(調査: `reports/2026-10-21-mcp-portal-access-design-research.md`)

## Global Constraints

- `CLAUDE.md` / `.claude/rules/*` に従う: arrow 関数のみ、`let` 禁止、`!` 禁止、barrel 禁止、新規モジュールは `<name>/index.ts` + `<name>/<name>.test.ts`、acronym casing(`MCP`, `JWT`, `AUD`, `URL`)、neverthrow、エラーは class(`.claude/skills/modeling-errors-as-classes`)、判定は小関数の合成(`.claude/skills/composing-domain-functions`)、TDD。
- **勝手に commit しない**。各 Task の最後の commit step は「本人の承認後」に行う(subagent は commit しない)。
- `pnpm fmt` は使わない(未追跡の `.agents/` を整形してしまう)。整形・lint は変更ファイルを明示して `pnpm oxfmt --write <files>` / `pnpm oxlint <files>`。最後に `pnpm typecheck`。
- MCP の失敗時: JWT 無し・不正・user 不在 → `403`。`CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_MCP_AUD` 未設定 → `500`。
- MCP からは user を作らない(find のみ)。AUD は MCP 専用の `CF_ACCESS_MCP_AUD`(カンマ区切り可)で、admin 用 `CF_ACCESS_AUD` と混ぜない。
- Cloudflare への書き込みは `CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72 pnpm dlx cf@latest --profile napochaan …` で、`--dry-run` → 本人確認(AskUserQuestion)→ 実行 → 再読み込みで確認。`cf auth activate` はしない。
- **本番 deploy 凍結**: Task 6 の merge から Task 8 の本番 deploy まで、本番(手動 dispatch)を deploy しない。
- `OAUTH_KV` の namespace 本体は消さない(binding だけ外す)。

## Review Focus

1. admin 用 AUD(`CF_ACCESS_AUD`)で署名された正しい JWT が `/api/mcp` に来る → 403(AUD の取り違え防止)。→ Task 2 のテスト。
2. クライアントが `x-mcp-user-id: 1` だけを付けて JWT 無しで来る → 403(旧ヘッダーを信じない)。→ Task 3 のテスト。
3. JWT の email が大文字混じり(`Naporin0624@Gmail.com`)で、DB は小文字 → 同じ user に解決する。→ Task 2 のテスト。
4. `/mcp/`・`/mcp?x=1` → `/api/mcp` に forward され、`/mcpfoo` は forward されない。→ Task 4 のテスト。
5. `CF_ACCESS_MCP_AUD = " a , ,b "` → `['a','b']`、空文字だけ → 500。→ Task 1・Task 3 のテスト。

---

### Task 1: package から verify / audiences / user lookup を export する

**Files:**

- Create: `packages/payload-cloudflare-access/src/audiences/index.ts`, `packages/payload-cloudflare-access/src/audiences/audiences.test.ts`
- Modify: `packages/payload-cloudflare-access/src/plugin/index.ts`(`parseAudiences` を audiences から import に変更)、`packages/payload-cloudflare-access/package.json`(`exports`)

**Interfaces:**

- Produces: `parseAudiences(raw: string | undefined): readonly string[]`(`@napolab/payload-cloudflare-access/audiences`)。package `exports` に `"./audiences"`, `"./verify"`, `"./team-domain"`, `"./resolve-user"`, `"./errors"` を追加(それぞれ `./src/<name>/index.ts`)。

- [ ] **Step 1: Write the failing test** — `audiences.test.ts`:
  - `parseAudiences(' a , ,b ')` → `['a', 'b']`
  - `parseAudiences('')` / `parseAudiences(undefined)` / `parseAudiences(' , ')` → `[]`
- [ ] **Step 2:** `pnpm vitest run packages/payload-cloudflare-access/src/audiences` → FAIL(module not found)
- [ ] **Step 3:** `parseAudiences` を plugin から `src/audiences/index.ts` へ移す(実装はそのまま)。plugin は import に置き換え、`plugin.test.ts` が無変更で通ること。`package.json` の `exports` を追加。
- [ ] **Step 4:** `pnpm vitest run packages/payload-cloudflare-access` → PASS、`pnpm typecheck` → 0 errors
- [ ] **Step 5: Commit**(本人承認後)`refactor(access): export verify / audiences / resolve-user from the package`

### Task 2: MCP 用の Access 認証(`src/lib/mcp/access-auth`)

**Files:**

- Create: `src/lib/mcp/access-auth/index.ts`, `src/lib/mcp/access-auth/access-auth.test.ts`, `src/lib/mcp/access-auth/errors.ts`(class 群。または `errors/index.ts` 形式、既存 `src/lib/mcp/errors` に合わせる)

**Interfaces:**

- Consumes: `verifyAccessJWT`, `AccessIdentity`, `AccessJWTError`(`/verify`, `/errors`)。
- Produces:

  ```ts
  export const ACCESS_ASSERTION_HEADER = 'Cf-Access-Jwt-Assertion';
  export type MCPAccessConfig = { teamDomain: string; aud: readonly string[]; keys: JWTVerifyGetKey };
  export type FindUserByEmail = (email: string) => Promise<AccessUser | undefined>;
  export class MissingAccessAssertion extends Error {}
  export class MCPUserNotFound extends Error {}        // email はメッセージに含めない
  export type MCPAuthError = MissingAccessAssertion | AccessJWTError | MCPUserNotFound;
  export const authenticateMCPRequest = (headers: Headers, config: MCPAccessConfig, findUserByEmail: FindUserByEmail): ResultAsync<AccessUser, MCPAuthError>;
  ```

  合成: `readAssertion(headers)` → `verifyAccessJWT` → `normalizeEmail`(trim + lowercase)→ `findUser`。各段は小関数。

- [ ] **Step 1: Write the failing tests** — jose の `generateKeyPair('RS256')` + `createLocalJWKSet` で鍵を作り、`SignJWT` で発行(先例: `worker/access-verify-runtime.test.ts`)。`iss = https://napochaan.cloudflareaccess.com`、`type: 'app'`。
  - header 無し → `MissingAccessAssertion`
  - MCP AUD(`mcp-aud`)で署名、email `owner@example.com`、find が user を返す → `ok(user)`
  - admin AUD(`admin-aud`)で署名(config.aud は `['mcp-aud']`)→ `InvalidAccessToken`
  - 期限切れ(`exp` を 1 時間前)→ `InvalidAccessToken`
  - `type: 'org'` → `WrongAccessTokenType`
  - email `Owner@Example.COM` → find が `'owner@example.com'` で呼ばれる
  - find が `undefined` → `MCPUserNotFound`(find 以外の作成系は呼ばない)
- [ ] **Step 2:** `pnpm vitest run src/lib/mcp/access-auth` → FAIL
- [ ] **Step 3:** 実装(上の Interfaces どおり)。
- [ ] **Step 4:** 同コマンド → PASS
- [ ] **Step 5: Commit**(本人承認後)`feat(mcp): authenticate MCP requests with the Cloudflare Access JWT`

### Task 3: `/api/mcp` route を Access 認証に切り替える

**Files:**

- Modify: `src/app/api/mcp/route.ts`, `src/app/api/mcp/route.test.ts`

**Interfaces:**

- Consumes: `authenticateMCPRequest`, `MCPAuthError` 各 class(Task 2)、`normalizeTeamDomain`(`/team-domain`)、`parseAudiences`(Task 1)、`createAccessKeys`(`/verify`)、`createPayloadUserStore(payload, 'users').findByEmail`(`/resolve-user`)。
- Produces: 応答の契約 — 認証失敗(3 種)→ `403`、env 未設定 → `500`、成功 → 既存どおり transport に委譲。`x-mcp-user-id` は読まない。

- [ ] **Step 1: Write the failing tests**(`route.test.ts` を書き換え。`getCloudflareContext` の mock に `CF_ACCESS_TEAM_DOMAIN: 'napochaan'`, `CF_ACCESS_MCP_AUD: 'mcp-aud'` を足し、JWKS は `createAccessKeys` を mock して local JWKS を返す):
  - JWT 無し → 403
  - `x-mcp-user-id: 1` だけ(JWT 無し)→ 403 で、`find` は呼ばれない
  - 正しい JWT だが user 不在 → 403
  - 正しい JWT + user 有り → 200(transport 委譲)
  - `CF_ACCESS_MCP_AUD` 未設定(または `' , '`)→ 500
  - `CF_ACCESS_TEAM_DOMAIN` 未設定 → 500
- [ ] **Step 2:** `pnpm vitest run src/app/api/mcp` → FAIL
- [ ] **Step 3:** `handleMCPRequest` の先頭を「env から `MCPAccessConfig` を作る(未設定なら 500)→ `authenticateMCPRequest` → `match` で 403 / 続行」に置き換える。`keys` は team 名ごとにモジュールスコープで 1 回だけ作る(同じ team なら使い回す)。認証失敗時は `console.warn` に error の class 名と、検証前に `decodeJwt` した `aud` と `type` だけを出す(email・token は出さない。Task 7 の AUD 実測に使う)。冒頭コメント(x-mcp-user-id の信頼前提)を新しい前提に書き直す。
- [ ] **Step 4:** 同コマンド → PASS、`pnpm typecheck` → 0 errors
- [ ] **Step 5: Commit**(本人承認後)`feat(mcp): verify the Access JWT in /api/mcp and drop x-mcp-user-id`

### Task 4: worker から OAuthProvider を外し、`/mcp` を forward する

**Files:**

- Create: `worker/routes/mcp/index.ts`, `worker/routes/mcp/mcp.test.ts`, `worker/middleware/cache-control/plugins/mcp/index.ts`, `worker/middleware/cache-control/plugins/mcp/mcp.test.ts`
- Modify: `worker/worker.ts`, `worker/app.ts`, `worker/app.test.ts`, `worker/routes/mcp-guard.ts`(コメントのみ)、`worker/middleware/cache-control/index.ts`(registry)
- Delete: `src/app/(site)/oauth/**`, `src/lib/mcp/oauth/**`
- Modify: `package.json`(`pnpm remove @cloudflare/workers-oauth-provider`)、`wrangler.toml`(`OAUTH_KV` の 3 binding と直上のコメントを削除)

**Interfaces:**

- Consumes: `MountedFetch`(`worker/app.ts`)、`when` / `isWithinPath`(`worker/lib/*`)、`PRIVATE_POLICY`。
- Produces: `createMCPRoutes(handlerFetch: MountedFetch): Hono` — `/mcp` と `/mcp/*`(`isWithinPath('/mcp')`)を `/api/mcp` に書き換え、ヘッダー・body・method をそのまま `handlerFetch` に渡す。`mcpPlugin = when(isWithinPath('/mcp'), () => PRIVATE_POLICY)` を cache-control registry の `apiPlugin` の隣に登録。

- [ ] **Step 1: Write the failing tests**
  - `mcp.test.ts`: `POST /mcp`(header `Cf-Access-Jwt-Assertion: x`, body `{}`)→ handlerFetch が `pathname === '/api/mcp'`・同じ header・同じ body で 1 回呼ばれる。`GET /mcp/?a=1` → `/api/mcp?a=1` 相当で呼ばれる。`/mcpfoo` は呼ばれない。
  - `app.test.ts`: `POST /mcp` が mount に `/api/mcp` として届く。既存の「外部からの `/api/mcp` は 404」テストは無変更で通る。
  - cache-control `mcp.test.ts`: `/mcp` → `PRIVATE_POLICY`、`/mcpfoo` → 対象外。
- [ ] **Step 2:** `pnpm vitest run worker` → FAIL
- [ ] **Step 3:** 実装。`createWorkerApp` で `.route('/', createMCPRoutes(handlerFetch))` を `mcpGuardRoutes` の前に置く。`worker.ts` は `export default { fetch: app.fetch }`(型は `ExportedHandler<Cloudflare.Env>`)にし、DO の re-export は残す。oauth の page / lib / 依存 / `OAUTH_KV` binding を削除し、`pnpm cf:types`(`.dev.vars` を読む。中身を表示しない)で型を再生成。`grep -rn "workers-oauth-provider\|lib/mcp/oauth\|OAUTH_KV\|x-mcp-user-id" src worker package.json wrangler.toml` が 0 件(path-policy テストの `/oauth/authorize` 文字列は「影響しないパス」の例なので残してよい)。
- [ ] **Step 4:** `pnpm vitest run worker src/app/api/mcp packages/payload-cloudflare-access` → PASS、`pnpm typecheck` → 0、`pnpm build` → 成功
- [ ] **Step 5: Commit**(本人承認後)`feat(mcp): drop OAuthProvider and forward /mcp to the Access-verified route`

### Task 5: docs と env 雛形

**Files:**

- Modify: `.dev.vars.example`(`CF_ACCESS_MCP_AUD=` を空で追加)、`docs/cloudflare-access.md`、`docs/mcp-blog-authoring.md`、`.claude/rules/isr-revalidation.md`(`/oauth` 参照箇所)

**Interfaces:** なし(文書)。

- [ ] **Step 1:** `docs/cloudflare-access.md`: 「MCP の同意画面」節を「MCP は `/mcp` パス単位アプリ(Managed OAuth)+ Portal 経由」に置き換え、`/mcp` アプリの設定値(spec §3.1)、`CF_ACCESS_MCP_AUD`、本番有効化の手順、**本番 deploy 凍結**の開始・解除条件、切り戻し(このコードの revert + `OAUTH_KV` binding 復活)を書く。
- [ ] **Step 2:** `docs/mcp-blog-authoring.md`: 接続方法を「Claude Desktop → MCP Portal `mcp.napochaan.com`(server `napochaan` / `napochaanstg`)」に。KV grant 失効手順の節は削除し、Access 側の失効(Access のログアウト / ポリシー)に置き換える。
- [ ] **Step 3:** `pnpm oxfmt --check <変更した md>` → OK
- [ ] **Step 4: Commit**(本人承認後)`docs(mcp): connect through Cloudflare Access and the MCP Portal`

### Task 6: stg の `/mcp` Access アプリ → stg vars → PR → merge(運用)

**Files:** Modify: `wrangler.toml`(`[env.staging.vars]` に `CF_ACCESS_MCP_AUD`)

- [ ] **Step 1:** dry-run: `zero-trust access applications create --body <spec §3.1 の値、domain "stg.napochaan.com/mcp", name "stg.napochaan.com mcp"> --dry-run`。AskUserQuestion で本人確認 → 作成 → `applications get <id>` で `oauth_configuration.enabled === true` と AUD を記録。
- [ ] **Step 2:** `[env.staging.vars] CF_ACCESS_MCP_AUD = "<AUD>"` を追加(コメントに「`/mcp` パス単位アプリ」)。
- [ ] **Step 3:** 1 分ほど反映を待ってから確認(`until` ループ、固定 sleep の連打はしない):
  - `POST https://stg.napochaan.com/mcp`(JSON-RPC initialize)→ `401` + `WWW-Authenticate: Bearer … resource_metadata=".../.well-known/cloudflare-access-protected-resource/mcp"`
  - その resource_metadata が `200`
- [ ] **Step 4:** Task 1–5 + 本 Task をまとめた PR を作成(本文に**本番 deploy 凍結の開始**を明記)。CI 通過後、本人の承認で merge → stg 自動 deploy の成功を確認。

### Task 7: stg 検証(運用 + 本人の dashboard 作業)

- [ ] **Step 1:** 本人: Cloudflare dashboard → MCP Portals → MCP servers → Add: URL `https://stg.napochaan.com/mcp`、ID `napochaanstg`、OAuth Automatic → 「Save and connect server」。自動作成される mcp 種別アプリにポリシー `naporitan`。Portal `napochaan-mcp-portal` に追加(Require user auth ON、`inbox` を残す)。
- [ ] **Step 2:** `cf mcp servers read napochaanstg` で `status`・tools 一覧を確認(ツールが同期されていること)。
- [ ] **Step 3:** 本人: Claude Desktop から Portal 経由で `list_posts`、`get_post`(blog id=3)、id=3 の下書き本文に一文追加 → 元に戻す、`create_upload_url` → upload を実行。
- [ ] **Step 4:** 失敗した場合は Task 3 の warn ログ(`aud` / `type`)を本人に Workers のログで確認してもらい、`aud` が違えば `CF_ACCESS_MCP_AUD` を直す vars だけの PR を出す(本人了承済み)。`type` が `app` 以外なら verify の扱いを見直してから再開。
- [ ] **Step 5:** 外部からの `POST https://stg.napochaan.com/api/mcp` → 404、JWT 無しの `/mcp` → 401(Access)を確認。

### Task 8: 本番の Access 設定 → 本番 vars PR → 本番 deploy → 凍結解除(運用)

- [ ] **Step 1:** 本番の `napochaan.com/admin*`(stg の admin アプリと同じ設定)と `napochaan.com/mcp`(Task 6 と同じ設定)を dry-run → 本人確認 → 作成、AUD を記録。
- [ ] **Step 2:** `[env.production.vars]` に `CF_ACCESS_TEAM_DOMAIN = "napochaan"`、`CF_ACCESS_AUD = "<admin AUD>"`、`CF_ACCESS_MCP_AUD = "<mcp AUD>"`。PR → CI → 本人承認で merge。
- [ ] **Step 3:** 本人承認で本番 deploy(`gh workflow run deploy.yml --ref main`)→ 成功を確認。
- [ ] **Step 4:** 本人: Portal に `napochaan`(`https://napochaan.com/mcp`)を登録・connect。Claude Desktop の既存コネクタ(`napochaan.com/mcp` 直結)を外し、Portal 経由に付け直して Task 7 Step 3 と同じ操作を確認。admin の自動ログインを確認。
- [ ] **Step 5:** 凍結解除を本人に伝え、`docs/cloudflare-access.md` の凍結の記述を「解除済み」に更新(小さな docs PR)。`OAUTH_KV` namespace の削除は別作業として残す。
