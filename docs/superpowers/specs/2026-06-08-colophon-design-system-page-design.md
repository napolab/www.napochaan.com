# colophon — 公開 design-system ページ化

- date: 2026-06-08
- branch: feat/colophon-design-system (to be created from up-to-date main)
- supersedes: 現 `/colophon`(making.md / code.md / stack / source の4節構成)
- related memory: [[colophon-design-system-page]] / [[design-direction]] / [[site-pages-ia]]

## Context

現 `/colophon` は「サイトの作り方・コーディング作法」を述べる静的ページで、`site[]`(7マニフェスト)・`code[]`(7マニフェスト)・`stack`・`source` の4節を持つ。コピーはすべて断定マニフェスト調(例「機械的なUIを、徹底的に避ける。」)。

このサイトには別に `src/app/(design-system)/`(SiteShell を持たない開発内部レイアウト)があり、28コンポーネントの単体ショーケースページが並ぶ。今回はこの内部カタログを**そのまま公開する**のではなく、colophon を「このサイトの design-system を見せる公開ページ」へ再設計する。掲載するのは (1) 設計思想、(2) タイポグラフィの jump 率・font 選定基準、(3) 代表コンポーネントの厚選カタログ。

### 決定的な構造発見

`SiteShell`(`src/components/site-shell/index.tsx`)は既に `TypographyBand` / `GameOfLife` / `SysBar` を `position:fixed` で描画している。つまり colophon を開いた瞬間、この3コンポーネントは**既に画面に効いている**(4辺の枠・背景で蠢くセル・上部ヘッダー)。これらは fixed ゆえ「箱の中の inline デモ」が原理的に不可能だが、逆に**ページ自身がライブデモ**になっている。よって colophon はこの3つを再描画せず、**実物を指す**(「あなたを囲む枠が TypographyBand」「背後のセルが GameOfLife」「上のヘッダーが SysBar」)。これは CLAUDE.md ui-rules「機械的UIを避け、文脈に沿ったUIにする」を最も強く満たす:このページは design-system を _説明する_ のではなく、design-system の _中で動いている_。

## Decisions (approved)

- **全体構造**: 1枚完結ページに統合。内部 `(design-system)/*` は開発用に温存(改変しない)。
- **コンポーネントカタログの濃度**: 厚選・文脈付き(全28を平らに並べない)。
- **文体 = 声のレイヤリング**: 語り手(lead・節の導入・タイポ散文・コンポ解説)は news/blog と同じ **「〜んだよなぁ😁」調(緩)**。既存の14マニフェスト(`site[]`/`code[]`)は**断定のまま温存(鋭)**。緩い語り手が鋭いルールを挟む二層構造。
- **厚選コンポーネント**: 04節カタログ = 8個 + 03節タイポに `TypographyBand` 1個。表示は2モード:
  - 囲み込みデモ(フロー要素・6個・04節): `ScrambleText` / `Marquee` / `EchoText` / `Timeline` / `Card` / `SystemAnnotation`
  - 周辺クローム=実物を指す(fixed・3個): `TypographyBand`(03節) / `GameOfLife`(04節) / `SysBar`(04節)
  - → 04節の「8個」= 囲み込み6 + クローム2(GameOfLife/SysBar)。TypographyBand は03節で別途扱う。
- **節順**: 思想 → タイポ → コンポ → stack → source(「なぜこう作るか」を語り、その帰結として視覚システムを見せる)。

## Layout

