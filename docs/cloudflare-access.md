# Cloudflare Access による Payload admin 自動ログイン runbook

Cloudflare Access を通過した人を、Access が発行した JWT の email で Payload admin にそのままログインさせる。plugin は `packages/payload-cloudflare-access`、設計は `docs/superpowers/specs/2026-10-05-payload-cloudflare-access-design.md`、調査は `reports/2026-10-05-payload-cloudflare-access-research.md` を参照。

stg / prod で `CF_ACCESS_*` が揃ったときだけ有効になる。有効な間は email + password ログインが無効になり、**Access のポリシーが唯一の認可境界**になる（users に role は無い。ポリシーを通った人は全員 admin 権限を持つ）。

全ての `wrangler` / Payload CLI コマンドは account id が必要（無いと exit 13）:

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
```

| env     | host                | wrangler セクション     |
| ------- | ------------------- | ----------------------- |
| staging | `stg.napochaan.com` | `[env.staging.vars]`    |
| prod    | `napochaan.com`     | `[env.production.vars]` |

## 有効化の条件（先に読む）

`src/payload.config.ts` が `cfEnv.CF_ACCESS_TEAM_DOMAIN` と `cfEnv.CF_ACCESS_AUD` を plugin に渡す。plugin は **両方が空でない**ときだけ有効になる（`packages/payload-cloudflare-access/src/plugin/index.ts`）。

| `CF_ACCESS_TEAM_DOMAIN` | `CF_ACCESS_AUD`                          | 結果                                          |
| ----------------------- | ---------------------------------------- | --------------------------------------------- |
| あり                    | あり                                     | 有効（strategy 追加 + password ログイン無効） |
| あり                    | 未設定 / 空 / 空白だけ（`,` だけも含む） | **黙って無効**（password ログインのまま）     |
| 未設定 / 空             | あり                                     | **黙って無効**（password ログインのまま）     |

- `NODE_ENV` では判定しない。片方だけ・空白だけでも例外は出ず、ログにも出ない。有効化したつもりで無効のままになっていないか、検証（手順 4）で必ず確かめる。
- `CF_ACCESS_AUD` は**カンマ区切りで複数指定できる**（各要素は trim され、空要素は捨てられる）。JWT の `aud` がどれか 1 つに一致すれば通る。stg はホスト全体のアプリとパス単位のアプリの 2 つ、prod はパス単位の 1 つ。
- `CF_ACCESS_TEAM_DOMAIN` は team 名だけ。`https://<team>.cloudflareaccess.com` の `<team>` 部分を入れる（`https://` や `.cloudflareaccess.com` は付けない）。
- `admin.components.logout.Button` は env に関わらず常に登録される（importMap に載るものを env で分岐させないため）。env が揃っているときだけ遷移先が `/cdn-cgi/access/logout` になる。

## 1. 事前準備: 本人の user に password を設定する（切り戻し用）

Access で自動作成された user は password を持たない。切り戻したとき（下の「切り戻し」）に入れなくなるので、**Access を有効にする前に**、本人の user に password を設定しておく。

1. 今の password ログインで admin に入る。
2. Users から自分の user を開き、password を設定して保存する。
3. その user の email が、Access の IdP が返す email と**同じ**であることを確認する（strategy は email を小文字化して検索する。違う email だと別 user が自動作成され、password を設定した user には入れない）。

## 2. Zero Trust: IdP とアプリを作る

Zero Trust ダッシュボードで設定する。画面の操作順は Cloudflare 側の更新で変わるので、ここでは何を作るかだけを書く。

1. **IdP**: 本人がログインできる IdP を登録する（One-time PIN でもよい）。ポリシーの email はこの IdP が返す email と一致させる。
2. **self-hosted アプリ**を stg / prod それぞれに作る。パスはワイルドカードで指定する（[Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)）。

   | env  | 追加するパス                                                      |
   | ---- | ----------------------------------------------------------------- |
   | stg  | `stg.napochaan.com/admin*` / `stg.napochaan.com/oauth/authorize*` |
   | prod | `napochaan.com/admin*` / `napochaan.com/oauth/authorize*`         |

