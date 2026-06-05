# napochaan.com — Design Tokens Spec

> 好み発掘ゲーム（AskUserQuestion + HTML プレビュー）で確定した design token の単一ソース。
> 実装フェーズではこの spec を Panda CSS の token 定義に落とす（実装は subagent に委譲）。
> プレビュー HTML: `/.tmp-mockups/*.html`（`open` で確認用、コミット対象外）。

最終更新: 2026-06-05

---

## 0. ムード（確定）

**白地・デジタルグラフィックデザイン・マキシマリズム**

- 白〜淡グレーの**方眼グリッド**背景（製図/blueprint）
- **黒のグロテスク体を重ねた**マキシマルなタイポグラフィ
- アクセント = **エレクトリックブルー（主）＋ 赤（spot）**
- **等幅フォントのシステム注釈**を装飾化（タイムスタンプ・座標・QR・`not found`・`gen/alive`）
- チェッカーフラッグ・十字✕・矢印→・QR/バーコード
- 背景で **Conway's Game of Life** が常時微動（グリッド＝生きた盤面）

参考画像: graphic-design poster 系（this is my graphic vol.13 風）/ ネットレーベル・テクノフライヤー（青白黒・digi font）。
※ booth2booth のダークホログラフィックとは**あえて切り離した別物**。Y2K/レイヴ/丸ゴシックは不採用。

---

## 1. カラー（確定 — 12段階 OKLCH, light-first, クールニュートラル）

全値は OKLab→sRGB 変換 + WCAG 2.1 式で実計算。Radix Colors の 12 段階セマンティクス（1=app bg … 9=solid … 11=low-contrast text … 12=high-contrast text）。

### gray — クールニュートラル（hue 265, 微量 chroma）

| step | oklch                    | hex       | 役割                      |
| ---- | ------------------------ | --------- | ------------------------- |
| 1    | `oklch(0.963 0.003 265)` | `#f2f3f5` | app bg（paper）           |
| 2    | `oklch(0.945 0.004 265)` | `#ebedef` | subtle bg                 |
| 3    | `oklch(0.918 0.005 265)` | `#e2e4e7` | UI element bg             |
| 4    | `oklch(0.900 0.006 265)` | `#dcdee2` | hovered UI bg             |
| 5    | `oklch(0.884 0.007 265)` | `#d6d9dd` | active / **grid line**    |
| 6    | `oklch(0.845 0.008 265)` | `#c9ccd1` | subtle border             |
| 7    | `oklch(0.785 0.010 265)` | `#b6b9c0` | UI border / focus         |
| 8    | `oklch(0.700 0.013 265)` | `#9a9ea7` | hovered border            |
| 9    | `oklch(0.560 0.016 265)` | `#70757e` | solid                     |
| 10   | `oklch(0.510 0.017 265)` | `#616670` | solid hover               |
| 11   | `oklch(0.430 0.018 265)` | `#4b505a` | low-contrast text         |
| 12   | `oklch(0.145 0.020 265)` | `#060a13` | high-contrast text（ink） |

### blue — エレクトリックアクセント（hue 266）

| step | oklch                    | hex       | 役割                             |
| ---- | ------------------------ | --------- | -------------------------------- |
| 1    | `oklch(0.972 0.012 266)` | `#f2f6fe` | app bg                           |
| 2    | `oklch(0.955 0.024 266)` | `#e9f0ff` | subtle bg                        |
| 3    | `oklch(0.925 0.046 266)` | `#d8e6ff` | UI element bg                    |
| 4    | `oklch(0.892 0.070 266)` | `#c6dbff` | hovered UI bg                    |
| 5    | `oklch(0.850 0.100 266)` | `#afcdff` | active/selected                  |
| 6    | `oklch(0.788 0.142 266)` | `#8fb7ff` | subtle border                    |
| 7    | `oklch(0.700 0.192 266)` | `#6696ff` | border / **focus ring**          |
| 8    | `oklch(0.600 0.245 266)` | `#3b6cff` | hovered border                   |
| 9    | `oklch(0.490 0.287 266)` | `#1a34ff` | **solid（brand blue）/ text 可** |
| 10   | `oklch(0.450 0.270 266)` | `#162ae7` | solid hover                      |
| 11   | `oklch(0.520 0.225 266)` | `#2c55e8` | low-contrast text                |
| 12   | `oklch(0.330 0.150 266)` | `#112981` | high-contrast text               |

