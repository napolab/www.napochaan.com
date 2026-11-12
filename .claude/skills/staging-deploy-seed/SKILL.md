---
name: staging-deploy-seed
description: Runbook for deploying and seeding the staging Cloudflare environments (cms-stg.napochaan.com for the Payload CMS, stg.napochaan.com for the public web) with required env vars and recovery steps. Use when deploying to staging, running seed:export / seed:import / payload migrations against staging, or when hitting "Select which Cloudflare account" prompts (exit code 13) or "D1_ERROR: no such column". Triggers on "stg に deploy", "staging に反映", "seed:export to stg", "seed:import".
---

# Staging Deploy & Seed Operations

## Overview

staging への deploy / seed 操作の正しい順序と環境変数。staging は 2 つの Worker: **cms**（`napochaan-cms-staging`、cms-stg.napochaan.com。Payload・D1・R2。ホスト全体が Cloudflare Access 配下）と **web**（`napochaan-website-staging`、stg.napochaan.com。表示専用、Payload・D1・R2 を持たない）。D1 / seed / migration は全て cms 側（`--filter cms`）。`CLOUDFLARE_ENV=staging` を付けると payload bin スクリプトは wrangler の remote bindings 経由で**本物の** staging D1/R2 に直接接続する（deploy された Worker は経由しない）。

**deploy は cms → web の順**（web の `CMS` binding の向き先から）。cms の `WEB` binding は web の default entrypoint（`purge()`）を指す。

## Iron Rules

1. **すべての staging 系コマンドに `CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72` を前置する。** 複数 Cloudflare アカウントにログインしているため、付けないと対話的なアカウント選択プロンプトが出る。バックグラウンド実行では応答できず **exit code 13** で死ぬ。wrangler 設定トップレベルの `account_id` を拾わないステップ（OpenNext の R2 cache populate 等）があるので、env var での明示が唯一確実。
2. **`seed:import` は本人の明示依頼があるときだけ実行する。** logs/gallery は delete-all→recreate 方式なので、staging 側の未エクスポート編集を破壊する。import する前に必ず `seed:export` を先に実行して staging の編集を取り込むこと。
3. **schema 変更後の import は先にマイグレーション。** ローカルの `payload migrate` は staging に反映されない。忘れると `D1_ERROR: no such column: <col>` で落ちる。

## Quick Reference

すべてのコマンドの前に一度だけ（napochaan アカウント。省略・短縮禁止）:

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
```

| やること | コマンド |
| --- | --- |
| staging に deploy（cms → web） | `pnpm deploy:staging`（= `pnpm --filter cms deploy:staging && pnpm --filter web deploy:staging`） |
| cms だけ deploy | `pnpm --filter cms deploy:staging` |
| web だけ deploy | `pnpm --filter web deploy:staging` |
| staging D1 にマイグレーション適用 | `pnpm --filter cms deploy:database:staging`（root: `pnpm deploy:database:staging`） |
| staging からシード書き出し | `CLOUDFLARE_ENV=staging pnpm --filter cms seed:export` |
| staging へシード投入（明示依頼時のみ） | `CLOUDFLARE_ENV=staging pnpm --filter cms seed:import` |
| Workers Cache を空にする | `pnpm --filter web deploy:staging`（新しい Worker version は空のキャッシュから始まる） |

## Full Sequence (deploy + import)

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72

# 1. schema 変更があるなら migration を deploy より先に
#    （新コード + 旧 schema は 500 になる。旧コード + 新 schema は概ね無害）
pnpm --filter cms deploy:database:staging

# 2. deploy（cms → web の順。build → deploy。数分かかるのでバックグラウンド推奨）
pnpm deploy:staging

# 3. staging の編集を先に取り込む（import するなら必須の前段）
CLOUDFLARE_ENV=staging pnpm --filter cms seed:export

# 4. import（明示依頼があるときのみ）
CLOUDFLARE_ENV=staging pnpm --filter cms seed:import

# 5. import は purge hook を通らない（disableRevalidate）ので、web を再 deploy して Workers Cache を空にする
pnpm --filter web deploy:staging
```

新しい Worker 名の環境を初めて作るときは、循環 binding（cms の `WEB` ↔ web の `CMS`）のため cms（WEB 無し）→ web → cms（WEB あり）の順になる。既存名なら定常順（cms → web）でよい。Worker を削除するときは参照元の binding を外すか `--delete-with-references` が要る。

## Recovery（途中で失敗したとき）

deploy / migration / import はいずれも再実行が安全（migration は適用済みをスキップ、import は upsert または delete-all→recreate）。import が途中で落ちて logs/gallery が欠けた場合も、同じ seed JSON から import を完走させ直せば復元される（その時点の source of truth は `apps/cms/src/seed/data/*.json`）。

**クラッシュした import の後に seed:export を再実行してはいけない。** 壊れた（空の）staging 状態を export して、正常な seed JSON を上書きしてしまう。

## Common Mistakes

| 症状 | 原因と対処 |
| --- | --- |
| exit code 13 / `Select which Cloudflare account` / unsettled top-level await | `CLOUDFLARE_ACCOUNT_ID` 未指定。env var を付けて再実行 |
| `D1_ERROR: no such column: ...` during seed:import | staging D1 のマイグレーション漏れ。`pnpm --filter cms deploy:database:staging` してから import を再実行 |
| import したのに stg の表示が古い | Workers Cache が残っている。web を再 deploy する（Worker version が変わり Workers Cache が空になる。`.claude/rules/workers-cache.md`）。CMS 書込みの purge 自体は cms の `afterChange` が `env.WEB.purge()` で行う |
| seed:export がローカルの miniflare を見てしまう | `CLOUDFLARE_ENV=staging` 忘れ。これが remote bindings のスイッチ |
| web の CMS 呼び出しが 5xx / 502 | cms 未 deploy または Access 設定。web は `env.CMS`（Service Binding）経由なので cms Worker が先に生きている必要がある |
| deploy がフォアグラウンドで長時間ブロック | build+deploy は数分かかる。バックグラウンド実行にする（account ID を付けていれば対話プロンプトは出ない） |

## Verification

- deploy 成功: ログに `Uploaded napochaan-cms-staging` → `Uploaded napochaan-website-staging` / `Current Version ID:`
- export 成功: `wrote N <slug> → apps/cms/src/seed/data/<slug>.json` が works/news/blog/logs/gallery/profile 分出る。blog.json の本文画像は `"__file": "..."` センチネル形式であること
- import 成功: `upserted N news/works/blog`、`recreated N logs/gallery rows`、`updated profile global`