3. **ポリシー**: Allow、include は**本人の email のみ**。
4. **stg はホスト全体のアプリが既にある**。それを消さず、パス単位のアプリと共存させる。このとき JWT の `aud` がどちらのアプリのものになるかが request ごとに変わりうるので、AUD は 2 つとも控える（手順 3）。
5. **Cookie Path Attribute は OFF のまま**にする（既定）。ON にすると `/admin*` 以外の path に `CF_Authorization` cookie が届かなくなり、admin の XHR（`/api/*`）が認証できなくなる（[Authorization cookie](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/#cookie-path-attribute)）。

## 3. AUD を控えて wrangler vars に反映する

**値が確定するまで vars を追加しない。** 誤った AUD で有効化すると、strategy がすべての JWT を拒否して誰も admin に入れなくなる（password ログインも無効になっているため）。

1. 各 Access アプリの AUD tag を控える（アプリの Overview / 設定画面に表示される Application Audience (AUD) Tag）。
2. `wrangler.toml` に追加する。top-level の `[vars]`（local）には**置かない**。local では plugin を無効のままにする。

   ```toml
   [env.staging.vars]
   # ...既存の vars...
   CF_ACCESS_TEAM_DOMAIN = "<team>"
   CF_ACCESS_AUD = "<host-wide app の AUD>,<path app の AUD>"   # stg は 2 つ

   [env.production.vars]
   # ...既存の vars...
   CF_ACCESS_TEAM_DOMAIN = "<team>"
   CF_ACCESS_AUD = "<path app の AUD>"                           # prod は 1 つ
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

**項目 3 / 6 / 7 の前提**: stg はホスト全体のアプリが `/api/*` にも `Cf-Access-Jwt-Assertion` header を付ける。strategy は header を優先し、header 由来は CSRF 検査も受けないため、このままでは cookie 経路は検証されない。3 / 6 / 7 は、`stg.napochaan.com/api*` に Bypass アプリを足した場合（下の「stg で cookie 経路を試す」）か prod でだけ意味を持つ。Bypass を採らない場合、この 3 項目は**最初の prod deploy で確認する**（項目 2〜3 の扱いと同じ）。

- [ ] 1. stg にパス単位アプリ（`/admin*`, `/oauth/authorize*`）を作り、AUD を `[env.staging.vars]` に設定して deploy した
- [ ] 2. `/admin` に入ると自動ログインされ、ログインフォームが出ない
- [ ] 3. admin 内の操作（一覧・保存・画像アップロード）が cookie 経路で通る（Server Action による保存も含む）。**stg では `/api*` Bypass 追加後、または prod で確認**（上の前提を参照。Bypass 無しの stg では header 経路で通るだけで、cookie 経路の確認にならない）
- [ ] 4. 未登録 email で入ると user が自動作成される
- [ ] 5. ログアウトで Access のログアウト画面に遷移し、再度 `/admin` に行くと Access のログインを求められる
- [ ] 6. 別 origin からの POST が拒否される（401 / 403）。**stg では `/api*` Bypass 追加後、または prod で確認**。Bypass 無しの stg では `/api/*` に Access が header を付けるので、このリクエストは拒否されず通ってしまう（header 由来は CSRF 検査の対象外。バグではない）。`CF_Authorization` の JWT は、Access ログイン済みブラウザの DevTools → Application → Cookies からコピーする（詳しくは下の「AUD の実測記録」）:

  ```bash
  curl -i -X POST https://stg.napochaan.com/api/users/logout \
    -H 'Origin: https://evil.example' \
    --cookie 'CF_Authorization=<自分の JWT>'
  ```

  cookie 由来の認証は `Origin` が `payload.config.csrf`（`serverURL` を含む）に無いと user を解決しない。header（`Cf-Access-Jwt-Assertion`）由来は Access がエッジで付けたものなので CSRF 検査の対象外。

- [ ] 7. JWT なしの `/api/users/me` が未認証になる（`user: null`）。**stg では `/api*` Bypass 追加後、または prod で確認**。Bypass 無しの stg では、`/api/users/me` は Access のログインへ redirect される（`user: null` の JSON は返らない）
- [ ] 8. MCP の `/oauth/authorize` が Access user で承認でき、claude.ai / Claude Code から MCP が使える（下の「MCP の確認」）
- [ ] 9. どの AUD が JWT に入るかを記録した（下の「AUD の実測記録」）

加えて次も確かめる。

- [ ] **別タブでログアウトした後の挙動**: 2 つのタブで admin を開き、片方で Access からログアウトする。もう片方で admin を操作（保存・一覧の再取得・画面遷移）して、次のどちらになるかを記録する。
  - フォームの無いログイン画面に落ちる（local strategy が無効なので LoginForm は描画されない）
  - Access の再ログインに誘導される（`/admin*` の画面遷移は Access のアプリ範囲内なので、こちらになる想定）
  - XHR（`/api/*` は Access の範囲外）は単に未認証（401 / 403）になる想定。実測値を記録する。

  実測結果（検証時に追記）:

- [ ] **`/oauth/authorize` が iframe に入らない**: 次の 2 つのヘッダーが付いている（`worker/middleware/frame-guard.ts`）。

  ```bash
  curl -sI 'https://stg.napochaan.com/oauth/authorize' | grep -i -E 'content-security-policy|x-frame-options'
  ```

  - `Content-Security-Policy: frame-ancestors 'none'`（上流の CSP が既にあれば、`frame-ancestors` が無いときだけ末尾に足される）
  - `X-Frame-Options: DENY`

  Access 越しだと `curl` は Access のログイン画面に飛ばされる。その場合は、ログイン済みブラウザの DevTools（Network）で応答ヘッダーを見る。

### MCP の確認

Access 経由（user が解決できたとき）の `/oauth/authorize` は、email + password フォームではなく **「{email} として許可する」ボタンだけ**が出る。user は form の値ではなく action 側で headers から取り直している。

- [ ] `/oauth/authorize` で「{email} として許可する」ボタンのみが表示され、password 入力欄が無い
- [ ] 承認後、claude.ai のコネクタ / Claude Code から MCP のツールが使える

### AUD の実測記録

stg にはホスト全体のアプリとパス単位のアプリがある。どのリクエストにどちらの AUD が付くかは Cloudflare 側の挙動で、事前には確定できない。実測して表に残す（値は検証時に埋める）。

測り方は 2 つ。

- `wrangler tail --env staging` で strategy の warn（`Cloudflare Access authentication rejected`）を見る。AUD が `CF_ACCESS_AUD` に無いと、検証失敗として warn が出る（`source` が `header` か `cookie` かも出る）。
- ブラウザの DevTools で JWT（`Cf-Access-Jwt-Assertion` header、または `CF_Authorization` cookie）をコピーして decode し、`aud` を読む。

| リクエスト                           | token の経路（header / cookie） | JWT の `aud`（どのアプリか） |
| ------------------------------------ | ------------------------------- | ---------------------------- |
| `/admin` の画面遷移                  |                                 |                              |
| `/oauth/authorize`                   |                                 |                              |
| admin の XHR（`/api/users/me` など） |                                 |                              |
| 公開ページ（`/`）                    |                                 |                              |
| `/api/media/file/*`（公開画像）      |                                 |                              |

### stg で cookie 経路を試す

prod は `/api/*` が Access アプリの外なので、admin の XHR には `Cf-Access-Jwt-Assertion` header が付かず、`CF_Authorization` cookie で認証される。一方 **stg はホスト全体のアプリが `/api/*` にも header を付ける**ため、cookie 経路が通らない（header が優先されて cookie は使われない）。stg では cookie 経路そのものが検証されない。

prod と同じ挙動を試したいときは、`stg.napochaan.com/api*` に **Bypass** ポリシーのアプリを足す。

- 効果: `/api/*` に header が付かなくなり、prod と同じく cookie 経路で動く。
- 代償: **stg の `/api/*` が Access なしで外から叩けるようになる**（prod と同じ公開範囲）。stg の API が公開されてよいかは本人が決める。採らない場合、cookie 経路は prod の初回 deploy で初めて通ることになるので、prod 側で手順 4 の 2〜3 を最初に確認する。

## 5. prod へ反映

stg の検証が済んだら、手順 3 を `[env.production.vars]` で行って `pnpm deploy:production`。

prod 後の確認:

- [ ] `https://napochaan.com/admin` で Access のログイン → 自動で admin に入る
- [ ] `https://napochaan.com/oauth/authorize` で「{email} として許可する」が出る
- [ ] 公開ページと `/api/media/file/*` が Access なしで見える

## 切り戻し

`wrangler.toml` の `[env.<env>.vars]` から `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` を**消して** deploy する。

- plugin が無効に戻り、strategy が外れて `disableLocalStrategy` も外れる。email + password ログインが復活する。
- **migration は不要。** `disableLocalStrategy: { enableFields: true }` なので email / hash 列は schema に残ったまま（schema は dev と一致している）。
- 自動作成した user は password を持たないので、そのままでは入れない。手順 1 で本人の user に password を設定しておくこと。
- 設定ミスで admin に誰も入れなくなったときも、これで戻る。

## 注意

- **`/api/*` を Access アプリに入れない。** `/api/media` は公開画像の配信（repo 内に約 30 箇所の参照がある）。`/api/mcp` は独自 OAuth。admin の XHR は `CF_Authorization` cookie で認証する。
- **Worker 単位の Access（`ctx.access`）を使わない。** `[assets]` 付き Worker（OpenNext）には `ctx.access` が渡らない。また Worker 単位の Access は WebSocket upgrade を 403 にするので、`CURSOR_ROOM` が動かなくなる（[Workers: Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)）。パス単位の self-hosted アプリ + アプリ内の JWT 検証にしている。
- **Access user が解決できないとき、Access 有効な環境（stg / prod）の `/oauth/authorize` は動かない password フォームを表示する。** 設定ミス（AUD 不一致、JWKS 取得失敗など）で user を解決できないと、`payload.auth` が user を返さず、local dev 用の email + password フォームに落ちる。ただし Access 有効な環境では `payload.login` が Forbidden なので、何を入力しても「メールアドレスまたはパスワードが正しくありません。」になる。この表示が出たら**まず `wrangler tail --env <env>` で strategy の warn を見る**（`Cloudflare Access authentication rejected`: token / CSRF / 検証の失敗、`Cloudflare Access user resolution failed`: users の検索・作成の失敗）。
- **Access の env が設定されているのに対象の auth collection が無いと、config の build 時に `AccessTargetCollectionNotFound` で落ちる。** 黙って無効にすると password ログインが残る（fail-open）ので、これは意図した fail-loud。対象は `collection` option → `admin.user` → 最初の auth collection の順で決まる。
- **ログアウトは `/cdn-cgi/access/logout`。** Access のセッション cookie を消す。Payload 側のセッション（`local-jwt`）はそもそも無いので、これだけで完結する。全 Access アプリのセッションが失効する（アプリ単位のログアウトは不可）。
- **`Cf-Access-Authenticated-User-Email` ヘッダーは信用しない。** 実装も読んでいない。Access を通らない経路では誰でも付けられる。JWT の署名・`iss`・`aud` を検証した email だけを使う。
- `workers_dev` / `preview_urls` は全 env で false。Access を迂回する入口は無い。将来有効にするとその hostname は Access アプリの外になる。
- セッションはリクエストごと。Payload の JWT cookie は発行されず、admin の各リクエストで Access JWT の検証と users の検索が走る。Access の `exp` は admin に伝わらないので、期限切れ警告モーダルは出ない。
- MCP の Access 化（Managed OAuth / MCP Server Portal への移行）は**別サブプロジェクト**。調査は `reports/2026-10-05-mcp-portal-access-research.md`。この runbook の範囲では、MCP は従来の OAuth のまま、同意画面だけ Access user で通る。

## ローカル開発

`.dev.vars` の `CF_ACCESS_TEAM_DOMAIN=` / `CF_ACCESS_AUD=` は**空のまま**にする。plugin は無効で、従来どおり email + password ログイン（と `autoLogin.prefillOnly`）が使える。`/oauth/authorize` も password フォームのまま。

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