### red — danger / spot（hue 25）

| step | oklch                   | hex       | 役割                         |
| ---- | ----------------------- | --------- | ---------------------------- |
| 1    | `oklch(0.972 0.013 25)` | `#fff3f1` | app bg                       |
| 2    | `oklch(0.957 0.024 25)` | `#ffebe9` | subtle bg                    |
| 3    | `oklch(0.930 0.044 25)` | `#ffddd9` | UI element bg                |
| 4    | `oklch(0.898 0.066 25)` | `#ffcdc7` | hovered UI bg                |
| 5    | `oklch(0.858 0.098 25)` | `#ffb7b0` | active/selected              |
| 6    | `oklch(0.800 0.140 25)` | `#ff9890` | subtle border                |
| 7    | `oklch(0.728 0.182 25)` | `#ff716b` | border / focus               |
| 8    | `oklch(0.672 0.225 25)` | `#ff4648` | hovered border               |
| 9    | `oklch(0.630 0.256 25)` | `#ff002b` | **solid（brand red）/ spot** |
| 10   | `oklch(0.585 0.250 25)` | `#ec001e` | solid hover                  |
| 11   | `oklch(0.530 0.205 25)` | `#c71626` | low-contrast text            |
| 12   | `oklch(0.350 0.130 25)` | `#6f0d13` | high-contrast text           |

### WCAG 2.1 検証（白地 paper での主要ペア）

| fg on bg             | ratio    | AA-normal(4.5) | AA-large/UI(3.0) |
| -------------------- | -------- | -------------- | ---------------- |
| ink(gray-12) / paper | 17.83    | ✓              | ✓                |
| gray-11 / paper      | 7.29     | ✓              | ✓                |
| blue-9 / paper       | 6.35     | ✓              | ✓                |
| blue-11 / paper      | 5.30     | ✓              | ✓                |
| red-9 / paper        | 3.58     | ✗              | ✓                |
| red-11 / paper       | 5.30     | ✓              | ✓                |
| ink(黒) on red-9     | **4.98** | ✓              | ✓                |
| paper(白) on blue-9  | 6.35     | ✓              | ✓                |

**ルール:** 青の文字＝blue-9 で可。**赤の文字＝必ず red-11**（red-9 は本文 NG）。
**赤 solid ボタン = red-9 + 黒(ink)ラベル = 4.98:1**（純赤を維持しつつ AA。白文字は使わない）。

### semantic token（light theme）

| token                                 | step               | 備考                    |
| ------------------------------------- | ------------------ | ----------------------- |
| bg.canvas / subtle / muted / emphasis | gray-1 / 2 / 3 / 5 |                         |
| fg.default / muted / subtle           | gray-12 / 11 / 9   | subtle は大文字/UI のみ |
| fg.onSolid                            | gray-1（paper）    | 青 solid 上の白文字     |
| fg.onDanger                           | gray-12（ink）     | **赤 solid 上は黒文字** |
| border.subtle / default / strong      | gray-6 / 7 / 8     |                         |
| border.focus                          | blue-7             | focus ring              |
| grid.line                             | gray-5             | 26px グリッド           |
| accent.solid / solidHover             | blue-9 / 10        |                         |
| accent.text                           | blue-9             | text-safe               |
| accent.border                         | blue-7             |                         |
| danger.solid / solidHover             | red-9 / 10         | ラベルは ink(黒)        |
| danger.text                           | red-11             |                         |
| danger.border / spot                  | red-7 / red-9      | spot 装飾は red-9       |

> dark theme は将来追加（light-first で確定、必要時に反転マッピング）。

---

## 2. タイポグラフィ（確定）

Adobe Fonts kit: `<link rel="stylesheet" href="https://use.typekit.net/izz7men.css">` + Google Fonts。

