# 戻る導線の再設計 — 下部「一覧へもどる」と footer セクションナビ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** blog / works 詳細末尾に視認できる「一覧へもどる」を一元化して両方に置き、SysBar がスクロールで消える穴を埋める footer セクションナビを新設する。

**Architecture:** 戻る導線を共有コンポーネント `BackToIndex`（矢印=ink ／ ラベル=accent＋下線、sm）に切り出し blog/works が共用。SysBar と SiteFooter のセクション集合を単一データ `siteNavItems` から供給し、footer は wrap で全表示、copyright/meta は row→column に落とす。

**Tech Stack:** Next.js App Router (RSC) / React 19 / Panda CSS (strictTokens) / react-aria-components / vitest (browser mode) / TDD。

参照 spec: `docs/superpowers/specs/2026-06-13-back-nav-and-footer-nav-design.md`

---

## File Structure

新規:

- `src/utils/nav-items/index.ts` — サイト主要セクションの単一データ `siteNavItems`（SysBar / SiteFooter 共用）。純データ、ロジック無し。
- `src/components/back-to-index/index.tsx` — 戻る導線コンポーネント（`href` / `label`）。
- `src/components/back-to-index/styles.css.ts` — その Panda スタイル。
- `src/components/back-to-index/back-to-index.test.tsx` — 振る舞いテスト（browser mode）。

変更:

- `src/components/sys-bar/index.tsx` — ローカル `navItems` を `siteNavItems` import に差し替え（挙動不変）。
- `src/app/(site)/colophon/content.ts` — `components.items` に `BackToIndex` を追加。
- `src/app/(site)/colophon/_demos/index.tsx` — `BackToIndex` の demo を追加。
- `src/app/(site)/blog/[id]/_components/blog-nav/index.tsx` — インライン back を `<BackToIndex>` に置換。
- `src/app/(site)/blog/[id]/_components/blog-nav/styles.css.ts` — 未使用になる `back` スタイル削除。
- `src/app/(site)/works/[id]/_components/adjacent-nav/index.tsx` — pager を内側 div に束ね、`<BackToIndex>` を新設（blog-nav と同構造）。
- `src/app/(site)/works/[id]/_components/adjacent-nav/styles.css.ts` — root を column ラッパに、pager スタイルを追加。
- `src/components/site-footer/index.tsx` — section nav 行を新設、copyright/meta を `meta` ブロックへ。
- `src/components/site-footer/styles.css.ts` — root を column 化、`nav` / `navLink` / `meta` を追加。
- `src/components/site-footer/site-footer.test.tsx` — nav landmark とセクションリンクのテストを追加。

---

## Task 1: 共有データ `siteNavItems` と SysBar の差し替え

**Files:**

- Create: `src/utils/nav-items/index.ts`
- Modify: `src/components/sys-bar/index.tsx:20-28`（ローカル `navItems` 定義）

純データのみで分岐ロジックを持たないため、このタスクに新規テストは無い（型と既存テストで担保）。

- [ ] **Step 1: `siteNavItems` を作成する**

Create `src/utils/nav-items/index.ts`:

```ts
// Single source of truth for the site's primary sections, shared by the top
// SysBar and the SiteFooter so the two navs can never drift. Order is the display
// order (index first → blog last); SysBar additionally uses the array index as
// each slot's collapse `order`.
export const siteNavItems = [
  { label: 'index', href: '/' },
  { label: 'about', href: '/about' },
  { label: 'works', href: '/works' },
  { label: 'news', href: '/news' },
  { label: 'log', href: '/log' },
  { label: 'gallery', href: '/gallery' },
  { label: 'blog', href: '/blog' },
] as const;
```

- [ ] **Step 2: SysBar をその import に差し替える**

In `src/components/sys-bar/index.tsx`, delete the local `navItems` block (currently lines 17-28, the comment + `const navItems = [...]`) and add the import alongside the other `@utils` import:

```tsx
import { siteNavItems } from '@utils/nav-items';
```

Then update the two `.map` call sites to use `siteNavItems` instead of `navItems`:

```tsx
// inline row (was navItems.map)
{siteNavItems.map(({ label, href }, order) => (
  <NavLink key={label} label={label} href={href} active={isNavActive(pathname, href)} order={order} />
))}
```

