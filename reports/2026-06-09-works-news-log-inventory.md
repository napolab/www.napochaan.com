# works / news / log コンテンツ棚卸し（2026-06-09）

napochaan.com 既存サイト + X（@naporin24690 / @napochaan_vrc2）から、`works` / `news` / `log` に投入するための情報をまとめたもの。

## 取得方法・前提

- napochaan.com と x.com はどちらも bot ブロックのため WebFetch 不可。ログイン中の Chrome をブラウザ自動操作して取得。
- History の各作品は**ダイアログを開いて詳細コメント＋外部リンクまで取得**（React Fiber 経由で一括抽出）。
- 引用 RT / リプライは**引用元ツイートまで辿って**正式イベント名・日付・主催者を確定済み。
- すべての項目に **tweet の status link** を付与。`status` 列は `https://x.com/<列の値>` でアクセス可。
- 日付は本文に明示されたイベント日を優先。無い場合のみ投稿日(JST, UTC+9)。
- **`category`（拡張提案）**= `DJ` / `VJ` / `DJ/VJ`（出演）/ `support`（技術サポート・協力・実装提供）/ `登壇`（英語含む）/ `release`（自主制作物の公開）/ `update`（サイト・プロフィール更新）。
  - **`主催`** は category とは別の flag（napochaan が開催側）。LOG の「主催」列に `★` で表示。

---

## 1. WORKS（制作実績）

### 1-A. napochaan.com 掲載済み — History（既存 works）

> サイトの `#works > History` 各作品を**ダイアログを開いて詳細コメントまで取得**したもの（説明文＋外部リンク）。X で日付が判明したものは 〔 〕で付記。名取さなさんのファンアプリは**別アプリ2件**なので分けて掲載。

1. **PAE2.0 ドットレカギミック制作** — VRChat で公開されている VRC PIXELART EXHIBITION 2.0 にドット絵組み合わせギミックを制作・提供した。複数人で同じものを見るための同期機能や、VR・Desktop 環境での最適化など、UX を重視した設計を行った。〔2025-09-13 告知: x/1966836184686211464〕
   🔗 https://vrchat.com/home/world/wrld_ab2c1526-c1b1-419d-b138-be32591e799f
2. **まだ知らない君がいる 映像提供** — 椎乃味醂の楽曲「まだ知らない君がいる - 初音ミク･重音テト」の MV に VRChat で撮影した映像を提供した。
   🔗 https://x.com/naporin24690/status/1959117309689438582
3. **ボカコレ2025夏 アーカイブ作成** — ボカコレ2025夏の統計情報を Web サイトにまとめた。
   🔗 https://vocaloid-collection-archive.studiognu.org/2025/summer
4. **おてぃる誕生日 モザイクアート制作** — VRChat の推しの誕生日を祝うためにモザイクアートと HP を作成した。20人の協力により約3000枚の画像から24000タイルのモザイクアートを制作。モザイクアート生成用の Rust ツールも開発した。可愛らしいデザインとローディング画面にこだわり、提供画像のギャラリーサイトも併設した。個別ページの og:image 設定により Twitter での共有を促進。opennextjs/cloudflare を初めて本格活用したプロダクト。
   🔗 https://ristill.club/2025
5. **VRChat イベントポスター制作** — VRChat の個人イベント用ポスター・ロゴを制作した。可愛らしさと情報の伝わりやすさを重視したレイアウトを心がけた。
   🔗 https://x.com/napochaan_vrc2/status/1929843195313377560
6. **AKAGE オマージュ動画制作** — After Effects を使った初めての動画制作で AKAGE オマージュ動画を作成した。アバターのコンセプトに合わせ、可愛さと面白さを重視した編集を心がけた。
   🔗 https://x.com/ristill_vr/status/1913064949242360039
