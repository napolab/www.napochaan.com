# CI/CD gap analysis — www.napochaan.com

調査日: 2026-06-16

## 結論

`.github/` 自体が存在せず、CI/CD は **ゼロから構築**する必要がある。品質ゲートは
husky の `pre-commit`(`pnpm lint && pnpm typecheck`)のローカル実行のみ。デプロイは
`pnpm deploy:staging` / `deploy:production` の **完全手動**。

## 現状

| 項目                | 状態                                                |
| ------------------- | --------------------------------------------------- |
| `.github/workflows` | 存在しない                                          |
| husky `pre-commit`  | `pnpm lint && pnpm typecheck`(**test なし**)        |
| デプロイ            | 手動 `pnpm deploy:staging` / `deploy:production`    |
| DB migration        | 手動 `pnpm deploy:database:staging` / `:production` |
| seed                | 手動。memory ルールで自動化禁止                     |
| ランタイム          | Node 24 / pnpm 10.33.2(`mise.toml`)                 |

### gitignore されている生成物(CI で再生成が必要)

- `styled-system/` — Panda CSS codegen。`prepare`(= `husky && panda codegen`)で
  `pnpm install` 時に自動生成される。
- `cloudflare-env.d.ts` — `pnpm cf:types`(`wrangler types`)で生成。typecheck の前提。
- `.open-next/` — OpenNext ビルド成果物(deploy 時に生成)。
- `tsconfig.tsbuildinfo`

### テスト構成(`vitest.config.ts`、test ファイル 185)

| project   | include               | runtime                                      | CI 上の要件                          |
| --------- | --------------------- | -------------------------------------------- | ------------------------------------ |
| `browser` | `src/**/*.test.tsx`   | Playwright chromium(headless)                | `playwright install chromium` + deps |
| `unit`    | `src/**/*.test.ts`    | node                                         | なし                                 |
| `workers` | `worker/**/*.test.ts` | `@cloudflare/vitest-pool-workers`(miniflare) | **CF 認証不要**(ローカル workerd)    |

## CI(PR ゲート)に不足しているもの

1. PR トリガの workflow(lint / typecheck / test)。
2. ジョブ前提の codegen:
   - `pnpm install`(prepare 経由で panda codegen 実行)
   - `pnpm cf:types`(typecheck 前。`wrangler types` は wrangler.toml をローカル解釈、
     基本的にアカウント不要)
3. Playwright chromium のインストール(browser project)。
4. ランタイム固定(`jdx/mise-action` が `mise.toml` から Node 24 / pnpm 10.33.2 を決定)
   - `node_modules` キャッシュ(`actions/cache`, key=`pnpm-lock.yaml` ハッシュ)。
5. lint = `oxfmt --check` + `oxlint`、typecheck = `tsgo`、test = `vitest run`。

## CD(デプロイ自動化)に不足しているもの

1. デプロイ workflow(main マージ / tag / 手動 dispatch)。
2. GitHub Secrets:
   - `CLOUDFLARE_API_TOKEN`(Workers Scripts edit / D1 / R2 / Workers Routes / Cache 権限)
   - `CLOUDFLARE_ACCOUNT_ID = cda8b0a2b410e1ff3a5bcc72c7e46f72`(未設定だと wrangler が
     アカウント選択プロンプトで exit 13)
3. ISR cache bust(`scripts/bust-isr-cache.mjs`)も CF API を使用 → 同 token で動作。
4. GitHub Environments(production に required reviewers / 承認ゲート)。
5. DB migration(`deploy:database:*`)を CD に含めるかの方針決定。
   - 含める場合、`opennextjs-cloudflare deploy` の前に migration を流す順序が必要。
6. seed import は **自動化しない**(memory: `dont-run-seed-import` / `seed-import-prod-skips-admin-user`)。

## 設計上の決定が必要な論点

- **デプロイ戦略**: main マージ → staging 自動 + production は手動/tag/承認? それとも tag 一本化?
- **migration の扱い**: CD に組み込む or 手動のまま。
- **CI で deploy preview を出すか**(`opennextjs-cloudflare preview` 系、コスト増)。

