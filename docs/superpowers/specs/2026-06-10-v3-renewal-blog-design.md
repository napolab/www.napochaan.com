# v3.0.0 制作ブログ — 設計

`blog` collection に最初の記事を1件作る。題目は **「www.napochaan.com v3.0.0 の制作について」**。
このサイトを作るうえで意識したこと、そして napochaan の落書きの衝動（ドパガキ）として生まれた雰囲気を
どうサイトとして拡張したかを、制作プロセスの時系列で語る。スクリーンショットを本文に挟む。
（依頼で出た「typo ガキ展」は固有概念化せず、背後の感覚＝落書きの衝動として書く。）

副産物として「blog 本文に画像を seed から埋める」小規模インフラを追加する（現状の blog seed は
本文内の画像を解決しない）。

## 出典・声の基準

- 素材: `docs/about.md` / `src/app/(site)/about/profile.ts`（bio・philosophy）/
  `src/app/(site)/colophon/content.ts`（所見01-05＝v3 の設計思想）/
  `src/app/(site)/_components/hero/index.tsx`（「も〜っと！ドパガキ！！！(11期)」「破壊、承っております」）
- 声: **本人が zenn / sizu.me で書いている思考の文体に寄せる**。とくに philosophy を一緒に作ったときに
  本人が投げてくれた生の言葉づかい＝ `profile.ts` の philosophy ブロックを **一次リファレンス**にする
  （あの確信のなさ・矛盾ごと抱える誠実さ・後悔のトーンが核）。
- 声の指紋（sizu.me「ものを作るということ」「ぼくのもつ性質と感謝の話」から採取）:
  - 短い宣言で入る（例:「僕のものづくりとはしんどいことと深く結びついている。」「衝動のままに文章を書こう。ただただ、赴くままに。」）
  - トレイリングドット（`…` / `.....`）で余韻・口ごもりを残す
  - 自虐 × 誠実 × 内省。しんどさと「作ること」が結びついている。衝動のまま手が動く。
  - **内省レジスタ**（熱量抑えめ・余韻寄り）。イベントレポの「！」連打とは別。技術パートは zenn の平易さで。
  - colophon の「〜んだよなぁ😁」調はサイトの公開トーン。ブログ本文はそれより **sizu.me 寄りの素の独白**に倒す。
- 一人称: サイトコピーは「ぼく」で統一しているため本記事も「ぼく」（sizu.me 本文の「僕」は揺れだが、サイト側に合わせる）。
- 執筆は **design-writer サブエージェント**に委任（napochaan の声の番人）。リファレンスとして
  `profile.ts`(philosophy/bio) と上記 sizu.me の声の指紋を渡す。コピー文のみを返させ、こちらが Lexical 本文へ組む。

## A. 記事メタ

| field         | 値                                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | `www.napochaan.com v3.0.0 の制作について`                                                                                                                      |
| `excerpt`     | 記事を一言で説明する独立要約（本文冒頭の貼り付けではない）。落書きの衝動から生まれたサイトを壊して・ほどいて・組み直した話、という要旨。design-writer が確定。 |
| `publishedAt` | `2026-06-10`                                                                                                                                                   |
| `_status`     | `published`                                                                                                                                                    |

## B. 本文の骨格（制作プロセスの時系列）

1. **なぜ作り直したのか** — v3 で作り直した動機。「目に見えるもの全部作りたい」衝動／ドパガキ＝落書きの衝動。
2. **壊す — 何を捨てたか** — 旧サイト・無難さ・機械的UIを捨てる。「破壊、承っております」。
3. **ほどける — 雰囲気を要素に分解する** — タイポ / glitch / システム注釈 / Game of Life に分解（所見01-04 を素材視点で語り直す）。
4. **組み直す — サイトとして増幅する** — 方眼の秩序の上で過剰を組み直す。**スクショ中心の章**。混沌と整列の共存。
5. **技術スタックという帰結** — Next.js / OpenNext / Cloudflare Workers / Payload CMS / Panda CSS。過剰でも a11y（WCAG 2.1 AA）は手放さない（所見05）。
6. **これからの napochaan.com** — CMS 化で更新し続ける場へ。「止まっていられない」。