7. **UMANITY HP 制作** — AHUB のアルバム「UMANITY」の Web サイトを制作した。アルバム紹介コンテンツやクイズなどのインタラクティブなギミックを搭載した HP を作成した。〔2025-03-15 告知: x/1900835701912203467〕
   🔗 https://ahub.jp/umanity/
8. **ヘイロー化ギミック booth 販売** — VRChat で好きなオブジェクトを頭上で回転させるヘイローにできるギミックを制作した。ボタン一つで自動配置する仕組みを実装し、フルパック版では13種類のメニューを用意。汎用的な円形配置スクリプトにより頭部以外の部位にも装着可能で、アバター対応最適化を行い BOOTH で販売中。
   🔗 https://booth.pm/ja/items/6604904
9. **W♭Y♭K M♭C K システム作成** — 企画展「共に在る音楽」の作品「W ♭Y ♭K M ♭C K」のシステムを設計・実装した。〔2024-12-12: x/1867175063893811585〕
   🔗 https://x.com/naporin24690/status/1867175063893811585
10. **DEMiXUS システム作成** — 企画展「共に在る音楽」の作品「DEMiXUS」のシステムを設計・実装した。短期間での開発ながら要望実現のため Cloudflare Stack をフル活用した構成とした。〔2024-12-12: x/1867179943060504598〕
    🔗 https://x.com/naporin24690/status/1867179943060504598
11. **燭 / MusicVideo Coding Advisor** — 燭の MV で使用する図形を p5.js で生成できるシンプルなエディターを作成した。
    🔗 https://x.com/naporin24690/status/1845201683368071632
12. **工房祭ステージシステム実装** — OBS のブラウザソースで動作するステージ演出システムを作成した。Cloudflare Workers と WebSocket により OBS とスマホ間の通信を実現。自作の durabcast ライブラリを活用。演出画面の制御に加え、スマホでの正解不正解選択、再生停止操作、回答者位置調整など現場での実用性を重視した機能を搭載。〔2024-09-14: x/1834900593808490701〕
    🔗 https://x.com/naporin24690/status/1834900593808490701
13. **Workers Tech Talk #3 登壇** — Cloudflare Workers DurableObjects での WebSocket 活用のための Tips について登壇した。DurableObjects は WebSocket 処理の最適解になりつつあるが、活用にはいくつかの課題がある。自身が直面した問題を具体例として挙げながら、実践的な解決策を紹介した。〔2024-08-01: x/1818952959713218818〕
    🔗 https://speakerdeck.com/naporin0624/durableobjects-nituite
14. **Hono Conf 2024 登壇（初登壇）** — Hono Conference 2024 - Our first step に登壇した。大阪関西国際芸術祭での展示システム事例について発表。イベント向け短期開発での Cloudflare 活用メリットと Hono 併用による効率化について説明。具体的には Hono RPC での型安全通信、ReverseProxy と getPath を併用した画像最適化サーバーの構築手法などを紹介した。〔2024-06-22: x/1804542363895001374〕
    🔗 https://speakerdeck.com/naporin0624/event-exhibition-with-hono
15. **flat-工房 HP 制作サポート** — flat-工房の HP 制作サポートを行った。Next.js を Cloudflare Pages で運用し、画像最適化には Cloudflare Worker と Cloudflare Images を活用。コンタクトフォームは ServerAction と Resend で実装し、bot 対策として Cloudflare WAF ページ検証を導入するなど安全な運用を重視した。
    🔗 https://www.flatkobo.com
16. **彼方 DL ページ作成** — StudioGnu で公開した UTAU 彼方のランディングページを作成した。利用規約の必読を重視し、ダウンロード機能の実装に注力。Cloudflare Turnstile で bot 排除後、数分間有効な signed URL でダウンロードリンクを生成。DurableObjects によるダウンロードカウンター機能も搭載し、総ダウンロード数を確認可能。
    🔗 https://www.studiognu.org/lp/kanata