| 役割                              | フォント                 | 指定                                    | 備考                                                             |
| --------------------------------- | ------------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| display（Latin見出し・heavy全般） | **digibop**              | `"digibop"` 400 + italic                | 丸みのあるレトロデジタル。和文の重い見出しもこれが担当           |
| 和文（本文）                      | **M PLUS 1**             | 400〜500 のみ                           | 700/900 は丸く崩れる → **禁止**。重い和文は出さず digibop に委譲 |
| mono / システム文字               | **Config Mono Variable** | `"config-mono-vf"` 200–700 roman+italic | タイムスタンプ/座標/not found 等「機械の声」                     |

不採用（kit 在中）: tephra（青赤レイヤリングが要れば再検討）、Zen Kaku Gothic New。LINE Seed 等の丸ゴは世界観と不一致で除外。

### タイポスケール（確定 — [4]）

**デュアルスケール**: 本文は穏やか(1.2 Minor Third 固定px)、display は clamp で爆発。tiny mono ↔ 巨大見出しの極端な対比（参考画像直系）。

```
fontSize（base = md 16px）
  TEXT (1.2比・固定)   2xs 11 / xs 12(caption/mono) / sm 14 / md 16(body) / lg 19 / xl 23
  HEADING/DISPLAY (clamp)
    h3       23
    h2       clamp(28px, 3.5vw, 33px)
    h1       clamp(33px, 5vw, 51px)
    display  clamp(56px, 9vw, 96px)
    hero     clamp(72px, 13vw, 160px)
```

**line-height（C エディトリアル）**
| token | 値 | 用途 |
|---|---|---|
| none | 0.9 | hero / display（digibop 巨大） |
| tight | 1.2 | heading（h1–h3） |
| snug | 1.4 | mono / システム文字 |
| normal | 1.7 | 本文（Latin） |
| jp | 1.9 | **和文本文 / blog** |

**letter-spacing**
| token | 値 | 用途 |
|---|---|---|
| tighter | -0.04em | hero / display |
| tight | -0.02em | heading |
| normal | 0 | 本文 |
| wide | 0.04em | mono ラベル |
| wider | 0.12em | uppercase system kicker（`// DIGITAL`） |

**font-weight**: digibop=400 のみ / M PLUS 1=400・500 / config-mono-vf=400 既定・500/600 強調。

### タイポグラフィ組版パターン（確定 — kinetic / layered）

参考: typing flyer 系の「タイポを素材として構成する」使い方を目標水準とする。**display フォントは digibop のまま**（tephra 不採用）、組版技法でこの鋭さ/迫力に寄せる。

| pattern                 | 内容                                                                                                             | 用途                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **T2 エコー/重ね**      | 同じ語を 2–3 層オフセット重ね（ベタ ink + 青 offset + アウトライン offset）。digibop italic                      | **hero/wordmark の主役演出** |
| **T1 マーキー帯**       | 語を反復したスクロール帯 + チェッカー。上下/セクション区切り。stepped or linear、`prefers-reduced-motion` で停止 | セクション帯・区切り         |
| **T5 outline/solid 対** | 同じ語を線だけ版(`-webkit-text-stroke`)とベタ版で並置                                                            | 見出しのアクセント           |
| **T6 クレジット積み**   | digibop italic で語を密に縦積み・寄せ（トラックリスト的）                                                        | set list・credits・索引      |
| **T7 寄生ラベル**       | 巨大文字に小さな mono ラベル（vol.13・(a)・座標）を上付き/寄生                                                   | 見出し装飾                   |

不採用: T4 縦組みカナ / T3 矢印の字形統合（標準化しない。単発装飾としては可）。

---

## 3. モーション（確定）

- **基調 = メカニカル/stepped**（`steps()`・点滅カーソル・スナップ）
- **スパイス = グリッチ/スクランブル** → hero 初回ロード・now playing・ページ遷移 **＋ 重要なリンク/ボタン hover**
- **背景ライフゲーム = 7fps / 中密度**（淡い青セル + 稀に赤、本文コントラスト不可侵）
- `prefers-reduced-motion` で全停止 / `visibilitychange`・`IntersectionObserver` で停止

### motion token（ドラフト）