```tsx
// menu popover (was navItems.map)
{siteNavItems.map(({ label, href }) => (
  <MenuItem key={label} href={href} className={styles.menuItem} data-active={isNavActive(pathname, href) ? 'true' : undefined}>
    {label}
  </MenuItem>
))}
```

- [ ] **Step 3: 型チェックと既存テストを確認する**

Run: `pnpm typecheck`
Expected: PASS（型エラー無し）

Run: `pnpm vitest run src/components/sys-bar`
Expected: PASS（SysBar の既存テストがあれば緑。無ければ "no test files" でも可）

- [ ] **Step 4: Commit**

```bash
git add src/utils/nav-items/index.ts src/components/sys-bar/index.tsx
git commit -m "refactor(nav): extract shared siteNavItems used by SysBar

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `BackToIndex` コンポーネント（TDD）

**Files:**

- Create: `src/components/back-to-index/back-to-index.test.tsx`
- Create: `src/components/back-to-index/index.tsx`
- Create: `src/components/back-to-index/styles.css.ts`

- [ ] **Step 1: 失敗するテストを書く**

Create `src/components/back-to-index/back-to-index.test.tsx`:

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { BackToIndex } from './index';

describe('BackToIndex', () => {
  it('renders a link to the given href, named by its label', async () => {
    render(<BackToIndex href="/blog" label="blog 一覧へもどる" />);
    await expect.element(page.getByRole('link', { name: 'blog 一覧へもどる' })).toHaveAttribute('href', '/blog');
  });

  it('shows the decorative arrow without leaking it into the accessible name', async () => {
    render(<BackToIndex href="/works" label="works 一覧へもどる" />);
    // The arrow glyph is aria-hidden, so the accessible name is the label alone…
    const link = page.getByRole('link', { name: 'works 一覧へもどる' });
    await expect.element(link).toBeInTheDocument();
    // …but the glyph is still painted in the DOM.
    expect(link.element().textContent).toContain('←');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `pnpm vitest run src/components/back-to-index/back-to-index.test.tsx`
Expected: FAIL（`./index` が存在しない / `BackToIndex` 未定義）

- [ ] **Step 3: スタイルを書く**

Create `src/components/back-to-index/styles.css.ts`:

```ts
import { css } from '@styled/css';

// Hug the text so the link isn't a full-width block (its hover never stretches
// across the row). mono / semibold / wide tracking inherits the system voice of
// the foot-of-page nav it replaces — but at sm, not the buried xs it used to be.
export const root = css({
  alignSelf: 'start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'inline',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  letterSpacing: 'wide',
});

// Decorative back arrow. Ink-coloured (fg.default) against the accent label so the
// glyph reads as direction, not as part of the link text. The link itself is
// tone="accent", so this span overrides the colour back to ink.
export const arrow = css({
  flexShrink: '0',
  color: 'fg.default',
});

// The label owns the resting underline (the link passes underline={false}); the
// arrow stays undecorated. ScrambleText paints its fill in an absolute box, so the
// underline sits on this in-flow wrapper exactly like adjacent-nav's label.
export const label = css({
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
});
```

- [ ] **Step 4: 最小実装を書く**

Create `src/components/back-to-index/index.tsx`:

```tsx
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import * as styles from './styles.css';

type Props = {
  href: string;
  label: string;
};

// Back-to-index link rendered at the foot of a detail page (blog / works). The
// arrow is decorative ink; the label carries the accent colour + the resting
// underline, with the scramble as the hover signal — the site-wide link
// affordance, kept legible (sm) instead of the buried xs/subtle it replaced.
export const BackToIndex = ({ href, label }: Props) => {
  return (
    <Link href={href} className={styles.root} tone="accent" underline={false}>
      <span className={styles.arrow} aria-hidden="true">
        ←
      </span>
      <span className={styles.label}>
        <ScrambleText>{label}</ScrambleText>
      </span>
    </Link>
  );
};
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `pnpm vitest run src/components/back-to-index/back-to-index.test.tsx`
Expected: PASS（2件）

- [ ] **Step 6: Commit**