17. **ボカコレ2024冬 ランキングの作成** — ボカコレ2024冬のランキングアーカイブを作成した。フロントエンドは前回から変更なしだが、サーバー実装を大幅強化。Cloudflare Cron Trigger で収集したランキングスナップショットを drizzle で Cloudflare D1 に保存する構成に変更した。
    🔗 https://vocaloid-collection-archive.studiognu.org/2024/winter
18. **StudioGnu HP の作成** — StudioGnu の HP を作成した。Next.js と vanilla-extract をメインに使用し、データ管理には MicroCMS を採用。Interweave ライブラリで文字列を HTML 変換している。作品ごとの動的 og:image 生成には next/og を活用した。
    🔗 https://www.studiognu.org
19. **楽曲「デュレエ」関連データ解析** — 楽曲「デュレエ」の一部で使用されるデータの解析を担当した。データ分析に JupyterLab、pandas、numpy を使用し、描画に matplotlib、NetWorkX、JavaScript canvas を活用。サムネイル変遷の大量データは matplotlib では処理できず canvas で実装。適切なアウトプットのため言語に固執しない柔軟なアプローチを取った。
    🔗 https://www.studiognu.org/ja/works/duree （データ解析セクション） ／ MV: https://www.youtube.com/watch?v=dpT-ZAPVvyI
20. **「多面体、鏡面」システム作成** — 大阪関西国際芸術祭2023に出展するためのシステムを作成した。感想投稿機能、ChatGPT API と StableDiffusion による自動動画生成システム、ポスター・コメント表示画面を実装。技術的挑戦として大部分を Cloudflare 製品で構築した。
    🔗 https://x.com/StudioGnu/status/1741010587495416144
21. **第一象徴体系 LP 作成** — シャノンの 1st アルバムのランディングページを作成した。Figma でデザインし Astro で実装した。
    🔗 https://1st-album.hakualab.org/
22. **オリジナル名刺の作成** — オリジナル名刺を作成した。Figma でデザインから入稿まですべて自力で実施。キャラクターをメインにしたシンプルで情報が伝わりやすいレイアウトにこだわった。
    🔗 https://x.com/naporin24690/status/1705577231928697299
23. **ボカコレランキングアーカイブの作成** — ボカコレ2023夏の毎時ランキングアーカイブを作成した。統計情報や増加量を多角的に整理し、ランキング傾向を可視化。縦横両方向の仮想スクロールで大量コンテンツの高速検索・スクロールを実現。データ基盤は Cloudflare Workers + KV + R2、アプリケーションは Hono で構築。データ収集は queue + cron trigger の組み合わせで取りこぼしなく毎時集計する仕組みを構築。
    🔗 https://vocaloid-collection-archive.studiognu.org/
24. **熱異常 / シャノン REMIX テクニカルサポート** — シャノンの熱異常 REMIX のテクニカルサポートを担当した。主にプログラム部分をサポート。
    🔗 https://x.com/naporin24690/status/1687483050253561856
25. **napochaan.com の作成** — Figma の勉強を兼ねて作成したポートフォリオサイト。Next.js + Cloudflare Pages で高速表示を実現し、アクセシビリティ対応に Radix UI を採用。可愛らしさと楽しさを表現するため、react-spring でキャラクターやコンテンツにアニメーションを付与。（※旧バージョン。現行は本リポジトリ）
26. **LGTM ジェネレータ** — satori で作成した LGTM ジェネレーターを Cloudflare Workers にデプロイ。URL パラメーターで文字色と背景画像をカスタマイズ可能。
    🔗 https://lgtm.napochaan.com/
27. **買取アプリの開発** — flat-工房の買取専用アプリを開発した。デザイン以外の全部分を担当し、Firebase + React + vanilla-extract + react-hook-form で構築。
    🔗 https://flat-kobo-kaitori.web.app/