```
┌─ PageHeader ─────────────────────────────────────────────┐
│ kicker     : // このサイトについて                          │
│ title      : colophon                                     │
│ lead (緩)  : 「このサイト、こうやって作ってるんだよなぁ😁」    │
│ annotation : 壊して · ほどいて · 組み直す                   │
└───────────────────────────────────────────────────────────┘
  ▲ この時点で TypographyBand(枠)/ GameOfLife(背景)/ SysBar(上)は既に画面に在る

01 site    SectionHeading no="01" more="$ cat making.md"
           └ Manifesto(既存7件・断定のまま)

02 code    SectionHeading no="02" more="$ cat code.md"
           └ Manifesto(既存7件・断定のまま)

03 type    SectionHeading no="03" more="$ cat type.md"
           ├ intro(緩)
           ├ スケール梯子(実トークン値で可視化)
           │    body 16 ─┬─ md   1.00x  本文
           │    h3   23  │  ×1.44  小見出し
           │    h2 28→33 │  clamp  節見出し
           │    h1 33→51 │  clamp  ページ見出し
           │    disp 56→96  clamp  ディスプレイ
           │    hero 56→160 clamp  ヒーロー(body比でjump率維持)
           ├ font 役割表(display=digibop / body=M PLUS 1 / mono=config-mono-vf + 選定基準)
           └ 「いま画面を囲ってる枠、あれが TypographyBand なんだよなぁ」← 実物を指す

04 ui      SectionHeading no="04" more="$ ls components/"
           ├ intro(緩):「このページ自体が design-system の中で動いてる」
           ├ 周辺クローム(実物を指す):
           │    ▸ いま囲ってる枠      → TypographyBand
           │    ▸ 背後で蠢くセル      → GameOfLife
           │    ▸ 上のヘッダー        → SysBar
           └ 囲み込みデモ(6・各=解説(緩)+生デモ):
                ScrambleText  hoverで解読
                Marquee       横スクロール帯
                EchoText      多層エコー見出し
                Timeline      年表(upcomingをaccent)
                Card          コンテンツ枠
                SystemAnnotation  mono注釈(muted/accent/danger)

05 stack   SectionHeading no="05" → 既存 dl(framework/edge/cms/ui/quality)無変更

06 source  SectionHeading no="06" → 既存 repo リンク(ScrambleText)無変更
```

## Components

すべて既存 `@components/*` の再利用。新規 UI コンポーネントは作らない。colophon ページ配下に薄い表示用 `_components/` を足すのみ。

### 新規(colophon 配下)

- **`colophon/_components/type-scale/`** — スケール梯子。prop `{ rows: readonly { token: string; px: string; ratio: string; role: string }[] }`。各行 = token名(mono)+ 実寸プレビュー(その fontSize で "Ag" 等を描画)+ 比率 + 役割。見出し要素は持たない(節見出しは 03 の `SectionHeading`)。
- **`colophon/_components/font-roles/`** — font 役割表。prop `{ fonts: readonly { family: string; role: string; why: string }[] }`。`<dl>` で family(各 fontFamily で描画)/ role / why。
- **`colophon/_components/component-demo/`** — 1コンポーネントの「解説 + 生デモ」枠。prop `{ name: string; why: string; children: ReactNode }`。bordered cell に mono のコンポ名 + 緩い why + `children`(生デモ)。children に実コンポーネントを `page.tsx` 側で直書きする(データとUIの分離を保つ)。
- **`colophon/_components/ambient-pointer/`** — 周辺クロームを指す行。prop `{ label: string; target: string }`。`▸ {label} → {target}` の mono 行。再描画はしない(実物が既に画面に在る)。

### 再利用

- `@components/page-header`(`PageHeader`)、`@components/section-heading`(`SectionHeading`)、`@components/scramble-text`、`@components/marquee`、`@components/echo-text`、`@components/timeline`、`@components/card`、`@components/system-annotation`。
- 既存 `colophon/_components/manifesto/`(`Manifesto`)はそのまま 01/02 で使用。

### 表示モードの根拠

`TypographyBand` / `GameOfLife` / `SysBar` は `position:fixed`。箱に閉じ込めた再描画は二重化・レイアウト破壊を招くため**しない**。`ambient-pointer` で実物(SiteShell が描いている本物)を指す。`Timeline`/`Card`/`Marquee`/`EchoText`/`SystemAnnotation` はフロー要素なので `component-demo` 内に生で置ける。`ScrambleText` は client component だが RSC ページに import 可(default `trigger="self"` を使い、showcase のような host ref state は不要)。

## Data — `colophon/content.ts` 拡張

既存 `colophon` オブジェクトに節を足す。`site[]` / `code[]` / `stack` / `source` は**無変更**。`lead` のみ 〜んだよなぁ調に差し替え。

