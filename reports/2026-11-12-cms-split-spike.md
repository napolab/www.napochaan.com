# cms-split 前提検証 spike の結果

- 日付: 2026-11-12
- 対象: 設計書 `docs/superpowers/specs/2026-11-12-cms-split-design.md` の §6.3、§9、§11
- 方法: 使い捨ての Worker `napochaan-web-spike` と `napochaan-cms-spike`、R2 バケット `napochaan-spike` を napochaan アカウントに deploy して検証した。検証後に Worker とバケットは削除した。
- 証跡（コマンドと出力）: `.superpowers/sdd/2026-11-12-cms-split/task-0-report.md`

## 結論

| # | 項目（brief の Step） | 結果 | 採用する方式 |
|---|---|---|---|
| 1 | 最小構成の 2 Worker を作る（web: cache、IMAGES、CMS binding / cms: R2、WEB binding） | **成立** | `cf deploy` で deploy し、すべての binding が動いた |
| 2 | cms ↔ web の循環 Service Binding を deploy できるか | **成立**（順序が必要） | 実際に試したのは 3 段階の順。cms（WEB なし）→ web → cms（WEB 付き）。stg と本番では cms（WEB 付き）→ web で足りる見込み（推論） |
| 3 | web の default entrypoint に置いた `purge()` RPC で、その entrypoint のキャッシュを消せるか | **成立** | default entrypoint 上の RPC `purge()` |
| 4 | R2 の body を RPC で受け取り、そのまま `IMAGES.input()` に渡せるか | **成立** | そのまま渡す |
| 5 | `next dev` から別プロセスの `wrangler dev`（cms）の named entrypoint を RPC で呼べるか | **成立** | 先に `wrangler dev`（cms）、次に `next dev`（web）。dev registry は worktree ごとに固定する |
| 6 | Access のホスト全体 app（Managed OAuth）とパス単位の Bypass app を同じホストで併用できるか | **成立** | 作成した 2 つの app をそのまま使う |

クリーンアップは完了した。spike の Worker、バケット、`spikes/` を削除し、Access app 2 件は残している。

TTL フォールバック（60 秒 + SWR）は不要の見込み。OpenNext の handler に委譲した状態では、まだ確認していない。

## 1. purge の届く範囲

**確かめたこと**

- web の default export を `class Web extends WorkerEntrypoint` にした。`fetch()` は `/` に `Cache-Control: public, max-age=3600` を付けて返し、`purge()` は `this.ctx.cache.purge({ purgeEverything: true })` を呼ぶ。
- 比較用に、named entrypoint `Other` にも同じ `purge()` を置いた。

**結果**（キャッシュの状態は `cf-cache-status` で見た）

```
MISS → HIT → HIT                                   （値 A）
cms → WEB_OTHER.purge()  {"success":true}  → HIT のまま（値 A）      ← named entrypoint からでは消えない
cms → WEB.purge()        {"success":true}  → MISS（値 B）→ HIT        ← default entrypoint の RPC で消える（2 回試して 2 回とも同じ）
cms → WEB.fetch(POST /__purge + token)     → MISS（値 C）→ HIT        ← internal fetch でも消える
```

**判断**

- default entrypoint クラスの RPC メソッドの中の `ctx.cache` は、default entrypoint のキャッシュを指していた。設計の第一案が成り立つ。
- internal fetch 方式も動いたが、token を管理する必要が出るので使わない。

**実装時の注意**

- ローカルの `wrangler dev` では、`cache.enabled` を指定しても `ctx.cache` が `undefined` になる。キャッシュもされない（`next dev` では未確認）。`ctx.cache === undefined` なら何もしないガードが要る（既存の `purge-workers-cache.ts` と同じ）。
- 検証した `fetch` は単純なものだった。OpenNext の handler に委譲したクラスでも同じように動くかは、実装の Phase で stg 上で確かめる。

## 2. 循環 binding の deploy 順

**結果**

```
何もない状態で cms（WEB あり）を deploy  → [10143] Service binding 'WEB' references Worker ... which was not found
何もない状態で web（CMS あり）を deploy  → [10143] ... 'napochaan-cms-spike' which was not found
cms（WEB なし）→ web → cms（WEB あり）  → すべて成功。そのあと web を再 deploy しても成功
Worker の削除                            → どちらも [10142] still referenced で拒否された。cms を --delete-with-references で消し、そのあと web を消した
```

**判断**

- binding 先の Worker が存在しないと deploy できない。
- stg と本番では、web は既存の Worker 名を引き継ぐので、binding 先は最初から存在する。したがって、初回から **cms（WEB 付き）→ web** の順で deploy できる。
  - 新しい web が deploy されるまでのあいだ、cms からの `purge()` 呼び出しは旧 Worker に対して失敗する。best-effort（`waitUntil`）なので影響はない（推論で、未検証）。
- ゼロから環境を作る場合は、3 段階の deploy が必要になる。
- rollback や片付けで Worker を消すときは `--delete-with-references` が必要になる。

なお、deploy は `cf deploy`（ビルドは Wrangler 4.161 に任せる）で行った。上のエラーは Cloudflare API が返したものなので、`wrangler deploy` でも同じになる見込み。