28. **ネットショップ UI 開発** — flat-工房のネットショップ UI 改善プロジェクトを担当。デザイン以外の全部分を担当し、lit-element をメインに使用して開発。
    🔗 https://flatkobo.shop
29. **Project BLUE Official HP 作成** — ProjectBLUE の公式 HP を作成した。Next.js + styled-components で構築。
    🔗 https://pjblue.jp
30. **447Records TANA の開発** — 447Records TANA の開発を担当した。主にオーディオプレイヤー周りを実装。React での複雑 UI 実装に初めて挑戦し、Apple Music のような洗練されたインタラクションを目指した。
    🔗 https://tana.447pro.com/
31. **instructors ページの開発** — 新卒で入社した会社のアプリページを作成した。
    🔗 https://x.com/naporin24690/status/1244865712490856448
32. **lessons ページの開発** — インターン先で主要な検索ページを作成した。検索 UI の初実装を通じてコンポーネント分割の手法を学んだ。
    🔗 https://x.com/naporin24690/status/1227830616227344384
33. **名取さなさんのファンアプリ作成（その1）** — 桜を見に行くために作成したファンアプリ。iOS で AR を簡単に実現できる web アプリをラップした推し専用アプリ。
    🔗 https://x.com/naporin24690/status/1106641342506004480
34. **名取さなさんのファンアプリ作成（その2・別アプリ）** — 初めて作成した web アプリケーション。タスク管理アプリに推しの声をかけ合わせることで、ユニークで面白い体験を作り出した。
    🔗 https://x.com/naporin24690/status/1091367573587865601

### 1-B. napochaan.com 掲載済み — Library（OSS / npm）

> `#works > Library`。GitHub: https://github.com/naporin0624 / npm 配下。

| パッケージ              | 種別（推定）                                     |
| ----------------------- | ------------------------------------------------ |
| electron-texture-bridge | TypeScript, Rust, C++ / Electron to Spout/Syphon |
| mosaic-art-rust         | Rust / モザイクアート生成                        |
| pixel-art-rust          | Rust / ピクセルアート                            |
| gpt-image-1-mcp         | MCP / 画像生成                                   |
| @napolab/eslint-rules   | ESLint ルール                                    |
| durabcast               | Cloudflare Durable Object ライブラリ             |
| y-durableobjects        | Yjs × Durable Object 共同編集                    |
| alpha-blend             | 画像合成                                         |
| kv-response-cache       | Cloudflare KV キャッシュ                         |

### 1-C. サイト未掲載 — X から発掘した制作実績（要 works 追加）

> サイト History に**無い**もののみ（重複は 1-A に統合済み）。すべて引用元を確認して内容確定。

| 日付(JST)  | 制作物                                                                          | 役割・内容                                                                                                 | status                             |
| ---------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 2026-06-09 | **napochaan.com リニューアル（本サイト・本リポジトリ）**                        | Next.js + OpenNext + Cloudflare Workers / Payload CMS / Panda CSS で全面リニューアル制作                   | （本リポジトリ）                   |
| 2026-04-12 | **Booth2Booth 公式サイト（booth2booth.com）**                                   | デザイン/実装担当。コンセプト設計重視・高インタラクション                                                  | naporin24690/2043185292337975601   |
| 2026-05-05 | #ProjectCircles 椎乃味醂 ライブセクション                                       | モーキャプシステム構築・アニメーション補正                                                                 | naporin24690/2051632371590701138   |
| 2026-01-18 | #Harmony0118 あみだくじシステム                                                 | パーティ用あみだくじシステム実装                                                                           | naporin24690/2012874773630685212   |
| 2025-12-10 | 企画展『思弁的な音楽』 r-906《額縁の言葉 : I》                                  | 背景映像・システム構築担当（体験型展示）                                                                   | naporin24690/1998715240075374793   |
| 2025-12-06 | Vket2025Winter「PrizeSpider」クレーンゲームギミック（九龍帝国 欠番街 -無秩序-） | 一部 Udon 実装（動画: OrangeLiner / 出演: SwanPute）                                                       | napochaan_vrc2/1998666475687784803 |
| 2025-11-16 | 「解釈系 / ハーモニー」特設サイト                                               | サイト実装（試聴開始で最後まで自動再生）                                                                   | naporin24690/1990007733005979981   |
| 2024-11-29 | Event Exhibition with LLM（展示ワールド）                                       | 投稿サムネ/コメント一覧/キャラポスターを WebSocket + LLM 生成で即時更新。資料: speakerdeck.com/naporin0624 | naporin24690/1862529523344187817   |