## 実装(2026-06-16 追加)

確定方針: main→staging 自動 / production 手動承認、migration はデプロイ前自動、
CI は lint+typecheck+test(全3project)。

- セットアップは composite action に集約:
  - `.github/actions/cache-deps/action.yml` — `node_modules` キャッシュ層(独立モジュール)。
  - `.github/actions/setup/action.yml` — `jdx/mise-action`(mise.toml から node/pnpm 決定)
    → `cache-deps` → `pnpm install` を内包。workflow からは `uses: ./.github/actions/setup`
    の1行で呼ぶ。
- `.github/workflows/ci.yml` — PR / main push で `quality`(lint+typecheck)と
  `test`(vitest 全3project, Playwright chromium 導入)を並列実行。
- `.github/workflows/deploy.yml`
  - `staging` job: main push トリガ。`cf:types` → `deploy:database:staging`(migration)
    → `deploy:staging`(build+deploy+ISR bust)。
  - `production` job: `workflow_dispatch` トリガ。`environment: production` 経由で
    承認ゲート。同じ順で production スクリプトを実行。

### GitHub 側で必要な手動セットアップ(コード外)

1. **Repository Secrets**(Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN` — 後述の権限を持つ token
   - `CLOUDFLARE_ACCOUNT_ID` — `cda8b0a2b410e1ff3a5bcc72c7e46f72`
2. **Environments**(Settings → Environments):
   - `staging`(保護なしで可)
   - `production` — **Required reviewers** を設定し、デプロイ前承認を必須化
3. **API token 権限**(Cloudflare dashboard で作成。"Edit Cloudflare Workers"
   テンプレ + 追加):
   - Account / Workers Scripts: Edit
   - Account / D1: Edit(migration + ISR bust の `d1 execute`)
   - Account / Workers R2 Storage: Edit(media / cache バケット)
   - Zone / Workers Routes: Edit(`napochaan.com` / `stg.napochaan.com` custom domain)
4. **Branch protection**(任意・推奨): main に CI ステータス必須を設定し、
   deploy が回る前に PR で品質ゲートを通す。

### 未検証 / リスク

- `deploy:database:*`(`payload migrate`)は remote D1 binding 経由。CLAUDE.md の
  記述では PAYLOAD_SECRET 等は **deploy 済み wrangler secret** から remote で読まれる
  想定。CI runner からの remote migration は **本番初回は手動で1度確認**してから
  自動運用に乗せるのが安全。
- workflow YAML はローカルに yaml パーサ / actionlint が無く手検証。push 後に
  Actions タブで初回実行を確認すること。

### 初回 CI で判明した root cause（解決済み）

- `wrangler types`(`pnpm cf:types`)は wrangler.toml の `[vars]` だけでなく
  **`.dev.vars` のキーも `CloudflareEnv` 型に流し込む**。CI には `.dev.vars`(gitignore)が
  無いため `PAYLOAD_SECRET` 等の secret 型が欠落し、それらを参照する
  `src/payload.config.ts` / contact actions で **typecheck が exit 2**。
- 対策: キーのみのプレースホルダ `.dev.vars.example` をコミットし、`setup` composite
  action が `cp -n .dev.vars.example .dev.vars`(不在時のみ)で型生成の入力を揃える。
  ローカルの実 `.dev.vars` は `-n` で上書きしない。`.dev.vars.example` だけで
  cf:types + typecheck が通ることをローカル再現で確認済み(exit 0)。

## 既知の落とし穴(memory 由来)

- `CLOUDFLARE_ACCOUNT_ID` 必須(exit 13)。
- `.dev.vars` は gitignore。CI は wrangler secret(本番反映済み)を使う想定で、
  `.dev.vars` には依存しないこと。
- production 本番は既に稼働中(provision/migrate/seed/secret 8件/deploy 完了済み)。
  CD はこの稼働済み環境への継続デプロイを対象とする。
