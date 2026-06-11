---
name: staging-deploy-seed
description: Runbook for deploying and seeding the staging Cloudflare environment (stg.napochaan.com) with required env vars and recovery steps. Use when deploying to staging, running seed:export / seed:import / payload migrations against staging, or when hitting "Select which Cloudflare account" prompts (exit code 13) or "D1_ERROR: no such column". Triggers on "stg に deploy", "staging に反映", "seed:export to stg", "seed:import".
---

# Staging Deploy & Seed Operations

## Overview

staging (stg.napochaan.com) への deploy / seed 操作の正しい順序と環境変数。`CLOUDFLARE_ENV=staging` を付けると payload bin スクリプトは wrangler の remote bindings 経由で**本物の** staging D1/R2 に直接接続する（deploy された Worker は経由しない）。

## Iron Rules

1. **すべての staging 系コマンドに `CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72` を前置する。** 複数 Cloudflare アカウントにログインしているため、付けないと対話的なアカウント選択プロンプトが出る。バックグラウンド実行では応答できず **exit code 13** で死ぬ。wrangler.toml トップレベルの `account_id` を拾わないステップ（OpenNext の R2 cache populate 等）があるので、env var での明示が唯一確実。
2. **`seed:import` は本人の明示依頼があるときだけ実行する。** logs/gallery は delete-all→recreate 方式なので、staging 側の未エクスポート編集を破壊する。import する前に必ず `seed:export` を先に実行して staging の編集を取り込むこと。
3. **schema 変更後の import は先にマイグレーション。** ローカルの `payload migrate` は staging に反映されない。忘れると `D1_ERROR: no such column: <col>` で落ちる。

## Quick Reference

すべてのコマンドの前に一度だけ（napochaan アカウント。省略・短縮禁止）:

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
```

| やること | コマンド |
| --- | --- |
| staging に deploy | `pnpm deploy:staging` |
| staging D1 にマイグレーション適用 | `pnpm deploy:database:staging` |
| staging からシード書き出し | `CLOUDFLARE_ENV=staging pnpm seed:export` |
| staging へシード投入（明示依頼時のみ） | `CLOUDFLARE_ENV=staging pnpm seed:import` |
| ISR キャッシュ bust | `CLOUDFLARE_ENV=staging pnpm revalidate:isr` |

## Full Sequence (deploy + import)

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72

# 1. schema 変更があるなら migration を deploy より先に
#    （新コード + 旧 schema は 500 になる。旧コード + 新 schema は概ね無害）
pnpm deploy:database:staging

# 2. deploy（build → deploy → ISR bust まで自動。数分かかるのでバックグラウンド推奨）
pnpm deploy:staging

# 3. staging の編集を先に取り込む（import するなら必須の前段）
CLOUDFLARE_ENV=staging pnpm seed:export

# 4. import（明示依頼があるときのみ）
CLOUDFLARE_ENV=staging pnpm seed:import

# 5. import はデータ変更なので ISR bust を手動で（deploy:staging の自動 bust は import 前）
CLOUDFLARE_ENV=staging pnpm revalidate:isr
```

## Recovery（途中で失敗したとき）

deploy / migration / import はいずれも再実行が安全（migration は適用済みをスキップ、import は upsert または delete-all→recreate）。import が途中で落ちて logs/gallery が欠けた場合も、同じ seed JSON から import を完走させ直せば復元される（その時点の source of truth は `src/seed/data/*.json`）。

**クラッシュした import の後に seed:export を再実行してはいけない。** 壊れた（空の）staging 状態を export して、正常な seed JSON を上書きしてしまう。

## Common Mistakes

| 症状 | 原因と対処 |
| --- | --- |
| exit code 13 / `Select which Cloudflare account` / unsettled top-level await | `CLOUDFLARE_ACCOUNT_ID` 未指定。env var を付けて再実行 |
| `D1_ERROR: no such column: ...` during seed:import | staging D1 のマイグレーション漏れ。`pnpm deploy:database:staging` してから import を再実行 |
| import したのに stg の表示が古い | ISR キャッシュが残っている。`CLOUDFLARE_ENV=staging pnpm revalidate:isr` |
| seed:export がローカルの miniflare を見てしまう | `CLOUDFLARE_ENV=staging` 忘れ。これが remote bindings のスイッチ |
| deploy がフォアグラウンドで長時間ブロック | build+deploy は数分かかる。バックグラウンド実行にする（account ID を付けていれば対話プロンプトは出ない） |

## Verification

- deploy 成功: ログに `Uploaded napochaan-website-staging` / `Current Version ID:` と `[bust-isr-cache] done.`
- export 成功: `wrote N <slug> → src/seed/data/<slug>.json` が works/news/blog/logs/gallery/profile 分出る。blog.json の本文画像は `"__file": "..."` センチネル形式であること
- import 成功: `upserted N news/works/blog`、`recreated N logs/gallery rows`、`updated profile global`