> 🔁 旧「2024-12-12 VR展示作品/VRバー [薄]」は、ダイアログ調査で **DEMiXUS（History #10）/ W♭Y♭K M♭C K（History #9）= 企画展「共に在る音楽」**と判明したため 1-A に統合（重複削除）。

---

## 2. NEWS（お知らせ候補・厳選）

> **NEWS 掲載基準**=「**自分が主催しているもの**」＋「**関わっている人・会場の規模が大きいもの**」。日常の出演ログは LOG 側に置き、NEWS には大きいものだけを厳選。

| 日付(JST)  | category | 主催 | タイトル候補                                                               | status                             |
| ---------- | -------- | ---- | -------------------------------------------------------------------------- | ---------------------------------- |
| 2026-06-06 | DJ/VJ    | ★    | #Booth2Booth vol.03 を VRChat で開催（ゲスト @Rei_ayanami\_\_Jj）          | naporin24690/2063217578395279809   |
| 2026-05-30 | DJ       | ★    | 神田Roost シーシャ DJ オールナイト開催（フライヤー制作）                   | naporin24690/2056691334229201294   |
| 2026-05-23 | DJ/VJ    | ★    | 主催 Booth2Booth vol.02 を VRChat で開催（フライヤー制作）                 | naporin24690/2050895908850762215   |
| 2026-05-08 | DJ/VJ    | ★    | PROLOGUE at IV AKIHABARA を開催                                            | naporin24690/2042951785502118342   |
| 2026-05-05 | support  |      | #ProjectCircles 椎乃味醂ライブにモーキャプシステムで参加（大規模ライブ）   | naporin24690/2051632371590701138   |
| 2026-04-24 | DJ/VJ    | ★    | Booth2Booth vol.01 始動（リアル × VR の VRDJ イベント、初回ゲスト 好き）   | naporin24690/2038209695996158212   |
| 2026-04-12 | release  |      | Booth2Booth 公式サイト（booth2booth.com）公開                              | naporin24690/2043185292337975601   |
| 2026-02-21 | DJ       | ★    | 「超すごい DJ イベント」を VRChat で開催（**Booth2Booth 誕生のきっかけ**） | napochaan_vrc2/2022521138967122056 |
| 2024-06-22 | 登壇     |      | Hono Conference 2024 で登壇（英語・大型カンファレンス）                    | naporin24690/1804542363895001374   |

---

## 3. LOG（年表）— 出演・イベント・リリース 時系列

> log = 活動の年表（DJ/VJ 出演 + 主催 + support + 登壇 + release）。`category` は拡張スキーム（DJ/VJ/support/登壇/release/update）。
> `publishedAt` はイベント日。`url` は status link（`x.com/<値>`）。**主催**列に `★`。

### 2026年

