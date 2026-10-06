# Security audit — PR napolab/www.napochaan.com#53 (Cloudflare Access 自動ログイン)

## 1. 実施条件

| 項目         | 内容                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| プロファイル | standard（scoped run・**部分的な監査**）                                                                                                                                                                                                                |
| スコープ     | `main...HEAD`（8e5b07c）＋ 作業ツリーの未コミット差分（コードレビュー指摘 1〜4 の修正）。範囲内パス 51 件は `scope-paths.txt`                                                                                                                           |
| 予算         | 指定なし。投入数はハンター 14、カバレッジ批評 5（post-wave 4 ＋ 独立した final-clean 1）、Phase 3 候補検証 4、Phase 5 最終記録検証 4                                                                                                                    |
| 実行方針     | ソースとローカル観察に限定。ただし、このホスト（macOS）はメモリ・総ディスク・サンドボックス単位プロセス数の上限を強制できない。そのため対象コードの実行は全面禁止とし、全チェックをソースの読解のみで行った。デプロイ済み環境には一切アクセスしていない |
| 過去 run     | なし（初回。持ち越し・除外なし）                                                                                                                                                                                                                        |
| 範囲外       | ① `/oauth/register` の公開 Dynamic Client Registration ② OAuthProvider の token / PKCE 設定。どちらも PR 以前からある挙動で、この PR は変えていない。次回、worker 全体の run で扱う                                                                     |

## 2. セキュリティ状況の要約

confirmed（確定）の脆弱性は **0 件** です。

現状、`CF_ACCESS_TEAM_DOMAIN` と `CF_ACCESS_AUD` はコミット済みのどの環境にも設定されていません。このためプラグインは無効で、いま本番・stg に開いている穴はありません。

JWT 検証そのもの（署名、iss、aud、type、email、ヘッダー/cookie の取り出し）とユーザー解決の順序は、すべて堅牢と判定しました。

残ったのは **needs_validation 4 件** です。どれも「runbook どおりに有効化する（または切り戻す）と開く」種類のもので、成立の可否は Zero Trust の設定やブラウザの挙動といった、ソースからは見えない事実に依存します。うち 2 件（N1・N4）はソースを直すことで、デプロイ時の事実に関係なく閉じられます。

## 3. Confirmed findings

なし。

## 4. NEEDS VALIDATION

深刻度は付けていません。詳細なトレースと解消手順は `NEEDS-VALIDATION.md` にあります。

| #   | タイトル                                                                                                                                                                                      | トレース                                                                                                                                    | 決め手になる未確認事項                                                                                       | ローカルの次の一手                                                                                                                                                                            | オーナーが観測して確認すること                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| N1  | Access が有効な間に REST で書き込まれたパスワードが、Access の取り消し後も残り、切り戻し後に有効なログイン手段になる                                                                          | `plugin/index.ts:53`（`enableFields`）→ `payload/.../utilities/update.js:26,30,231` → `db.updateOne`                                        | 本人以外の書き込み者が Access に入れるか。切り戻しを行うか                                                   | `cloudflareAccessPlugin` を通した設定で `payload.update({data:{password}})` が成功することを確認する。続けてプラグイン無しで再初期化し、そのパスワードで `payload.login` が通ることを確かめる | stg でダミーの ID を一時的に許可し、`PATCH /api/users/<id>` を送る。D1 で hash が入ったかを確認する                           |
| N2  | stg の `CF_ACCESS_AUD` に stg 全体用アプリの AUD を並べると、そのアプリのポリシーが stg `/api/*` の admin 境界になる                                                                          | `/api/[...slug]` → `header-source` → `verify/index.ts:40`（`audience:[...aud]`）→ `resolve-user/index.ts:41`（自動作成）→ `user !== null`   | stg 全体用アプリのポリシーが本人のみかどうか                                                                 | ローカルの JWKS と AUD 2 つで `authenticateAccess` を呼ぶ。別アドレス・host-wide AUD のトークンで user が作られることを確認する                                                               | Zero Trust で stg 全体用アプリの全ポリシー（include / require、IdP、OTP）を読み取りだけで確認する                             |
| N3  | stg `/api*` の Bypass アプリ（任意の設定）が切り戻しで消されず、stg のパスワードログインがインターネットから届くようになる（dev seed の資格情報が残っている可能性あり）                       | `docs/cloudflare-access.md:183-186` → `:201-206`（切り戻し）→ `plugin/index.ts:82` → `login.js:31` → `seed/import.ts:56`                    | Bypass アプリがあるか。stg の users にパスワード付きユーザー（`dev@napochaan.com` / `password`）がいるか     | プラグイン無効・dummy の seed でローカルの worker に `POST /api/users/login` を送る（サンドボックスが必要）                                                                                   | Zero Trust のアプリ一覧を見る。`wrangler d1 execute ... "SELECT email, hash IS NOT NULL FROM users"` を読み取り専用で実行する |
| N4  | ヘッダーに対する CSRF 規則が、外部サイトからのトップレベル GET を通す。そのため admin の GET 描画中に起きる書き込み（空の autosave 下書き作成、一覧の表示設定の上書き）を外部から引き起こせる | `initReq.js:42` → `strategy/index.ts:42` → `csrf/index.ts:33-35` → `Document/index.js:249`（GET 中の `payload.create`）／`List/index.js:70` | Access が cross-site のトップレベル GET に `Cf-Access-Jwt-Assertion` を付けるか。cookie の実際の SameSite 値 | 単体の `authenticateAccess` に cross-site の document ヘッダーを与えて user が返ることを確認し、`extractJWT` では null になることと比較する                                                   | stg で有効化したあと、別オリジンのページからリンクを踏む。空の下書きができるか、一覧の表示設定が変わるかを見る                |

