# 戻る導線の再設計 — 下部「一覧へもどる」と footer セクションナビ

- 日付: 2026-06-13
- 対象: blog / works 詳細ページの戻る導線、および全ページ共通の SiteFooter

## 背景と問題

blog / works を読むときの「戻る」体験に2つの穴がある。

1. **読了後（ページ末尾）の戻る導線が弱い／無い**
   - blog 詳細末尾の `← blog 一覧`（`blog-nav` 内）は `tone="subtle"`＝`fg.subtle`（gray.9）。
     これはサイトのテキスト階調で最も薄い色（muted=gray.11 / default=gray.12 より下）で、
     12px・mono のため、ページ内で最も目立たないテキストになっている。
   - works 詳細末尾には `AdjacentNav`（前後作品への prev/next）しか無く、index へ戻る導線が
     **構造的に存在しない**。blog と非対称。

2. **読了地点にグローバルナビが無い**
   - 上部 `SysBar` は全7セクション（index/about/works/news/log/gallery/blog）のナビを持つが、
     `position: static`＝固定ではないため、長い記事を下までスクロールすると画面外へ消える。
   - SiteFooter はセクションへの導線をまったく持たない（`colophon` / `sitemap` のみ）。
     結果、読了地点ではどこへも戻れる導線が無い。

> 上部 breadcrumb 自体の見え方は今回は変更しない（別途の判断）。本 spec は「読了後の着地」に集中する。

## ゴール

- 読了後に「一覧へもどる」が一目で分かる。ただしサイトの抑制されたタイポグラフィ
  （白地・mono のシステム文字・hover は ScrambleText）を壊さない。
- blog / works で表記・見た目を完全に揃える（works には新設）。
- 最下部 footer を「どこにでも戻れる着地ナビ」にする（SysBar が消える穴を埋める保険）。

## 設計

### A. 共有コンポーネント `BackToIndex`

末尾の戻る導線を **`src/components/back-to-index`** に一元化し、blog / works の両方で使う
（表記・見た目のドリフトを防ぐ）。

```
← blog 一覧へもどる
  ↑ 矢印                ↑ ラベル
  fg.default            accent（青）・下線・size sm
```

- props: `href: string`, `label: string`（例: `href="/blog"`, `label="blog 一覧へもどる"`）。
- 矢印 `←` は装飾なので `aria-hidden` の `<span>`、色は `fg.default`（インク）。
- ラベルは `accent`（青）＋下線（offset 2px）。hover は既存どおり `ScrambleText`。
- フォント: mono・`"wght" 600`・`letterSpacing: wide`（現行 `blog-nav` の back を踏襲）。
- サイズ: `xs → sm` に昇格（現状埋もれる主因の解消）。
- 配置: `alignSelf: start`（テキストを hug し、hover が行幅いっぱいに伸びない）。
- リンク全体が1つのクリック対象（矢印＋ラベル）。`underline={false}` を渡し、下線はラベル
  `<span>` 側に付ける（矢印には下線を付けない）。色の出し分けは `data-*` ではなく
  矢印 `<span>` がローカルに `color: fg.default` を上書きする形でよい（ラベルは Link の
  `tone="accent"` 由来）。

#### TDD

`src/components` 配下なので TDD（`back-to-index.test.tsx`）。
最低限の振る舞い:

- 指定 `href` を持つリンクを1つ描画する。
- `label` テキストを表示する。
- 矢印グリフはアクセシブルネームに漏れない（`aria-hidden`）。

#### colophon 登録（必須）

`BackToIndex` は flow コンポーネントなので:

- `src/app/(site)/colophon/_demos/index.tsx` に `BackToIndex` キーの demo を追加
  （`href` は `e.preventDefault` の no-action で。`NoAction` パターンに合わせる）。
- `src/app/(site)/colophon/content.ts` の `components.items` に
  `{ name: 'BackToIndex', why: '…' }` を追加（声は既存 items のトーンに合わせる）。

### A-1. blog への適用

`src/app/(site)/blog/[id]/_components/blog-nav/index.tsx`:

- 現行のインライン back リンク

  ```tsx
  <Link href="/blog" className={s.back} tone="subtle">
    ← <ScrambleText>blog 一覧</ScrambleText>
  </Link>
  ```

  を `<BackToIndex href="/blog" label="blog 一覧へもどる" />` に置換。

- `blog-nav/styles.css.ts` の `back` スタイルは BackToIndex 側へ移るため削除。
- pager（prev/next）部分と末尾 hairline・余白の rhythm はそのまま。

### A-2. works への適用（新設）

works 詳細末尾に、blog と左右対称の戻る導線を新設する。

`src/app/(site)/works/[id]/page.tsx`（現状）:

```tsx
<ShareBar ... />
<AdjacentNav prev={prev} next={next} />
```

`AdjacentNav` は pager のみ。ここへ blog の `BlogNav`（pager＋back を1つの nav に束ねる）と
同じ rhythm で `BackToIndex` を加える。実装方針は次のどちらでもよく、blog と
**見た目・余白・hairline が一致すること** を要件とする:

- `AdjacentNav` の root（hairline＋paddingTop）の内側に `BackToIndex` を含める、または
- works 用の薄いラッパ（pager＋back を束ねる nav）を用意する。