```ts
export const colophon = {
  title, kicker,
  lead,                      // ← 〜んだよなぁ調に変更
  annotation,
  site[], code[],            // 無変更(断定マニフェスト)

  typography: {              // 新
    intro: string,           // 緩い導入
    scale: readonly { token: string; px: string; ratio: string; role: string }[],
    fonts: readonly { family: string; role: string; why: string }[],
    bandNote: string,        // TypographyBand を指す一文(緩)
  },

  components: {              // 新
    intro: string,
    ambient: readonly { label: string; target: string }[],   // 3クロームを指す
    items: readonly { name: string; why: string }[],          // 6個の解説(緩)。生デモは page.tsx で対応付け
  },

  stack[], source,           // 無変更
} as const;
```

`components.items` はテキスト(name/why)のみを持ち、生デモの JSX は `page.tsx` で name をキーに対応付けて描画する(content.ts に JSX を持ち込まない)。

### scale 行の実値(トークン由来)

| token   | px     | ratio(body=md比) | role         |
| ------- | ------ | ---------------- | ------------ |
| md      | 16     | 1.00x            | 本文         |
| h3 / xl | 23     | ×1.44            | 小見出し     |
| h2      | 28→33  | clamp(3.5vw)     | 節見出し     |
| h1      | 33→51  | clamp(5vw)       | ページ見出し |
| display | 56→96  | clamp(9vw)       | ディスプレイ |
| hero    | 56→160 | clamp(15vw)      | ヒーロー     |

### fonts 行(役割と選定基準)

| family         | role    | why(緩い一言・要清書)                      |
| -------------- | ------- | ------------------------------------------ |
| digibop        | display | 黒グロテスクの打撃力。見出しで殴る役       |
| M PLUS 1       | body    | 和文の可読性。next/font で安定供給         |
| config-mono-vf | mono    | システム文字の地の声。数値・注釈・コマンド |

## Voice(コピー方針)

- **lead / 各節 intro / typography 散文 / 6コンポの why / ambient-pointer の文** → 「〜んだよなぁ😁」調(緩)。実際の文面は design-writer エージェントに委ねる。
- **`site[]` / `code[]` の14マニフェスト** → 断定のまま無変更。
- 二層が同居することで「緩い語り手が鋭い原則を紹介する」声になる。

## Accessibility / 規約

- 各 `<section>` は `SectionHeading`(`level` 指定)で見出しを持つ。`<h1>` は PageHeader の1個のみ、h2→h3 のスキップを作らない。
- スケール梯子・font 表は装飾的な巨大文字を含むが、意味は role 列(テキスト)で担保。巨大プレビュー文字は `aria-hidden` 可。
- `ambient-pointer` は実 DOM(TypographyBand 等)への言及テキスト。スクリーンリーダー上は単独で意味が通る文にする。
- スタイルは各 `styles.css.ts` にトークンで閉じる。`data-*` で variant 表現。インライン style は CSS 変数のみ。
- 新規 `_components/*` は TDD(Red→Green→Refactor, vitest browser mode)。
- `revalidate = 3600`(ISR)維持。content はリポジトリ由来でCMS非依存。

## YAGNI(やらないこと)

- 内部 `(design-system)/*` の公開化・SiteShell 化・改変はしない。
- 28コンポ全網羅・カテゴリ別全生表示はしない(厚選8のみ)。
- 新規の共有 UI コンポーネント(`src/components/*`)は作らない。
- `site[]`/`code[]`/`stack`/`source` のコピー改変はしない(lead のみ変更)。

## Build order(粒度=小タスク)

1. `content.ts` 拡張(typography / components 節 + lead 差し替え)— 型先行。
2. `_components/type-scale/`(TDD)。
3. `_components/font-roles/`(TDD)。
4. `_components/component-demo/`(TDD)。
5. `_components/ambient-pointer/`(TDD)。
6. `page.tsx` 組み上げ(03/04 節追加、節番号 05/06 へ繰り下げ、生デモ対応付け)。
7. コピー清書(design-writer エージェントに 〜んだよなぁ調を依頼)。
8. `pnpm lint && pnpm typecheck` → difit で review 依頼。

```

```