## 5. 対応の推奨（優先順）

1. **N1**：`withAccessAuth` に `hooks.beforeOperation` を追加し、update / create で `data.password` が含まれていたら reject する。回帰テストも付ける。`beforeChange` で取り除く方法では間に合わない（password はそれより前に取り込まれる）。あわせて runbook の切り戻し手順に「本人以外の hash / salt を消す」手順を足す。
2. **N4**：`isAllowedHeaderRequest` が cross-site の document を許す条件を絞る。対象パスを `/admin`（完全一致）と `/oauth/authorize` に限るか、`Sec-Fetch-User: ?1` を必須にする。
3. **N2**：stg の `CF_ACCESS_AUD` にはパス単位アプリの AUD だけを入れる。または stg 全体用アプリのポリシーを本人のメールアドレスのみにする。恒久策としては、アプリ内にメールの許可リスト（例：`CF_ACCESS_ALLOWED_EMAILS`）を設けることを検討する。
4. **N3**：runbook の切り戻しの最初の手順に「stg `/api*` の Bypass アプリを削除する」を追加する。「prod と同じ公開範囲」という記述に「stg に seed 由来のユーザーがいないこと」という前提条件を付ける。staging の seed 投入は `seed:import:prod` に寄せる。

## 6. ハードニング（findings ではない）

- `verify/index.ts`：`jwtVerify` に `requiredClaims: ['exp']` を渡す。jose 6 は exp が存在するときしか検査しない。
- `strategy/index.ts` の `logFailure`：jose のエラーにはデコード済みの claim（email など）が含まれる。ログには `name` / `code` だけを出す。
- メールの正規化：`resolveAccessUser` は toLowerCase だけ、Payload は lower + trim。現状は fail-closed だが、同じ処理にそろえる。
- プラグインを有効にすると `disableLocalStrategy` がオブジェクト形式になり、`validateSearchParams` が `where[hash]` / `where[salt]` を弾かなくなる。hash / salt に field 単位の `read: () => false` を付けることを検討する。
- `docs/cloudflare-access.md:215,220`：「Access からログアウトすればセッションは終わる」「Payload の JWT cookie は発行されない」の 2 点は不正確。実際は `refresh-token` が使われない `payload-token` を発行する。draft mode も Access ログアウト後まで残る。
- MCP の付与（OAUTH_KV）は、有効化・切り戻し・ログアウトのどれでも失効しない（最大 30 日）。runbook に明記し、失効手順へのリンクを載せる。同意画面に redirect_uri のホストを表示する。scope を `['blog']` に絞り込む。worker で `allowPlainPKCE: false` を設定する。
- `/admin` のフレーミング制限は `'self'` / SAMEORIGIN になっているが、`'none'` / DENY で問題なく動く。
- `resolveEnabledOptions`：環境変数が片方だけ設定されていると、何も言わずに無効化される。warn ログを出す。
- `packages/payload-cloudflare-access/package.json`：テストが使う vitest 系を devDependencies に宣言する（hoist に依存しない）。

良い点としては次を確認しました。

- 検証 → 解決の順序が neverthrow で強制され、失敗はすべて `user: null` になる。
- サービストークン（email なし）を拒否している。
- 自動作成時に渡すのは `{email}` だけ。
- 同意の server action はヘッダーからユーザーを導き直しており、Next の Origin チェックと allowlist の二重で守られている。
- frame-guard がパスごとのポリシー表で実装されている。
- lockfile と `--frozen-lockfile` で依存が固定されている。

## 7. カバレッジ

| 状態                                          | 単位数 |
| --------------------------------------------- | ------ |
| covered                                       | 16     |
| candidate（→ 4 件の needs_validation に集約） | 5      |
| blocked                                       | 0      |
| deferred                                      | 0      |
| out_of_scope                                  | 2      |
| 合計                                          | 23     |

- 重複の統合：`deployment/cf-access-aud-list:stg-host-wide-app-policy-becomes-admin-boundary` は N2 と同じ根本原因として統合した。
- final-clean 批評（c05）は、追加すべき単位も再割り当てもなしとして停止した。
- Phase 3 の検証では 4 件とも needs_validation を維持した。N2 については、ハンターが主張した「`/admin` と同意画面にも届く」を取り下げた（本人限定のパス単位アプリが優先されるため）。
- Phase 5 の最終検証では 3 件が記録どおりと確認され、N4 だけ文言を修正した（revalidate フックは下書きでは発火しない、という点の補足）。実質的な変更ではないので、そのまま適用した。
- `findings.json` と `coverage-ledger.json` はどちらも検証スクリプトを通過している。