- 見出しは `h2`（章）／必要なら `h3`（小見出し）。`extractHeadings` が TOC に拾うのは h2/h3。
- 落書きの衝動（ドパガキ）の雰囲気を各章の出発点として通す。

## C. スクリーンショット

- 撮影: **localhost:3000**（chrome-devtools MCP）。dev は稼働確認済み。
- 保存先: `src/assets/blog/`（`ensureMedia` は `src/assets` 配下を再帰探索するのでサブディレクトリ可）。
- 各画像に **mono 調の短いキャプション**（Figure のキャプション）を付ける。
- 提案セット（主に「組み直す」章へ、一部を該当章へ分散）:

| ファイル                    | 画面                                      | 章           |
| --------------------------- | ----------------------------------------- | ------------ |
| `v3-hero.png`               | トップの巨大タイポ（白地に黒で殴る）      | 組み直す     |
| `v3-system-annotations.png` | 座標 / カウンタ等の mono 注釈（機械の声） | ほどける     |
| `v3-about-maximalism.png`   | /about のマキシマリズム                   | 組み直す     |
| `v3-gallery.png`            | /gallery のメイソンリー                   | 組み直す     |
| `v3-colophon.png`           | /colophon 所見                            | 技術スタック |

- 撮影後の実 intrinsic 寸法を upload ノードの `width`/`height`/`alt` に反映する
  （`next-image-intrinsic-dimension-roughness` の教訓: 実寸を渡す）。

## D. 画像 seed パイプライン（小規模インフラ・TDD）

現状 `importBlog` は body をそのまま渡すだけで、本文内の画像 media を解決しない。
最小の追加で「本文に画像ファイル名を書く → seed が media を作って upload ノードに差し替える」を実現する。

### D-1. `sample-rich-text` に画像ブロックを追加

`src/utils/sample-rich-text/index.ts` の `SampleBlock` に
`{ type: 'img'; file: string; alt: string }` を追加し、Lexical の **upload sentinel ノード**を生成する:

```jsonc
{
  "type": "upload",
  "relationTo": "media",
  "format": "",
  "version": 3,
  "fields": null,
  "value": { "__file": "v3-hero.png", "__alt": "…" } // ← sentinel（id 未解決）
}
```

- 純粋関数・TDD（`sample-rich-text.test.ts` に追加）。
- これで記事本文を TS で書き、生成した Lexical JSON を `blog.json` に流し込める。

### D-2. body の media 解決ステップ

`src/seed/` に純粋な walk 関数を追加（コロケーション + TDD）:

- `collectUploadSentinels(body): { node, file, alt }[]` — body ツリーを再帰で走査し sentinel を集める純粋関数。
- `importBlog` 内で各 sentinel に対し既存 `ensureMedia(instance, file, alt)` を呼び、
  返った media id で `node.value = id` に差し替え、`upsertByTitle` へ。
- sentinel が解決できない（ファイル無し）場合は警告し、その upload ノードを落とす（クラッシュさせない、
  既存 `ensureMedia` の方針に合わせる）。
- 純粋 walk 関数を単体テスト。`importBlog` 自体は既存 import.test.ts のスタイルに合わせる。

### D-3. 記事を `blog.json` に追加

`src/seed/data/blog.json`（現状 `[]`）に記事1件。`body` は D-1 で生成した Lexical JSON（sentinel 入り）。

## E. ビルド順・検証

1. D-1（sample-rich-text の img ブロック） — TDD。
2. D-2（body media 解決） — TDD。
3. スクショ撮影 → `src/assets/blog/` に保存、実寸取得。
4. design-writer で本文コピー執筆 → Lexical 本文を生成 → `blog.json` に記事追加。
5. `pnpm seed:import` → `/blog/{id}` をローカル確認（画像・TOC・本文・キャプション）。
6. `pnpm lint && pnpm typecheck`。
7. difit でレビュー依頼。

実装は小タスクに分けて subagent に委任する。

## 非対象（YAGNI）

- 複数記事・RSS の作り込み（既存のまま）。
- works.json 等への画像 seed パイプライン汎用化（今回は blog のみ。共通化は必要になってから）。
- 画像最適化・OGP 専用画像の新規生成（既存 `Image`/CF Images に乗せる）。
