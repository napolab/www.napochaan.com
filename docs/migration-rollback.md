# マイグレーションの revert / ロールバック runbook

Payload のマイグレーションを含む PR を戻したいときの手順。`git revert` だけでは D1 は戻らない。

すべての `wrangler` / Payload CLI コマンドは account id が必要（無いと exit 13）:

```bash
export CLOUDFLARE_ACCOUNT_ID=cda8b0a2b410e1ff3a5bcc72c7e46f72
```

## なぜ revert だけでは戻らないか

Payload 3.84.1（`@payloadcms/drizzle`）の挙動:

| コマンド                 | 挙動                                                                                  | revert 後に起きること                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `payload migrate`        | **ローカルのファイルだけ**を走査し、`payload_migrations` に記録済みのものを skip する | DB にだけ残ったマイグレーションは無視される。エラーも出ずにコードと D1 スキーマが食い違う |
| `payload migrate:down`   | 最新バッチの `down` を**ローカルのファイルから**探す                                  | ファイルが消えているので `Migration X not found locally.` で失敗する                      |
| `payload migrate:status` | ローカルのファイルだけを一覧する                                                      | DB にだけ残った行は表示されない                                                           |

つまり revert を merge した時点で、そのマイグレーションの `down` はコードから消える。`down` を実行できるのは **revert 前のコミット**だけ。

## 正しい順番

main への merge で staging は自動デプロイされる。なので D1 のロールバックは **revert を merge する前**に済ませる。

1. revert PR を作る（まだ merge しない）
2. revert **前**のコミット（= 今の main）で、対象マイグレーションが最新バッチにあることを確認する
   ```bash
   CLOUDFLARE_ENV=staging pnpm payload migrate:status
   ```
   `migrate:down` は**最新バッチをまるごと**戻す（マイグレーション単位ではない）。対象より後に別のマイグレーションが同じバッチ・後続バッチで適用されていると、それも巻き込む／対象に届かない。想定と違うならここで止めて roll-forward（後述）を検討する。
3. staging を戻す
   ```bash
   CLOUDFLARE_ENV=staging pnpm payload migrate:down
   ```
4. production も同じく（production を戻すのは本番デプロイの直前でもよいが、revert 後のコードを本番に出す前には必須）
   ```bash
   CLOUDFLARE_ENV=production pnpm payload migrate:status
   CLOUDFLARE_ENV=production pnpm payload migrate:down
   ```
5. revert PR を merge → staging 自動デプロイ → production を workflow_dispatch

`down` が DROP を含む（= 追加したテーブル/カラムを消す）場合、その間に入ったデータは消える。必要なら先に `pnpm seed:export` 等で退避する。

## 破壊的マイグレーション → D1 Time Travel

DROP TABLE / DROP COLUMN を含むマイグレーションは、`down` でスキーマを作り直しても**データは戻らない**。データごと戻すには D1 Time Travel を使う（保持期間: 有料プラン 30 日 / 無料 7 日）。

```bash
# 戻したい時点の bookmark を確認（RFC3339 または Unix 秒）
pnpm exec wrangler d1 time-travel info D1 --env production --timestamp="2026-09-26T17:00:00+09:00"

# その時点へ復元（DB を in-place で上書き。実行中のクエリはエラーになる）
pnpm exec wrangler d1 time-travel restore D1 --env production --timestamp="2026-09-26T17:00:00+09:00"
# bookmark 指定でも可: --bookmark=<bookmark>
```

- `<database>` にはバインディング名 `D1` か DB 名（`napochaan-cms-production` / `napochaan-cms-staging`）を渡す。remote 専用コマンド。
- restore は結果として「復元前の bookmark」を返す。**必ず控えておく**（restore の取り消しに使う）。
- 復元時点以降に入ったコンテンツ（admin での編集等）も消える。
- 復元後の `payload_migrations` はその時点の状態に戻るので、`migrate:status` で確認してから該当コミットをデプロイする。
- 復元後は ISR キャッシュが古いままなので `pnpm revalidate:isr` を流す。

## 予防: roll-forward と expand/contract

一番安全なのは「戻さない」こと。

- **roll-forward を優先する**: 問題があれば、打ち消すマイグレーションを新しく作って前に進める。`payload_migrations` とファイルが常に一致し、ドリフトが起きない。
- **破壊的変更は expand/contract で PR を分ける**:
  1. コード側でそのテーブル/カラムを使わなくする PR（マイグレーション無し）
  2. 十分に様子を見てから、DROP するマイグレーションだけの PR

  こうしておけば 1 を revert しても DB は無傷で、2 は revert する理由がほぼ無くなる。コード削除と DROP を同じ PR に入れない。

## ドリフトガード（`migrate:check-drift`）

`.github/workflows/deploy.yml` は `deploy:database:{staging,production}` の直前に `pnpm deploy:database:check:{staging,production}`（= `payload migrate:check-drift`）を走らせる。

- `payload_migrations` の全行（`batch = -1` の dev push 行は除く）と `migrations/` のファイルを突き合わせ、**DB にだけあるマイグレーション**があれば一覧と復旧手順を出して exit 1 する。
- `payload_migrations` テーブルが無い（まっさらな DB）場合はドリフト無しとみなす。
- ローカルでも `pnpm payload migrate:check-drift` で確認できる（`.dev.vars` のローカル D1）。

### ガードで落ちたとき

表示された孤立マイグレーションに対して、どれか 1 つを選ぶ:

- **(a) revert が誤りだった** → そのマイグレーション（`.ts` / `.json` と `migrations/index.ts` のエントリ）をコードに戻す PR を出す。
- **(b) スキーマも本当に戻したい** → revert 前のコミットを checkout し、上の「正しい順番」2〜4 と同じく `migrate:status` → `migrate:down` を該当環境に実行してから、deploy workflow を再実行する。
- **(c) 破壊的マイグレーションだった** → `down` ではデータが戻らないので、上の D1 Time Travel で復元する。

ガードを外して強行デプロイしないこと。コードと D1 スキーマが食い違ったまま本番が動く。