| publishedAt | category | title                                                                                | 主催          | status                             |
| ----------- | -------- | ------------------------------------------------------------------------------------ | ------------- | ---------------------------------- |
| 2026-07-26  | VJ       | #39Pop × #39mix に Guest VJ 出演（nagomix 渋谷, 13:00–20:00）                        |               | naporin24690/2056571808514703540   |
| 2026-07-03  | VJ       | Halfmoo'n' に VJ 出演（フォトアート × VJ, 20:00–5:00）                               |               | naporin24690/2061770618316751163   |
| 2026-06-09  | release  | napochaan.com リニューアル制作（本サイト・本リポジトリ）                             |               | （本リポジトリ）                   |
| 2026-06-06  | DJ/VJ    | Booth2Booth vol.03 @VRChat（ゲスト @Rei_ayanami\_\_Jj）                              | ★             | naporin24690/2063217578395279809   |
| 2026-06-03  | DJ       | #VRC電音研 に DJ 出演（jesusclub/hyperflip/dubstep/riddim）                          |               | naporin24690/2062118071696011384   |
| 2026-05-30  | DJ       | 神田Roost シーシャ吸い放題 DJ オールナイト（21:00〜翌6:00, ¥3000+1D）                | ★(フライヤー) | naporin24690/2056691334229201294   |
| 2026-05-27  | VJ       | #ADMA vol.6 at CLUB PLUM に VJ 出演                                                  |               | naporin24690/2061409831681138898   |
| 2026-05-23  | DJ/VJ    | Booth2Booth vol.02 @VRChat                                                           | ★(フライヤー) | naporin24690/2050895908850762215   |
| 2026-05-18  | DJ/VJ    | #Randmizer in IV AKIHABARA 出演（役割要確認）                                        |               | naporin24690/2056571808514703540   |
| 2026-05-15  | DJ/VJ    | ぱろん 誕生日 DJ/VJ（ボカロ/アニメリミックス）                                       |               | napochaan_vrc2/2050196551948214556 |
| 2026-05-14  | VJ       | 初の VJ only 出演                                                                    |               | napochaan_vrc2/2054812997110177822 |
| 2026-05-08  | DJ/VJ    | PROLOGUE at IV AKIHABARA（23:00–5:00）                                               | ★             | naporin24690/2042951785502118342   |
| 2026-05-07  | VJ       | #hakai vol.4 に VJ 出演（自作 VJ ソフト）                                            |               | naporin24690/2048738372085330122   |
| 2026-05-06  | DJ       | #Try_it vol.5 SP に DJ 出演（PUBLIC PUBLIC）                                         |               | naporin24690/2047289981081960453   |
| 2026-05-05  | support  | #ProjectCircles 椎乃味醂ライブ モーキャプシステム構築・アニメ補正                    |               | naporin24690/2051632371590701138   |
| 2026-05-02  | VJ       | livrise. -incident- at #PUBLICPUBLIC_SHIBUYA に VJ 出演（15:00–23:00）               |               | naporin24690/2048738372085330122   |
| 2026-04-29  | VJ       | ARENA で VJ 出演                                                                     |               | napochaan_vrc2/2047236150482583618 |
| 2026-04-24  | DJ/VJ    | Booth2Booth vol.01 初回（ゲスト 好き @Suki_Music9, @VRChat）                         | ★(フライヤー) | naporin24690/2038209695996158212   |
| 2026-04-12  | release  | Booth2Booth 公式サイト制作・公開（booth2booth.com）                                  |               | naporin24690/2043185292337975601   |
| 2026-04-11  | DJ       | Initium:IRL に DJ 出演（IV AKIHABARA, 3番手 18:20, フライヤー/タイテ公開）           |               | naporin24690/2031692995368796579   |
| 2026-04-03  | VJ       | #いくらうど に VJ 出演（後半, ric3show3r）                                           |               | naporin24690/2040093405699846467   |
| 2026-03-15  | DJ       | DJ 出演（hyperflip, わぶくら後）                                                     |               | napochaan_vrc2/2031691805297930507 |
| 2026-03-12  | DJ       | がんもん 誕生日 DJ（ドパガキ早回し）                                                 |               | napochaan_vrc2/2032057441299702270 |
| 2026-03-10  | DJ       | あめぱん 誕生日 DJ                                                                   |               | napochaan_vrc2/2031694135057678429 |
| 2026-03-06  | DJ       | VR で DJ 出演（21:40〜, hyperflip）                                                  |               | naporin24690/2033148322387742820   |
| 2026-02-21  | DJ       | **「超すごい DJ イベント」@VRChat**（nago 誕生日メンツ／Booth2Booth 誕生のきっかけ） | ★             | napochaan_vrc2/2022521138967122056 |
| 2026-01-30  | DJ       | nago 遅れた誕生日 DJ パーティー（Nagotzi, 22:00〜, 破壊と替え歌）                    |               | napochaan_vrc2/2016751258326225126 |
| 2026-01-24  | DJ       | Initium vol.10 に DJ 出演（VR, Main, 21:00〜）                                       |               | napochaan_vrc2/2015005908435419205 |
| 2026-01-22  | DJ       | FLICK Vol.2 at IV AKIHABARA に DJ 出演（23:00–05:00, ¥1,500+1D）                     |               | naporin24690/2012353999576736178   |
| 2026-01-18  | support  | #Harmony0118 あみだくじシステム実装                                                  |               | naporin24690/2012874773630685212   |
| 2026-01-04  | DJ       | DJ 出演（クリスマスブートレグ + ハイフリ）                                           |               | napochaan_vrc2/2007765624781721994 |