```bash
git add src/components/back-to-index
git commit -m "feat(components): add BackToIndex foot-of-page back link

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: BackToIndex を colophon に登録

**Files:**

- Modify: `src/app/(site)/colophon/content.ts`（`components.items` 配列）
- Modify: `src/app/(site)/colophon/_demos/index.tsx`（`demos` Record と import）

`demos` の型 `Record<ComponentName, ReactNode>` は `content.items` の `name` から導出されるため、両方を同じコミットで追加する（片方だけだとコンパイルエラー）。

- [ ] **Step 1: content.ts に items を追加する**

In `src/app/(site)/colophon/content.ts`, add this entry to the `components.items` array, right after the `ShareBar` line:

```ts
      { name: 'BackToIndex', why: 'blog / works を読み終えた足元に置く「一覧へもどる」。矢印は方向のしるしで色を抜き、ラベルだけ青く灯す。SysBar がスクロールで流れて消えても、ここから必ず一覧へ戻れる。' },
```

- [ ] **Step 2: \_demos/index.tsx に import と demo を追加する**

In `src/app/(site)/colophon/_demos/index.tsx`, add the import next to the other `@components` imports:

```tsx
import { BackToIndex } from '@components/back-to-index';
```

Then add this entry to the `demos` object, right after the `ShareBar` entry:

```tsx
  BackToIndex: (
    <NoAction>
      <BackToIndex href="/blog" label="blog 一覧へもどる" />
    </NoAction>
  ),
```

- [ ] **Step 3: 型チェックを確認する**

Run: `pnpm typecheck`
Expected: PASS（`ComponentName` に `BackToIndex` が増え、demos と一致してエラー無し）

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/colophon/content.ts" "src/app/(site)/colophon/_demos/index.tsx"
git commit -m "docs(colophon): catalog BackToIndex

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: blog-nav の back を BackToIndex に置換

**Files:**

- Modify: `src/app/(site)/blog/[id]/_components/blog-nav/index.tsx:57-59`
- Modify: `src/app/(site)/blog/[id]/_components/blog-nav/styles.css.ts:67-76`（`back` 削除）

- [ ] **Step 1: blog-nav の back リンクを差し替える**

In `src/app/(site)/blog/[id]/_components/blog-nav/index.tsx`, add the import next to the existing component imports:

```tsx
import { BackToIndex } from '@components/back-to-index';
```

Replace the inline back link

```tsx
      <Link href="/blog" className={s.back} tone="subtle">
        ← <ScrambleText>blog 一覧</ScrambleText>
      </Link>
```

with:

```tsx
      <BackToIndex href="/blog" label="blog 一覧へもどる" />
```

`Link` と `ScrambleText` は `NavSlot` でまだ使うので import は残す。

- [ ] **Step 2: 未使用の `back` スタイルを削除する**

In `src/app/(site)/blog/[id]/_components/blog-nav/styles.css.ts`, delete the entire `back` export (the comment block + `export const back = css({ ... });`, currently lines 67-76).

- [ ] **Step 3: 型チェックと lint を確認する**

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm lint`
Expected: PASS（`s.back` への未使用参照が残っていればここで落ちる → 残っていないこと）

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/blog/[id]/_components/blog-nav"
git commit -m "feat(blog): use BackToIndex for the foot-of-article back link

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: works に戻る導線を新設（adjacent-nav を blog-nav と同構造に）

**Files:**

- Modify: `src/app/(site)/works/[id]/_components/adjacent-nav/index.tsx`
- Modify: `src/app/(site)/works/[id]/_components/adjacent-nav/styles.css.ts`

`AdjacentNav` の root（現状は pager そのもの）を、blog-nav と同じく「pager 行＋BackToIndex」を縦に束ねる column ラッパへ作り替える。

- [ ] **Step 1: styles を column ラッパ＋pager に組み替える**

In `src/app/(site)/works/[id]/_components/adjacent-nav/styles.css.ts`, replace the `root` export with a column wrapper and add a `pager` export that holds the old row layout. The other exports (`link`, `arrow`, `label`, `empty`) stay unchanged.

```ts
// Foot-of-page nav: a column wrapper holding the prev/next pager row and the
// back-to-index link below it — mirrors blog-nav so works' bottom nav reads the
// same. The hairline + paddingTop separate it from the article above.
export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
  paddingTop: 'block',
});

// prev / next row. Was the old `root`: stretch + space-between, stacking on mobile.
export const pager = css({
  display: 'flex',
  flexDirection: { base: 'column', desktop: 'row' },
  alignItems: 'stretch',
  justifyContent: 'space-between',
  gap: 'element',
});
```

