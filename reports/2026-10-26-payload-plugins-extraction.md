# payload-cloudflare-access の別 repo 切り出し(2026-10-26)

## 決定事項

| 項目      | 決定                                                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 置き場    | 新 repo `napolab/payload-plugins`(pnpm monorepo、空から開始、MIT)                                                                                                                                                |
| package   | `@napolab/cloudflare-access-core`(payload 非依存)+ `@napolab/payload-cloudflare-access`(peer `payload ^3.91.0`)                                                                                                  |
| 境界      | core = errors(JWT 系 / InvalidAccessTeamDomain)・audiences・team-domain・verify・token・csrf。payload = plugin・strategy・resolve-user・logout-endpoint・password-guard・client/logout-button・payload 側 errors |
| 再 export | しない。www は core の機能を core から直接 import する                                                                                                                                                           |
| build     | Payload 公式 plugin template 方式: swc ファイル単位 + copyfiles + 型出力。`exports` は src、`publishConfig.exports` で dist に差し替え                                                                           |
| release   | changesets + GitHub Actions OIDC trusted publishing(NPM_TOKEN なし)                                                                                                                                              |
| www 切替  | 初回 publish 後に別 PR                                                                                                                                                                                           |

## 初回 publish は手動

npm の trusted publisher は既存 package にしか設定できない。各 package の最初の 1 回は本人が `npm login` → `pnpm publish --access public` で出し、その後 npmjs.com の package 設定で `napolab/payload-plugins` の `release.yml` を trusted publisher に登録する。trusted publishing には npm CLI 11.5.1 以上と GitHub hosted runner が要る。

## www 切替 PR でやること

- `packages/payload-cloudflare-access` を削除し、`package.json` の `workspace:*` を npm 版に置き換える
- import の付け替え(core に移ったもの)
  - `src/app/api/mcp/route.ts`: verify / audiences / team-domain → `@napolab/cloudflare-access-core/*`(resolve-user は payload のまま)。`parseAudiences` は `string` しか受けなくなったので、env が undefined の分岐を呼び出し側に足す
  - `src/app/api/mcp/route.test.ts`: `verify` の import と `vi.mock` の対象
  - `src/lib/mcp/access-auth/index.ts` / `access-auth.test.ts`: verify / errors(`InvalidAccessToken` など JWT 系は core)
  - `worker/access-verify-runtime.test.ts`: `../packages/payload-cloudflare-access/src/verify` という相対 import を `@napolab/cloudflare-access-core/verify` に
- `resolve-user` の `UserStore.create` が `(email)` から `(data: AccessUserCreateData)` に変わった。MCP route が `createPayloadUserStore` / `resolveAccessUser` を使っているので追従する
- 表示名・アイコン同期を使うなら、users に `displayName` / `avatarURL` 等の text field を足して migration し、`cloudflareAccessPlugin({ ..., profile: { map, avatarField } })` を渡す(同期は Access セッションごと: JWT の iat > user.updatedAt の時だけ get-identity)
- `next.config.ts` の `transpilePackages` から外す(dist は JS なので不要。CSS module を node_modules から読めるかは build で確認)
- `vitest.config.ts` の `@payloadcms/ui` alias と `src/__mocks__/payloadcms-ui.tsx` を削除(package 側のテストと一緒に移った)
- `.oxlintrc.json` / vitest include から `packages/*` を外すか確認
- `pnpm-workspace.yaml` は残す(cms/www 分割計画 `docs/superpowers/plans/2026-10-22-cms-split-phase1.md` が `packages/cms` 等で再利用する)
- `importMap.js` の `@napolab/payload-cloudflare-access/client/logout-button#LogoutButton` は不変なので再生成で差分が出ないことを確認
- `docs/cloudflare-access.md` の package 参照先を新 repo に更新
- 確認: `pnpm build`(webpack)で `'use client'` と CSS が効き、stg の /admin でログアウトボタンの見た目と Access 自動ログインが変わらないこと

## www 切替 PR の実施結果(2026-10-26)