### 2025年

| publishedAt | category | title                                                                 | 主催 | status                             |
| ----------- | -------- | --------------------------------------------------------------------- | ---- | ---------------------------------- |
| 2025-12-13  | DJ       | FLICK vol.1 at altoto 下北沢 に DJ 出演（15:00–21:00, ¥1,500）        |      | naporin24690/1994028242781590003   |
| 2025-12-10  | support  | 企画展『思弁的な音楽』 r-906《額縁の言葉 : I》 背景映像・システム構築 |      | naporin24690/1998715240075374793   |
| 2025-12-06  | support  | Vket2025Winter「PrizeSpider」クレーンゲームギミック 一部 Udon 実装    |      | napochaan_vrc2/1998666475687784803 |
| 2025-11-16  | support  | 「解釈系 / ハーモニー」特設サイト 実装（試聴自動再生）                |      | naporin24690/1990007733005979981   |
| 2025-10-27  | DJ       | 現実で DJ 出演（jersey club/hyperflip）                               |      | naporin24690/1982700926864634345   |
| 2025-10-26  | DJ       | DJ 出演（jersey club/hyperflip）                                      |      | napochaan_vrc2/1984560051710017773 |
| 2025-09-27  | DJ       | #SAKURA_MOONLIGHT RoguE に DJ 出演（22:55〜, DnB/HyperFlip）          |      | napochaan_vrc2/1964916711574143203 |
| 2025-09-22  | DJ       | DJ 出演（22:20〜, Colour/Hyper）                                      |      | napochaan_vrc2/1956306353821307081 |
| 2025-09-13  | support  | PAE2.0 ドットレカ 写真ギミック制作協力（= History #1）                |      | naporin24690/1966836184686211464   |
| 2025-08-17  | DJ       | 誕生日 DJ（22:00〜, なぽなご）                                        |      | napochaan_vrc2/1956306353821307081 |
| 2025-03-15  | support  | アルバム「UMANITY」特設サイト 実装（= History #7, ahub.jp/umanity）   |      | naporin24690/1900835701912203467   |

### 2024年