- [ ] **Step 2: AdjacentNav に pager wrapper と BackToIndex を入れる**

In `src/app/(site)/works/[id]/_components/adjacent-nav/index.tsx`, add the import next to the existing component imports:

```tsx
import { BackToIndex } from '@components/back-to-index';
```

Replace the returned nav

```tsx
  return (
    <nav className={s.root} aria-label="works pagination">
      <NavSlot slot={toSlot('prev', prev)} />
      <NavSlot slot={toSlot('next', next)} />
    </nav>
  );
```

with:

```tsx
  return (
    <nav className={s.root} aria-label="works pagination">
      <div className={s.pager}>
        <NavSlot slot={toSlot('prev', prev)} />
        <NavSlot slot={toSlot('next', next)} />
      </div>
      <BackToIndex href="/works" label="works 一覧へもどる" />
    </nav>
  );
```

- [ ] **Step 3: 型チェックと lint を確認する**

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/works/[id]/_components/adjacent-nav"
git commit -m "feat(works): add foot-of-article back-to-index link

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: SiteFooter のセクションナビ（TDD）

**Files:**

- Modify: `src/components/site-footer/site-footer.test.tsx`
- Modify: `src/components/site-footer/index.tsx`
- Modify: `src/components/site-footer/styles.css.ts`

footer は RSC のまま（`usePathname` は使わない）。現在地の `aria-current` は付けない（spec で任意、RSC 維持を優先）。

- [ ] **Step 1: 失敗するテストを追加する**

In `src/components/site-footer/site-footer.test.tsx`, add these two tests inside the `describe('SiteFooter', …)` block:

```tsx
  it('renders a footer navigation listing every site section', async () => {
    await render(<SiteFooter />);
    await expect.element(page.getByRole('navigation', { name: 'フッターナビゲーション' })).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'index' })).toHaveAttribute('href', '/');
    await expect.element(page.getByRole('link', { name: 'blog' })).toHaveAttribute('href', '/blog');
  });

  it('still shows the build status line', async () => {
    await render(<SiteFooter buildId="abc123" />);
    await expect.element(page.getByText(/build abc123/)).toBeInTheDocument();
  });
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `pnpm vitest run src/components/site-footer/site-footer.test.tsx`
Expected: FAIL（`フッターナビゲーション` の navigation が無い / `index` link が無い）

- [ ] **Step 3: index.tsx に section nav を新設し meta を束ねる**

Replace the whole body of `src/components/site-footer/index.tsx` with:

```tsx
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { siteNavItems } from '@utils/nav-items';

import * as styles from './styles.css';

type Props = {
  buildId?: string;
};

export const SiteFooter = ({ buildId }: Props) => {
  return (
    <footer className={styles.root}>
      <nav className={styles.nav} aria-label="フッターナビゲーション">
        {siteNavItems.map(({ label, href }) => (
          <Link key={href} href={href} className={styles.navLink} tone="muted">
            <ScrambleText>{label}</ScrambleText>
          </Link>
        ))}
      </nav>
      <div className={styles.meta}>
        <span>© 2026 napochaan — graphic / digital</span>
        <span className={styles.status}>
          build {buildId ?? 'dev'} · <span className={styles.live}>life: running</span> ·{' '}
          <Link href="/colophon" tone="muted">
            <ScrambleText>colophon</ScrambleText>
          </Link>{' '}
          ·{' '}
          <a className={styles.sitemap} href="/sitemap.xml">
            <ScrambleText>sitemap</ScrambleText>
          </a>
        </span>
      </div>
    </footer>
  );
};
```

- [ ] **Step 4: styles.css.ts を column root＋nav＋meta に作り替える**

Replace the whole body of `src/components/site-footer/styles.css.ts` with:

```ts
import { css } from '@styled/css';

// Two stacked blocks: the section nav, then the copyright/meta row. The top
// border separates the footer from the last page section on the section rhythm.
export const root = css({
  marginBlockStart: { base: '8', desktop: 'section' },
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'fg.default',
  paddingBlock: 'element',
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  color: 'fg.muted',
});

// Section links. Wraps to multiple lines on narrow widths so every section stays
// reachable at the foot of the page (the SysBar scrolls away above).
export const nav = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'inline',
});