## 3. R2 body → RPC → IMAGES

**結果**（deploy 環境）

- `env.CMS.media('a.png')` の戻り値は `ReadableStream` だった。
- 次の 3 つの方式すべてで、200x150 の WebP（RIFF/WEBP を確認）が返った。
  - そのまま渡す
  - `new Response(body).body` を経由する
  - `arrayBuffer()` を経由する

**判断**

`env.IMAGES.input(await env.CMS.media(key))` で直接渡す。バッファに読み込む必要はない。

**注意**

`next dev`（getPlatformProxy）では、`output().response()` がプロキシの `_Response` を返す。Next の route handler はそれを Response と認めず、500 になる。`new Response(await res.arrayBuffer(), { headers })` のように包み直して返せば、dev でも本番でも動く。

## 4. ローカル開発

**確かめた構成**

- cms: `wrangler dev`（:8791、ローカル R2 に a.png を入れた）
- web: 次の 2 通り
  - `wrangler dev`（:8792）
  - 最小構成の Next 16.4.2 アプリを `next dev`（:8793、`initOpenNextCloudflareForDev`）で起動
- 両方とも `WRANGLER_REGISTRY_PATH` と `MINIFLARE_REGISTRY_PATH` に、spike 内の同じディレクトリを指定した。

**結果**

- `wrangler dev` 同士: web → cms の RPC で `media()`、IMAGES の変換、cms → web の RPC `purge()` がすべて呼べた。ただし `ctx.cache` は `undefined` だった。`cache.enabled=true` を指定した別の Worker でも同じだった。
- `next dev` → `wrangler dev`: named entrypoint `CMS` の RPC で、`ReadableStream` が受け取れた。PNG のバイトもそのまま届いた。IMAGES も、レスポンスを包み直せば動いた。
- registry は spike 内のディレクトリにだけ書かれた。グローバルの `~/.config/.wrangler/registry` は汚れていない。

**手順（採用案）**

1. worktree ごとに `WRANGLER_REGISTRY_PATH` と `MINIFLARE_REGISTRY_PATH` を、同じ worktree ローカルのパスに設定する（mise の env などで設定する）。
2. `apps/cms` で `wrangler dev` を起動する。
3. `apps/web` で `next dev` を起動する。

`opennextjs-cloudflare preview` を使う必要はない。

## 5. Access

**作成したもの**（本番運用にそのまま使う）

| app | id | AUD |
|---|---|---|
| `cms-stg.napochaan.com`（ホスト全体、Managed OAuth ON） | `d3d96d5f-8053-4ec4-acd0-855e99e12275` | `c582e273d62eadb31e060ca80660d5dbcc85b29076257bf71c5c8e37aded178e` |
| `cms-stg.napochaan.com/api/media-upload`（Bypass、everyone） | `a1a923cc-16cb-411e-8e5c-75a645dcc299` | `27823ee1bd5501ac8c0d0bbadb9e4559717465515c6597f54d9bb6d08f4da7b4` |

- ホスト全体 app のポリシーは、stg の app と同じ再利用ポリシー `naporitan`（自分のメールアドレスのみ）を参照している。
- IdP、セッション、OAuth の設定（DCR の callback URL を含む）は stg の app からコピーした。

**結果**（未認証の curl。cms spike を custom domain に付けた状態）

```
GET/POST/PUT /api/media-upload  → 200（Worker に届いた）
GET /api/media-upload/sub       → 200（サブパスも bypass される）
GET /api/media-uploadX          → 401
GET / /admin /api/media /mcp    → 401 + WWW-Authenticate: Bearer（OAuth のチャレンジ）
ブラウザ相当（Accept: text/html）で / と /admin → 302 で napochaan.cloudflareaccess.com のログイン画面へ
/.well-known/oauth-authorization-server などの OAuth メタデータも返った
```

**判断**

ホスト全体 app と Bypass app は併用できる。

**注意**

- Bypass は `/api/media-upload` 以下のサブパスにも効く。
- 認証済みのブラウザと MCP の OAuth フローは、この spike では確認していない。
- 後続タスクでは、cms-stg の `CF_ACCESS_AUD` に上の AUD（`c582e273…`）を使う。
- spike の Worker を削除したので、`cms-stg.napochaan.com` の DNS レコードも一緒に消えている。本物の cms Worker に custom domain を付けるまでは到達できない。

## 6. クリーンアップ

- 削除した: `napochaan-web-spike`、`napochaan-cms-spike`、R2 バケット `napochaan-spike`、`spikes/` ディレクトリ、ローカルの dev プロセス。
- 既存の Access app: 23 件とも変更していない（`updated_at` も同じ）。追加は上の 2 件だけ。
- 既存の Worker、D1、R2 には触れていない。
- commit はしていない。

## 確定してほしいこと（Step 8 のゲート）

1. purge 方式: **default entrypoint 上の RPC `purge()`** でよいか（internal fetch と TTL フォールバックは使わない）。
2. ローカル開発手順: **`wrangler dev`（cms）→ `next dev`（web）、registry は worktree ごとに固定** でよいか。
3. deploy 順: stg と本番は **cms（WEB 付き）→ web** でよいか。