```
duration: instant 0ms / fast 90ms / base 150ms / snap 180ms / slow 280ms / glitch ~630ms
easing:   step-1 steps(1) / step-snap steps(3,end) / linear(life・caret)
anim:     blink 1s steps(1) infinite / snap-hover translate(3px,3px) steps(3)
          rgb-shift（"ここぞ"）/ scramble（JS utility: hero・now-playing・遷移・重要hover）
life:     7fps（rAF + アキュムレータ）/ cell 26px / alive≈rgba(blue,0.11) / 稀 red 0.10
```

---

## 4. スペーシング / グリッド（確定 — グリッド一体型）

**可視グリッド = レイアウト単位**。base 4px、module 24px(=4×6, 1 grid cell)。全要素を方眼線に吸着。
グリッドは 26px → **24px に変更**（4 で割れる数に）。

```
base = 4px,  module = grid.cell = 24px
space: 0  1=4  2=8  3=12  4=16  6=24(module)  8=32  12=48  16=64  24=96
（0.5=2px は hairline 微調整用に許容）
```

| semantic     | px  | 用途                       |
| ------------ | --- | -------------------------- |
| inline       | 8   | テキスト内・チップ間       |
| element      | 12  | 要素間                     |
| block        | 24  | ブロック間（= 1 module）   |
| section      | 48  | セクション間（= 2 module） |
| page         | 24  | ページ余白                 |
| headerHeight | 72  | = 3 cell                   |

> column grid（カラム数・max-width）は **[5] component** で決定。
> ライフゲーム背景の cell も 24px に統一。

---

## 5. 角丸 / ボーダー（確定）

**radius**
| token | 値 | 用途 |
|---|---|---|
| none | 0 | **既定（ほぼ全要素）**。card/button/input は 0 |
| pill | 9999px | **ラベル系のみ**（tag・status chip）。シャープの中の対比アクセント |

**border width**
| token | 値 | 用途 |
|---|---|---|
| hairline | 1px | grid line・subtle divider |
| default | 2px | 枠・カード・button |
| strong | 3px | 強調・focus ring |

**focus-ring（確定）**: layerStyle `focusRing` = 2px dashed / accent.solid(blue-9) / offset 2px / radius none。全 interactive に `_focusVisible: { layerStyle: 'focusRing' }` で統一（システム/ターミナル調）。

---

## 6. コンポーネント（確定 — content 文脈駆動 [5]）

CLAUDE.md の UI ルール「機械的UIを避け、情報の性質に適切なUIを文脈から選ぶ」に従い、コンテンツごとに UI を決定。実装順は HTML+CSS → react-aria-components → 独自、の順（CLAUDE.md）。

| #   | コンテンツ                          | 採用 UI                        | 要点                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- | ---- | ---------------------------- |
| 1   | hero（index top）                   | **タイポ主役**                 | 画面を埋める巨大 digibop + 散らした system 注釈、背景 life。表現重視                                                                                                                                                                                                                                                                                                                                        |
| 2   | お知らせ news                       | **システムログ風リスト**       | mono 日付 + 種別tag + title、dashed区切り。時系列・高密度                                                                                                                                                                                                                                                                                                                                                   |
| 3   | works（実績/CMS混在）               | **版面インデックス表**         | `no                                                                                                                                                                                                                                                                                                                                                                                                         | title | type | year | →`。サムネ無し開発仕事も成立 |
| 4   | DJ/VJ 出演履歴                      | **縦タイムライン**             | 日付軸 + 点。過去=muted / これから=**青で強調**。軌跡                                                                                                                                                                                                                                                                                                                                                       |
| 5   | gallery（flyer/VRChat）             | **グリッド吸着・可変スパン**   | アスペクト毎に N×M セル占有、方眼整列。click で lightbox                                                                                                                                                                                                                                                                                                                                                    |
| 6   | blog（zenn/静か集約）               | **番号付き読み物インデックス** | index番号 + title + 抜粋 + 出典tag + 読了時間。本文 prose は type token 適用                                                                                                                                                                                                                                                                                                                                |
| 7   | about（skill/like/want/doing）      | **whoami システム出力**        | config-mono の key-value。「データとしての自分」。skill は pill tag 併用                                                                                                                                                                                                                                                                                                                                    |
| 8   | live cursor（DurableObjects）       | **十字✕ + mono id ラベル**     | 各閲覧者 = 色 + ✕ + #id。座標共有の presence                                                                                                                                                                                                                                                                                                                                                                |
| -   | footer                              | **システムステータスバー**     | 2px 上罫線 + mono：copyright / build hash / `life: running` / gen                                                                                                                                                                                                                                                                                                                                           |
| -   | **typography-band**（四辺フレーム） | **画面四辺を囲む青の額縁帯**   | booth2booth 流。**blue-9 ベタ地 + 白 mono 大文字**、帯幅 **24px = grid module**、縦辺は `writing-mode:vertical-rl`。テキスト反復を2トラックでシームレス。**スクロール速度反応**(上/左=順・下/右=逆、静止時ゆるドリフト)。`prefers-reduced-motion` 停止 / `aria-hidden` / `pointer-events:none` / safe-area-inset 対応。content は帯幅ぶん inset。実装は scroll velocity を rAF で減衰(GSAP 不要・vanilla可) |