npm の `@napolab/cloudflare-access-core@0.0.0` / `@napolab/payload-cloudflare-access@0.0.0` に切り替えた。profile / avatar 同期は採用していない(`cloudflareAccessPlugin({ teamDomain, aud })` のまま。`profile` を渡さない限り strategy は従来と同じ email だけの経路を通り、`admin.avatar` も足されない)。

### やったこと

- `packages/payload-cloudflare-access` を削除(`packages/` も空になったので消えた)。`pnpm-workspace.yaml` は残した。`packages/` が無くても `pnpm install` は通る
- `package.json`: `workspace:*` を外し、`pnpm add -E` で 2 package を `0.0.0` 完全固定(`^` なし)。install 後の `exports` は `publishConfig` 適用済みで `./dist/*` を指す
- import の付け替え(`resolve-user` / `plugin` は payload package のまま)
  - `src/app/api/mcp/route.ts`: `createAccessKeys` → `core/verify`、`parseAudiences` → `core/audiences`、`normalizeTeamDomain` → `core/team-domain`。`readMCPAudiences` に `CF_ACCESS_MCP_AUD === undefined` の分岐を追加
  - `src/app/api/mcp/route.test.ts`: `accessIssuer` と `vi.mock` の対象を `@napolab/cloudflare-access-core/verify` に(route.ts が import する specifier と一致)
  - `src/lib/mcp/access-auth/index.ts`: `verifyAccessJWT` / `AccessIdentity` → `core/verify`、`AccessJWTError` → `core/errors`
  - `src/lib/mcp/access-auth/access-auth.test.ts`: `InvalidAccessToken` / `WrongAccessTokenType` → `core/errors`、`accessIssuer` → `core/verify`。`store.create` の mock 型を `vi.fn<UserStore['create']>()` に(`(email)` → `(data: AccessUserCreateData)` 追従)
  - `worker/routes/mcp-oauth-metadata/index.ts`(チェックリスト外の利用者): 3 つとも core へ。`hasMCPAudiences` に undefined 分岐を追加
  - `worker/access-verify-runtime.test.ts`: 相対 import を `@napolab/cloudflare-access-core/verify` に。workers pool(workerd)でも published dist が解決されて通る
- `next.config.ts`: `transpilePackages` を削除。`next build --webpack` は成功し、node_modules 内の `styles.module.css` もそのままコンパイルされた(`.styles_form__… .nav__log-out{…}` が `.next/static/css` に出る)。client chunk に `LogoutButton`(`nav__log-out` / `authentication:logOut`)が入っていることも確認
- `vitest.config.ts`: `packages/*/src/**` の include と `@payloadcms/ui` alias を削除、`src/__mocks__/payloadcms-ui.tsx` を削除(他に browser テストから `@payloadcms/ui` に届く経路は無い。`gallery-home-badge` は importMap 経由のみ)
- `importMap.js`: `pnpm payload generate:importmap` → 「No new imports found」。差分なし
- `docs/cloudflare-access.md`: package の参照先を npm / `napolab/payload-plugins` に更新(csrf は core 側)。日付付きの plans / specs / reports は当時の記録なので触っていない

### 検証

|                   | before                         | after                          |
| ----------------- | ------------------------------ | ------------------------------ |
| `pnpm test` files | 293 passed + 1 skipped (294)   | 279 passed + 1 skipped (280)   |
| `pnpm test` tests | 2030 passed + 1 skipped (2031) | 1874 passed + 1 skipped (1875) |

差分 14 files / 156 tests は、package と一緒に `napolab/payload-plugins` へ移ったテスト(切替前に `pnpm vitest run packages/` で 14 files / 156 tests を確認)。`pnpm lint` / `pnpm typecheck` / `pnpm build` はいずれも exit 0。

### 未確認

- stg の `/admin` でログアウトボタンの見た目と Access 自動ログインが変わらないこと(実 deploy は未実施)
- OpenNext / wrangler の worker bundle(`opennextjs-cloudflare build`)は未実行。worker 側の解決は vitest workers pool で確認したのみ