| publishedAt | category | title                                                                         | status                           |
| ----------- | -------- | ----------------------------------------------------------------------------- | -------------------------------- |
| 2024-12-12  | support  | DEMiXUS システム作成（企画展「共に在る音楽」）（= History #10）               | naporin24690/1867179943060504598 |
| 2024-12-12  | support  | W♭Y♭K M♭C K システム作成（企画展「共に在る音楽」）（= History #9）            | naporin24690/1867175063893811585 |
| 2024-11-29  | support  | Event Exhibition with LLM 展示ワールド（WebSocket + LLM 即時更新）            | naporin24690/1862529523344187817 |
| 2024-09-14  | support  | 工房祭2024 ファイブブロッカーステージ 技術提供（= History #12）               | naporin24690/1834900593808490701 |
| 2024-08-01  | 登壇     | Workers Tech Talk #3 登壇（DurableObjects / WebSocket Tips）（= History #13） | naporin24690/1818952959713218818 |
| 2024-06-22  | 登壇     | Hono Conf 2024 初登壇（英語）（= History #14）                                | naporin24690/1804542363895001374 |

---

## 4. 主催イベント（napochaan 開催側）まとめ

| イベント                           | 日付         | 会場                         | フライヤー   | status                             |
| ---------------------------------- | ------------ | ---------------------------- | ------------ | ---------------------------------- |
| 「超すごい DJ イベント」           | 2026-02-21頃 | VRChat                       | 要確認       | napochaan_vrc2/2022521138967122056 |
| Booth2Booth vol.01                 | 2026-04-24   | VRChat                       | **本人制作** | naporin24690/2038209695996158212   |
| Booth2Booth vol.02                 | 2026-05-23   | VRChat                       | **本人制作** | naporin24690/2050895908850762215   |
| Booth2Booth vol.03                 | 2026-06-06   | VRChat                       | 不明         | naporin24690/2063217578395279809   |
| PROLOGUE                           | 2026-05-08   | IV AKIHABARA                 | 不明         | naporin24690/2042951785502118342   |
| 神田Roost シーシャ DJ オールナイト | 2026-05-30   | Shisha Café&Bar Roost 神田店 | **本人制作** | naporin24690/2056691334229201294   |

- **「超すごい DJ イベント」**（VRChat）が **Booth2Booth が生まれるきっかけ**になったイベント。LINEUP: napochaan (@naporin24690) / primo (@primo_vrc) / nagotzi (@nago_vrc) / Lateness (@C_Lateness) / baruru\*be (@r7748806675354)。
- Booth2Booth シリーズの公式サイト **booth2booth.com** も本人がデザイン/実装（1-C / LOG 2026-04-12）。
- 神田Roost は Nago / naporitan 名義での出演を含む主催。LINEUP: naporitan / NIFF / Nago / たたまれ / suno / もちたろう。

## 5. CMS 投入時の補足

- **category 拡張提案**: `live` を廃し **`DJ` / `VJ` / `DJ/VJ`** に細分化。さらに **`support`（技術サポート・協力・実装提供）**、**`登壇`（英語含む）** を追加。`release`（自主制作物公開）/ `update`（更新）は維持。
- **NEWS 掲載基準**: 主催イベント＋関係者・会場の規模が大きいもののみ（日常出演は LOG）。
- **`主催` は category と別 flag**。LOG/NEWS の「主催」列で管理。
- **History は全34件、ダイアログの詳細コメント＋外部リンクを取得済み**（1-A）。
- **重複は統合済み**: ドットレカ↔#1、工房祭↔#12、UMANITY↔#7、登壇2件↔#13/#14、2024-12-12 の2件 ↔ DEMiXUS#10 / W♭Y#9。LOG では `(= History #n)` と明示。
- **名取さなさんのファンアプリは別アプリ2件**（#33 / #34、説明文も別内容で確認）。
- **本サイト（napochaan.com リニューアル）も LOG / 1-C に追加**（2026-06-09, release）。
- **要確認**: #Randmizer の DJ/VJ 区分、PROLOGUE/vol.03 のフライヤー担当、「超すごい DJ イベント」の正確な開催日（投稿は 2026-02-14「来週」→ 02-21 頃と推定）。
- **`support` vs `release`**: 他者プロジェクトへの実装提供は support、自主公開物は release に振り分け（解釈系/UMANITY/ドットレカ 等の受託系は support 扱い。要レビュー）。
