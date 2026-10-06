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
| team 名にならない値     | あり                                     | config の評価時に `InvalidAccessTeamDomain`   |

- `NODE_ENV` では判定しない。片方だけ・空白だけでも例外は出ず、ログにも出ない（例外は、両方そろって有効化するときに `CF_ACCESS_TEAM_DOMAIN` が team 名にならない場合だけ。下記）。有効化したつもりで無効のままになっていないか、検証（手順 4）で必ず確かめる。
- `CF_ACCESS_AUD` は**カンマ区切りで複数指定できる**（各要素は trim され、空要素は捨てられる）。JWT の `aud` がどれか 1 つに一致すれば通る。stg はホスト全体のアプリとパス単位のアプリの 2 つ、prod はパス単位の 1 つ。
- `CF_ACCESS_TEAM_DOMAIN` は team 名だけ（`napolab` のように、`https://<team>.cloudflareaccess.com` の `<team>` 部分）を入れる。よくある書き方は team 名に正規化される（大文字、`https://` / `http://`、末尾の `/`、`.cloudflareaccess.com` 付き。`https://napolab.cloudflareaccess.com/` も `napolab` になる）。正規化しても `^[a-z0-9-]+$` にならない値（空白入り、別ドメインなど）は、`CF_ACCESS_AUD` もそろって有効化するときに Payload config の評価で `InvalidAccessTeamDomain` を投げる。`CF_ACCESS_AUD` が空の間は検証せず黙って無効のまま（team 名は Access アプリを作って AUD が出る前に入れるのが普通なので、その間の typo でサイトを落とさない）。有効化のときに落ちると Payload を使う全ページが 500 になる。`next build` は `CF_ACCESS_*` 無しで config を評価するので build では気づけない。deploy workflow の `deploy:database:check:<env>`（`CLOUDFLARE_ENV` 付きの Payload CLI）が deploy 前に config を評価するので、そこで気づける**かもしれない**が、その step が job を失敗させるかは確かめていない（Payload の bin は失敗しても exit 0 のことがある）。黙って通すと issuer / JWKS URL が食い違い、password ログインも無効なので誰も admin に入れなくなるため、意図して fail-loud にしている。
- **deploy 前に必ず team 名を確かめる**。上のとおり deploy 前に気づけるとは限らず、有効化された経路（JWT の検証）も deploy 前にどこでも実行されないので、team の certs URL が 200 を返すことを先に手で確かめる（存在しない team は 404 になる）:

  ```bash
  curl -s -o /dev/null -w '%{http_code}\n' https://<team>.cloudflareaccess.com/cdn-cgi/access/certs   # 200 になること
  ```

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
5. **Cookie の SameSite を Lax にする**（各アプリの設定 → Cookie settings。多層防御）。Lax でもトップレベルの GET 遷移には cookie が付くので、Access ログイン後の redirect と claude.ai から開く `/oauth/authorize` のポップアップは動く。クロスサイトの POST やサブリソース（img / iframe / fetch）には cookie が付かなくなる。strategy 自体も header 由来・cookie 由来ともクロスサイト要求を拒否するので、これに依存はしない。
6. **Cookie Path Attribute は OFF のまま**にする（既定）。ON にすると `/admin*` 以外の path に `CF_Authorization` cookie が届かなくなり、admin の XHR（`/api/*`）が認証できなくなる（[Authorization cookie](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/#cookie-path-attribute)）。

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

**項目 3 / 7 / 7a の前提**: stg はホスト全体のアプリが `/api/*` にも `Cf-Access-Jwt-Assertion` header を付ける。strategy は header を優先するため、このままでは cookie 経路は検証されない。3 / 7 / 7a は、`stg.napochaan.com/api*` に Bypass アプリを足した場合（下の「stg で cookie 経路を試す」）か prod でだけ意味を持つ。Bypass を採らない場合、これらは**最初の prod deploy で確認する**（下の「stg で cookie 経路を試す」の末尾、および「5. prod へ反映」の引き継ぎ項目を参照）。項目 6（別 origin の probe）は header 由来も CSRF 検査を受けるので、Bypass 無しの stg でも `{"user":null}` を期待値として確認できる（header 由来の判定の確認。cookie 由来の判定は Bypass 追加後か prod で確認する）。

- [ ] 1. stg にパス単位アプリ（`/admin*`, `/oauth/authorize*`）を作り、AUD を `[env.staging.vars]` に設定して deploy した
- [ ] 2. `/admin` に入ると自動ログインされ、ログインフォームが出ない
- [ ] 3. admin 内の操作（一覧・保存・画像アップロード）が cookie 経路で通る（Server Action による保存も含む）。**stg では `/api*` Bypass 追加後、または prod で確認**（上の前提を参照。Bypass 無しの stg では header 経路で通るだけで、cookie 経路の確認にならない）
- [ ] 4. 未登録 email で入ると user が自動作成される
- [ ] 5. ログアウトで Access のログアウト画面に遷移し、再度 `/admin` に行くと Access のログインを求められる
- [ ] 6. 別 origin からのリクエストで認証が解決されない（`user: null`）。Bypass 無しの stg では `/api/*` に Access が header を付けるので header 由来の判定、Bypass 有りの stg と prod では cookie 由来の判定を通るが、どちらも `Origin` が `payload.config.csrf` に無ければ user を解決しない。`CF_Authorization` の JWT は、Access ログイン済みブラウザの DevTools → Application → Cookies からコピーする（詳しくは下の「AUD の実測記録」）。probe には `GET /api/users/me` を使う（`POST /api/users/logout` は未認証だと 400 `No User` を返すだけで、CSRF で弾かれたのか判別できず誤解を招く）:

  ```bash
  curl -i https://stg.napochaan.com/api/users/me \
    -H 'Origin: https://evil.example' \
    --cookie 'CF_Authorization=<自分の JWT>'
  ```

  期待値は `{"user":null}`（`Origin` が `payload.config.csrf` に無いので、header 由来でも cookie 由来でも user を解決しない）。`wrangler tail` には `Cloudflare Access authentication rejected` の warn が `CrossSiteAccessRequest` と `source`（`header` / `cookie`）付きで出る。比較用に、`payload.config.csrf` に含まれるサイト自身の origin（stg なら `https://stg.napochaan.com`）を `Origin` に付けると `user` が返る。

  `Origin` が無いときの扱いは経路で違う（`packages/payload-cloudflare-access/src/csrf/index.ts`）。
  - cookie 由来（Bypass 有りの stg / prod の `/api/*`）: `Sec-Fetch-Site` が `same-origin` / `same-site` / `none` でなければ拒否。`Origin` も `Sec-Fetch-Site` も無い curl も拒否される。
  - header 由来（Bypass 無しの stg、`/admin*`、`/oauth/authorize*`）: `Sec-Fetch-Site: cross-site` かつ `Sec-Fetch-Dest` が `document` 以外（img / iframe / fetch など）だけを拒否する。Access ログイン後の着地や claude.ai からのポップアップは Origin の無いクロスサイトのトップレベル GET なので、これを通すため。fetch metadata の無い curl は通る（`user` が返る）。サブリソースの拒否を見るなら `-H 'Sec-Fetch-Site: cross-site' -H 'Sec-Fetch-Dest: image'` を付けて `{"user":null}` になることを確かめる。

- [ ] 7. JWT なしの `/api/users/me` が未認証になる（`user: null`）。**stg では `/api*` Bypass 追加後、または prod で確認**。Bypass 無しの stg では、`/api/users/me` は Access のログインへ redirect される（`user: null` の JSON は返らない）
- [ ] 7a. Live Preview と下書きプレビュー（`/next/preview`）が、Access ログイン済みの編集者で表示できる（`CF_Authorization` cookie 経路を通る）。**stg では `/api*` Bypass 追加後、または prod で確認**（Bypass 無しの stg では header 経路で通るだけで、cookie 経路の確認にならない）
- [ ] 8. MCP の `/oauth/authorize` が Access user で承認でき、claude.ai / Claude Code から MCP が使える（下の「MCP の確認」）
- [ ] 9. どの AUD が JWT に入るかを記録した（下の「AUD の実測記録」）

加えて次も確かめる。

- [ ] **別タブでログアウトした後の挙動**: 2 つのタブで admin を開き、片方で Access からログアウトする。もう片方で admin を操作（保存・一覧の再取得・画面遷移）して、次のどちらになるかを記録する。
  - フォームの無いログイン画面に落ちる（local strategy が無効なので LoginForm は描画されない）
  - Access の再ログインに誘導される（`/admin*` の画面遷移は Access のアプリ範囲内なので、こちらになる想定）
  - XHR（`/api/*` は Access の範囲外）は単に未認証（401 / 403）になる想定。実測値を記録する。

  実測結果（検証時に追記）:

- [ ] **`/oauth/authorize` と `/admin*` が別 origin の iframe に入らない**: 次のヘッダーが付いている（`worker/middleware/frame-guard.ts`）。

  ```bash
  curl -sI 'https://stg.napochaan.com/oauth/authorize' | grep -i -E 'content-security-policy|x-frame-options'
  curl -sI 'https://stg.napochaan.com/admin' | grep -i -E 'content-security-policy|x-frame-options'
  ```

  | パス                                          | `Content-Security-Policy` | `X-Frame-Options` |
  | --------------------------------------------- | ------------------------- | ----------------- |
  | `/oauth/authorize`（配下も）                  | `frame-ancestors 'none'`  | `DENY`            |
  | `/admin`（配下も。`/administrator` は対象外） | `frame-ancestors 'self'`  | `SAMEORIGIN`      |

  上流の CSP が既にあれば、`frame-ancestors` が無いときだけ末尾に足される。`/admin` を `'self'` にしているのは、Access が有効だと admin がクロスサイトの iframe の中でも認証済みで描画されるため（Live Preview が iframe に入れるのはサイト側の `/next/preview` で、admin 自身ではない）。

  Access 越しだと `curl` は Access のログイン画面に飛ばされる。その場合は、ログイン済みブラウザの DevTools（Network）で応答ヘッダーを見る。

### MCP の確認

Access 経由（cloudflare-access strategy で user が解決できたとき）の `/oauth/authorize` は、email + password フォームではなく **「{email} として許可する」ボタンだけ**が出る。user は form の値ではなく action 側で headers から取り直している。ボタンだけのフォームは **Access で認証された user（`_strategy === 'cloudflare-access'`）に限る**。Access が無効な環境で password ログインのセッション（`local-jwt`）を持っていても password フォームが出て、action もその user では承認しない。

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
- 代償: **stg の `/api/*` が Access なしで外から叩けるようになる**（prod と同じ公開範囲）。stg の API が公開されてよいかは本人が決める。採らない場合、cookie 経路は prod の初回 deploy で初めて通ることになるので、prod 側で手順 4 の項目 3 / 6 / 7 と Live Preview の項目（7a）を最初に確認する（「5. prod へ反映」に引き継ぎ項目がある）。

## 5. prod へ反映

stg の検証が済んだら、手順 3 を `[env.production.vars]` で行って `pnpm deploy:production`。

prod 後の確認:

- [ ] `https://napochaan.com/admin` で Access のログイン → 自動で admin に入る
- [ ] `https://napochaan.com/oauth/authorize` で「{email} として許可する」が出る
- [ ] 公開ページと `/api/media/file/*` が Access なしで見える
- [ ] stg で `/api*` Bypass アプリを採らなかった場合は、cookie 経路の確認を引き継ぐ: 手順 4 の項目 3（admin 内の操作）/ 6（別 origin の probe）/ 7（JWT なしの `/api/users/me`）/ 7a（Live Preview と `/next/preview`）

## 切り戻し

`wrangler.toml` の `[env.<env>.vars]` から `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` を**消して** deploy する。

- plugin が無効に戻り、strategy が外れて `disableLocalStrategy` も外れる。email + password ログインが復活する。
- **migration は不要。** `disableLocalStrategy: { enableFields: true }` なので email / hash 列は schema に残ったまま（schema は dev と一致している）。
- 自動作成した user は password を持たないので、そのままでは入れない。手順 1 で本人の user に password を設定しておくこと。
- 設定ミスで admin に誰も入れなくなったときも、これで戻る。
- **注意（CLI 経由で作った user）**: `CF_ACCESS_*` を wrangler の env に入れた後は、その env を向けた Payload CLI（`CLOUDFLARE_ENV=staging|production pnpm payload …`、seed スクリプトなど）も plugin を有効の状態で読み込み、local strategy が無効になる。この経路で作った user も password を持たない。通常の運用では問題にならず、切り戻しのときだけ効く（手順 1 の password 事前設定は、Access 有効化前に済ませる）。

## 注意

- **`/api/*` を Access アプリに入れない。** `/api/media` は公開画像の配信（repo 内に約 30 箇所の参照がある）。`/api/mcp` は独自 OAuth。admin の XHR は `CF_Authorization` cookie で認証する。
- **Worker 単位の Access（`ctx.access`）を使わない。** `[assets]` 付き Worker（OpenNext）には `ctx.access` が渡らない。また Worker 単位の Access は WebSocket upgrade を 403 にするので、`CURSOR_ROOM` が動かなくなる（[Workers: Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)）。パス単位の self-hosted アプリ + アプリ内の JWT 検証にしている。
- **Access user が解決できないとき、Access 有効な環境（stg / prod）の `/oauth/authorize` は動かない password フォームを表示する。** 設定ミス（AUD 不一致、JWKS 取得失敗など）で user を解決できないと、`payload.auth` が user を返さず、local dev 用の email + password フォームに落ちる。ただし Access 有効な環境では `payload.login` が Forbidden なので、何を入力しても「メールアドレスまたはパスワードが正しくありません。」になる。この表示が出たら**まず `wrangler tail --env <env>` で strategy の warn を見る**（`Cloudflare Access authentication rejected`: token / CSRF / 検証の失敗、`Cloudflare Access user resolution failed`: users の検索・作成の失敗）。
- **Access の env が設定されているのに対象の auth collection が無いと、config の build 時に `AccessTargetCollectionNotFound` で落ちる。** 黙って無効にすると password ログインが残る（fail-open）ので、これは意図した fail-loud。対象は `collection` option → `admin.user` → 最初の auth collection の順で決まる。
- **ログアウトは `/cdn-cgi/access/logout`。** Access のセッション cookie を消す。Payload 側のセッション（`local-jwt`）はそもそも無いので、これだけで完結する。全 Access アプリのセッションが失効する（アプリ単位のログアウトは不可）。
- **クロスサイトのトップレベル GET は通す（残るリスク）。** Access ログイン後の着地と claude.ai のポップアップを通すため、header 由来の Origin 無しのトップレベル遷移は CSRF 検査で拒否しない。そのため、別サイトから `/admin/collections/<autosave を持つ collection>/create` へのリンクを踏まされると、空の下書きが 1 件できる（Payload の Document view は GET で下書きを作る）。データの漏洩・改変は無いので許容している。見覚えの無い空の下書きがあれば消してよい。
  - 同じ種類の残りとして、fetch metadata を送らない古いブラウザ（Safari 16.4 未満など）は、クロスサイトの `<img>` などの GET を `Origin` も `Sec-Fetch-*` も無しで送るので、拒否されずに通る（判定上は curl と区別できない）。GET だけなので影響は上と同じ範囲に留まる。POST などは `Origin` が付くので拒否される。
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