### 抽出された primitive（実装対象）

button / link / tag(pill) / badge・status(now playing・rec) / card・frame(2px) /
section-heading(番号+title) / system-annotation(mono) / input(contact) /
avatar / image-frame(+lightbox) / timeline-item / prose(blog本文)

primitive の variant は確定済み token（color semantic・spacing module24・radius 0+pill・border 1/2/3px・type）から導出。
button 例: solid(blue-9/白文字) / danger(red-9/**黒文字**) / outline(2px ink) / ghost。tag は pill のみ。

---

## 7. richtext / prose（確定 — Payload Lexical 描画指針）

Payload の `RichText`（`@payloadcms/richtext-lexical/react`）に `JSXConvertersFunction` を渡し、各ノード/inline format を以下の styled 要素にマッピングする。本文行間は `lineHeights.jp`(1.9)。

| semantic                   | スタイル指針                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| heading h1–h6              | font=display(digibop)。サイズ: h1→`fontSizes.h1` / h2→`h2` / h3→`h3`(23) / h4→`xl`(23) / h5→`lg`(19) / h6→`md`(16)。lineHeight tight |
| paragraph                  | `md`(16) / lineHeight jp(1.9) / fg.default                                                                                           |
| **strong（bold）**         | **fontWeight 500（medium）＋ color accent.text（青）**（M PLUS 1 は700不可。太さでなく色で強調）                                     |
| em（italic）               | font-style italic                                                                                                                    |
| underline                  | text-decoration underline（リンクと区別: リンクは色＋hover反転）                                                                     |
| **strikethrough（s/del）** | line-through ＋ **color danger.text（赤）**                                                                                          |
| inline code                | font mono / bg.subtle / borderWidth hairline / borderColor border.subtle / radius none / color fg.default / px inline                |
| **code block（pre）**      | **暗ターミナル**: bg fg.default(ink) / color bg.canvas(明) / font mono / p element / 上部に lang ラベル可 / radius none              |
| **blockquote**             | **ターミナル風**: font mono / color fg.muted / 行頭に `>`（`_before` で付与）/ 左 padding。枠より "コマンド出力" 感                  |
| link                       | 既存 `Link`（accent.text・hover 反転）                                                                                               |
| list（ul/ol）/ listitem    | prose 版: ul=▸(accent) / ol=`decimal-leading-zero`(01.) mono accent / lineHeight jp                                                  |
| horizontalrule             | borderTop 2px ink もしくは dashed の区切り                                                                                           |
| upload（画像）             | 既存 `Figure`（next/image + 2px枠 + figcaption）                                                                                     |

実装: `src/components/rich-text/`（`RichText` ラッパ + converters + 要素 styles）。`Heading` は単体 primitive（`src/components/heading/`、level 1–6、prose 外でも使用）としても用意し、richtext の heading converter から再利用。要素ごとに class を付与（no-child-selectors 順守）。

---

## TODO（残り）

- [ ] Heading primitive + RichText 要素セット/converter を実装
- [ ] 全部入り更新プロトタイプで component 群を視覚検証
- [ ] tokens を Panda CSS 定義に実装（subagent 委譲・TDD）
- [ ] 各 primitive/component を react-aria ベースで実装（小タスク分割 → difit review）
- [ ] dark theme マッピング