// Each link draws its own leading "·" via ::before so the separator is CSS, never
// JSX. The first item suppresses it.
export const navLink = css({
  _before: {
    content: '"·"',
    marginInlineEnd: 'inline',
    color: 'fg.subtle',
  },
  '&:first-child': {
    _before: { content: '""', marginInlineEnd: '0' },
  },
});

// copyright + meta: the original single space-between row, dropping to a column
// only when the width can't hold both ends (mirrors blog-nav's pager row→column).
// Separated from the nav above by a hairline.
export const meta = css({
  display: 'flex',
  flexDirection: { base: 'column', desktop: 'row' },
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'inline',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
  paddingTop: 'element',
});

export const status = css({
  display: 'flex',
  gap: 'inline',
});

export const live = css({
  color: 'accent.text',
});

// sitemap.xml is an XML resource, not a routable page, so it renders as a plain
// `<a>` (full navigation) rather than the react-aria Link. Mirror the muted footer
// link affordance AND the link recipe's resting underline (offset 2px) so it reads
// as a link at a glance, like the colophon Link beside it; accent on hover/focus.
export const sitemap = css({
  color: 'fg.muted',
  textDecorationLine: 'underline',
  textUnderlineOffset: '[2px]',
  '&:hover': { color: 'accent.text' },
  '&:focus-visible': { color: 'accent.text' },
});
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `pnpm vitest run src/components/site-footer/site-footer.test.tsx`
Expected: PASS（既存3件＋新規2件）

- [ ] **Step 6: Commit**

```bash
git add src/components/site-footer
git commit -m "feat(footer): add wrapping section nav as bottom landing nav

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 全体の lint / typecheck / 目視確認

**Files:** なし（検証のみ）

- [ ] **Step 1: lint と typecheck を通す**

Run: `pnpm lint && pnpm typecheck`
Expected: 両方 PASS

- [ ] **Step 2: 関連テストをまとめて実行する**

Run: `pnpm vitest run src/components/back-to-index src/components/site-footer src/components/sys-bar`
Expected: PASS

- [ ] **Step 3: difit でレビュー依頼する（CLAUDE.md のルール）**

実装が一通り終わったら difit を起動してレビューに出す。`pnpm dev` で以下を目視確認するのが望ましい:

- blog / works 詳細の末尾に「◯◯ 一覧へもどる」が同一の見た目（矢印=ink・ラベル=青＋下線・sm）で出る。
- footer に7セクションの nav 行があり、narrow 幅で折り返し、copyright/meta が column に落ちる。
- colophon に BackToIndex のデモが出る。

---

## Self-Review

**Spec coverage:**

- A `BackToIndex`（矢印ink/ラベルaccent＋下線/sm/alignSelf start/underline=false）→ Task 2。
- A TDD（href・aria-hidden 矢印）→ Task 2 Step 1。
- A colophon 登録（demos＋content）→ Task 3。
- A-1 blog 置換＋`back` スタイル削除 → Task 4。
- A-2 works 新設（blog と同 rhythm: hairline＋paddingTop＋pager＋back）→ Task 5。
- B footer section nav（wrap 全表示・CSS `::before` の `·`・muted＋scramble）→ Task 6。
- B copyright/meta は space-between 維持＋`{ base: column, desktop: row }` → Task 6 styles `meta`。
- B TDD（nav landmark＋7リンク＋build 維持）→ Task 6 Step 1。
- C `siteNavItems` 抽出＋SysBar 差し替え → Task 1。footer 参照 → Task 6。
- 受け入れ条件「lint && typecheck」→ Task 7。

全 spec 項目に対応タスクあり。ギャップ無し。

**Placeholder scan:** "TBD"/"appropriate"/"similar to" 等のプレースホルダ無し。各 code step に実コードあり。

**Type consistency:**

- `siteNavItems: readonly { label; href }[]`（Task 1）を SysBar / footer が同形で `.map`（Task 1 / 6）。
- `BackToIndex` props `{ href: string; label: string }`（Task 2）を blog（Task 4）/ works（Task 5）/ colophon（Task 3）が同じ prop 名で使用。
- footer スタイル名 `root` / `nav` / `navLink` / `meta` / `status` / `live` / `sitemap`（Task 6 styles）を index.tsx（Task 6）が一致参照。
- works スタイル名 `root` / `pager` / `link` / `arrow` / `label` / `empty`（Task 5 styles）を index.tsx（Task 5）が一致参照。

不整合無し。