`label="works 一覧へもどる"`, `href="/works"`。

> AdjacentNav は現状 `'use client'`。BackToIndex（react-aria Link）は client 配下でも
> server 配下でも描画でき、配置に制約は生まない。

### B. SiteFooter のセクションナビ

`src/components/site-footer` の上に `<nav>` を1行新設する。既存の copyright＋meta 行は
**現状どおり space-between の横並びを維持**し、幅が足りないときだけ column に落とす。

```
■ wide（desktop）
  index · about · works · news · log · gallery · blog      ← <nav aria-label="フッターナビゲーション">（wrap）
  ─────────────────────────────────────────────────────   ← hairline
  © 2026 napochaan — graphic / digital   build {id} · life: running · colophon · sitemap
  └ copyright（左）─────────────── space-between ───────────────── meta（右）┘

■ narrow（mobile）
  index · about · works · news        ← nav は折り返して全表示（消さない）
  log · gallery · blog
  ─────────────────────────────────
  © 2026 napochaan — graphic / digital   ← copyright/meta は column に
  build {id} · life: running · colophon · sitemap
```

レイアウト:

- footer root を縦2ブロックにする：**①section-nav 行** ／ **②copyright＋meta 行**（hairline で区切る）。
- ②は現状の space-between 横並びを維持し、`flexDirection: { base: 'column', desktop: 'row' }`
  で幅が足りないとき column に落とす（`blog-nav` の `pager` と同じ row→column パターンに倣う）。
  meta の中身（build · life · colophon · sitemap）と区切り `·` は**現状のまま据え置き**
  （既存の literal `·` はリファクタ対象外）。

section-nav 行:

- セクションは SysBar と同一の7つ（index/about/works/news/log/gallery/blog、この順）。
- **mobile では `flex-wrap` で複数行に折り返して全項目を表示**する（右→左に消す collapse は採らない）。
  全セクションが最下部でも到達可能なまま。
- リンクは footer 既存の muted＋ScrambleText の affordance に合わせる
  （`colophon` リンクと同じ見た目）。現在地は `aria-current="page"`（視覚差は控えめ、無くてもよい）。
- 区切りの `·` は **JSX 直書きせず CSS `::before` で描画**する
  （先頭以外の各 item に `::before { content: "·" }`。装飾グリフは CSS で、の既存方針に準拠）。
- SiteFooter は ambient chrome なので colophon の box 追加は不要（既存 `components.ambient`
  のポインタのまま）。

#### TDD

既存 `site-footer.test.tsx` を拡張:

- `<nav>` landmark が存在し、7つのセクションリンクを正しい href で描画する。
- 既存の colophon / sitemap / build 表示が壊れていない。

### C. `navItems` の共有化

SysBar はナビ項目をコンポーネント内ローカルで定義している:

```ts
// src/components/sys-bar/index.tsx
const navItems = [
  { label: 'index', href: '/' },
  { label: 'about', href: '/about' },
  ...
];
```

footer が同じ7項目をミラーするため、**両者がドリフトしない**よう `navItems`
（`readonly { label: string; href: string }[]`）を共有モジュールへ抽出し、
SysBar と SiteFooter の両方が参照する。

- 配置: 純データのため `src/utils/nav-items/index.ts`（colocation 規約に沿う）に置く。
  名前は `siteNavItems` とする。
- SysBar は `siteNavItems` を import し、`map` の index を従来どおり `order`
  （右→左の collapse 制御）に使う。挙動は不変。
- footer は `siteNavItems` を表示順そのままで描画。

## 触るファイル一覧

新規:

- `src/components/back-to-index/{index.tsx, styles.css.ts, back-to-index.test.tsx}`
- `src/utils/nav-items/index.ts`（`siteNavItems`）

変更:

- `src/components/sys-bar/index.tsx`（`siteNavItems` 参照へ差し替え）
- `src/app/(site)/blog/[id]/_components/blog-nav/{index.tsx, styles.css.ts}`（back を BackToIndex へ）
- `src/app/(site)/works/[id]/page.tsx`（back 新設）＋必要なら works 側の nav ラッパ/スタイル
- `src/components/site-footer/{index.tsx, styles.css.ts, site-footer.test.tsx}`（section nav 新設＋copyright/meta は row→column）
- `src/app/(site)/colophon/_demos/index.tsx`（BackToIndex demo）
- `src/app/(site)/colophon/content.ts`（BackToIndex の items 追加）

## 非対象（やらないこと）

- 上部 breadcrumb の見え方の変更（今回は据え置き）。
- SysBar を sticky/fixed にする等の追従化（別議論）。
- footer のレイアウト思想を超えた装飾追加。

## 受け入れ条件

- blog / works 詳細の末尾に、矢印＋青ラベル・size sm・下線の「◯◯ 一覧へもどる」が
  同一の見た目で表示される（works は新設）。
- footer に `<nav aria-label="フッターナビゲーション">` があり、7セクションへ遷移できる。
- SysBar と footer のセクション集合が単一ソース（`siteNavItems`）から来ている。
- `·` 区切りは CSS 描画（JSX に直書きしていない）。
- BackToIndex が colophon に登録されている。
- `pnpm lint && pnpm typecheck` が通る。
