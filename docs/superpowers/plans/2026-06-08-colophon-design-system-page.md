# colophon design-system page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repurpose `/colophon` into a public design-system showcase: keep the philosophy manifestos, add a typography section (scale ladder + jump ratio + font roles) and a curated 8-component catalog, pointing at the SiteShell chrome (TypographyBand/GameOfLife/SysBar) as live demos.

**Architecture:** Four thin presentational Server Components under `colophon/_components/` (type-scale, font-roles, component-demo, ambient-pointer), driven by data added to `colophon/content.ts`. The page (`colophon/page.tsx`) composes six sections and maps the 6 flow-component live demos by name. No new shared `src/components/*`.

**Tech Stack:** Next.js App Router (RSC), Panda CSS (strictTokens, `@styled/css`), vitest browser mode (`vitest-browser-react`), TypeScript (tsgo).

**Spec:** `docs/superpowers/specs/2026-06-08-colophon-design-system-page-design.md`

**Branch:** `feat/colophon-design-system` (already created; spec committed at `a6ff8eb`).

---

## File Structure

| File                                                                           | Responsibility                                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `src/app/(site)/colophon/content.ts`                                           | **Modify** — change `lead`; add `typography` + `components` data |
| `src/app/(site)/colophon/_components/type-scale/index.tsx`                     | **Create** — scale ladder `<dl>`                                 |
| `src/app/(site)/colophon/_components/type-scale/styles.css.ts`                 | **Create**                                                       |
| `src/app/(site)/colophon/_components/type-scale/type-scale.test.tsx`           | **Create**                                                       |
| `src/app/(site)/colophon/_components/font-roles/index.tsx`                     | **Create** — font role `<dl>`                                    |
| `src/app/(site)/colophon/_components/font-roles/styles.css.ts`                 | **Create**                                                       |
| `src/app/(site)/colophon/_components/font-roles/font-roles.test.tsx`           | **Create**                                                       |
| `src/app/(site)/colophon/_components/component-demo/index.tsx`                 | **Create** — bordered "name + why + live demo" cell              |
| `src/app/(site)/colophon/_components/component-demo/styles.css.ts`             | **Create**                                                       |
| `src/app/(site)/colophon/_components/component-demo/component-demo.test.tsx`   | **Create**                                                       |
| `src/app/(site)/colophon/_components/ambient-pointer/index.tsx`                | **Create** — `▸ label → target` mono line                        |
| `src/app/(site)/colophon/_components/ambient-pointer/styles.css.ts`            | **Create**                                                       |
| `src/app/(site)/colophon/_components/ambient-pointer/ambient-pointer.test.tsx` | **Create**                                                       |
| `src/app/(site)/colophon/styles.css.ts`                                        | **Modify** — add `intro`, `ambientList`, `demoGrid`              |
| `src/app/(site)/colophon/page.tsx`                                             | **Modify** — add sections 03/04, renumber 05/06, map live demos  |

**Note on TDD scope:** `content.ts`, `styles.css.ts`, and `page.tsx` are data/route files (no unit tests — matching the existing colophon, which has no page test). The four new `_components/` are under `.claude/rules/tdd.md` and MUST follow Red→Green→Refactor.

**Note on tokens (read once):** `fontSizes` tokens = `2xs xs sm md lg xl h3 h2 h1 display hero`. `fonts` tokens = `display body mono`. Colors are semantic (`fg.default`, `fg.muted`, `border.default`, `accent.text`, `bg.subtle`). Spacing semantic tokens: `inline`(8) `element`(12) `block`(24) `section`(48) `page`(24). Under `strictTokens` you cannot pass raw values — every value below is a token.

---

## Task 1: Extend `content.ts` with typography + components data

**Files:**

- Modify: `src/app/(site)/colophon/content.ts`

- [ ] **Step 1: Change `lead` to the 〜んだよなぁ調 placeholder and add the two new sections**

Edit the `colophon` object. Change the `lead` line and insert `typography` and `components` keys **after `code: [...]` and before `stack: [...]`**. Leave `site`, `code`, `stack`, `source` untouched.

Replace:

```ts
  lead: 'このサイトの作り方と、コードを書くときの作法。',
```

with:

```ts
  lead: 'このサイト、こうやって作ってるんだよなぁ。考えてることぜんぶ置いとくね。',
```

Then, immediately after the closing `],` of `code` and before `stack:`, insert:

```ts
  typography: {
    intro: '文字の大きさ、けっこう考えて決めてるんだよなぁ。本文を基準に、見出しへ一気に跳ばす。',
    scale: [
      { token: 'md', px: '16px', ratio: '1.00x', role: '本文' },
      { token: 'h3', px: '23px', ratio: '×1.44', role: '小見出し' },
      { token: 'h2', px: '28→33px', ratio: 'clamp 3.5vw', role: '節見出し' },
      { token: 'h1', px: '33→51px', ratio: 'clamp 5vw', role: 'ページ見出し' },
      { token: 'display', px: '56→96px', ratio: 'clamp 9vw', role: 'ディスプレイ' },
      { token: 'hero', px: '56→160px', ratio: 'clamp 15vw', role: 'ヒーロー' },
    ],
    fonts: [
      { family: 'digibop', role: 'display', why: '黒グロテスクの打撃力。見出しで殴る役なんだよなぁ。' },
      { family: 'M PLUS 1', role: 'body', why: '和文の可読性。next/font で安定して届く。' },
      { family: 'config-mono-vf', role: 'mono', why: 'システム文字の地の声。数値も注釈もコマンドもこれ。' },
    ],
    bandNote: 'いま画面を囲ってる枠、あれが TypographyBand なんだよなぁ。',
  },
  components: {
    intro: 'このページ自体が design-system の中で動いてるんだよなぁ。囲まれてる枠も、背景も、ヘッダーも、ぜんぶ部品。',
    ambient: [
      { label: 'いま囲ってる枠', target: 'TypographyBand' },
      { label: '背後で蠢くセル', target: 'GameOfLife' },
      { label: '上のヘッダー', target: 'SysBar' },
    ],
    items: [
      { name: 'ScrambleText', why: 'hover すると文字が解ける。news / blog のタイトルに効かせてる。' },
      { name: 'Marquee', why: '横に流れる帯。継ぎ目のない2トラックループなんだよなぁ。' },
      { name: 'EchoText', why: '多層エコーの見出し。輪郭・青・本体を重ねて T2 みたいに光らせる。' },
      { name: 'Timeline', why: '年表。これからの予定だけ accent で立てる。' },
      { name: 'Card', why: 'コンテンツの最小枠。as で要素を差し替えられる。' },
      { name: 'SystemAnnotation', why: 'mono の注釈。muted / accent / danger の3色で状態を言う。' },
    ],
  },
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (no errors). The object stays `as const`, so the new arrays become readonly tuples.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(site\)/colophon/content.ts
git commit -m "feat(colophon): add typography + components data, loosen lead"
```

---

## Task 2: `ambient-pointer` component (TDD)

The simplest new component first. Renders one mono line `▸ {label} → {target}` that reads as a coherent sentence to screen readers.

**Files:**

- Create: `src/app/(site)/colophon/_components/ambient-pointer/ambient-pointer.test.tsx`
- Create: `src/app/(site)/colophon/_components/ambient-pointer/index.tsx`
- Create: `src/app/(site)/colophon/_components/ambient-pointer/styles.css.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { AmbientPointer } from './index';

describe('AmbientPointer', () => {
  it('renders the label and the target', async () => {
    await render(<AmbientPointer label="いま囲ってる枠" target="TypographyBand" />);

    await expect.element(page.getByText('いま囲ってる枠', { exact: false })).toBeInTheDocument();
    await expect.element(page.getByText('TypographyBand', { exact: false })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/(site)/colophon/_components/ambient-pointer/ambient-pointer.test.tsx"`
Expected: FAIL — `Failed to resolve import './index'` / `AmbientPointer is not defined`.

- [ ] **Step 3: Write the styles**

`styles.css.ts`:

```ts
import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: 'inline',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});

export const marker = css({
  color: 'accent.text',
});

export const target = css({
  color: 'fg.default',
});
```

- [ ] **Step 4: Write the minimal implementation**

`index.tsx`:

```tsx
import * as styles from './styles.css';

type Props = {
  label: string;
  target: string;
};

// One ambient-chrome pointer: names a part of the page chrome that SiteShell
// already renders (TypographyBand / GameOfLife / SysBar) instead of re-rendering
// it. Reads as a full sentence: "▸ <label> → <target>".
export const AmbientPointer = ({ label, target }: Props) => {
  return (
    <li className={styles.root}>
      <span className={styles.marker} aria-hidden="true">
        ▸
      </span>
      <span>{label}</span>
      <span aria-hidden="true">→</span>
      <span className={styles.target}>{target}</span>
    </li>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run "src/app/(site)/colophon/_components/ambient-pointer/ambient-pointer.test.tsx"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(site\)/colophon/_components/ambient-pointer
git commit -m "feat(colophon): add AmbientPointer component"
```

---

## Task 3: `component-demo` component (TDD)

A bordered cell wrapping a live component demo with a mono name header and a loose why line.

**Files:**

- Create: `src/app/(site)/colophon/_components/component-demo/component-demo.test.tsx`
- Create: `src/app/(site)/colophon/_components/component-demo/index.tsx`
- Create: `src/app/(site)/colophon/_components/component-demo/styles.css.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ComponentDemo } from './index';

describe('ComponentDemo', () => {
  it('renders the name, the why and the live demo children', async () => {
    await render(
      <ComponentDemo name="Marquee" why="横に流れる帯。">
        <div>LIVE_DEMO</div>
      </ComponentDemo>,
    );

    await expect.element(page.getByText('Marquee')).toBeInTheDocument();
    await expect.element(page.getByText('横に流れる帯。')).toBeInTheDocument();
    await expect.element(page.getByText('LIVE_DEMO')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/(site)/colophon/_components/component-demo/component-demo.test.tsx"`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Write the styles**

`styles.css.ts`:

```ts
import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  padding: 'block',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

export const name = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'accent.text',
});

export const why = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'body',
  color: 'fg.muted',
  maxWidth: '[60ch]',
});

// The live demo stage. overflow:hidden keeps wide demos (Marquee, hero type)
// from forcing horizontal page scroll.
export const stage = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  paddingBlock: 'element',
  overflow: 'hidden',
});
```

- [ ] **Step 4: Write the minimal implementation**

`index.tsx`:

```tsx
import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Props = {
  name: string;
  why: string;
  children: ReactNode;
};

// One catalog entry: a bordered cell with the component name (mono), a loose
// "why this shape" line, and the real component rendered live as children.
// The demo JSX is passed in by the page so this stays UI-only (no data coupling).
export const ComponentDemo = ({ name, why, children }: Props) => {
  return (
    <div className={styles.root}>
      <span className={styles.name}>{name}</span>
      <p className={styles.why}>{why}</p>
      <div className={styles.stage}>{children}</div>
    </div>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run "src/app/(site)/colophon/_components/component-demo/component-demo.test.tsx"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(site\)/colophon/_components/component-demo
git commit -m "feat(colophon): add ComponentDemo cell"
```

---

## Task 4: `font-roles` component (TDD)

A `<dl>` listing each font: the family name rendered **in that font** (via `data-font` → fontFamily token), plus role and why.

**Files:**

- Create: `src/app/(site)/colophon/_components/font-roles/font-roles.test.tsx`
- Create: `src/app/(site)/colophon/_components/font-roles/index.tsx`
- Create: `src/app/(site)/colophon/_components/font-roles/styles.css.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { FontRoles } from './index';

const fonts = [
  { family: 'digibop', role: 'display', why: '見出しで殴る役。' },
  { family: 'M PLUS 1', role: 'body', why: '和文の可読性。' },
] as const;

describe('FontRoles', () => {
  it('renders each family, role and why', async () => {
    await render(<FontRoles fonts={fonts} />);

    await expect.element(page.getByText('digibop')).toBeInTheDocument();
    await expect.element(page.getByText('display')).toBeInTheDocument();
    await expect.element(page.getByText('見出しで殴る役。')).toBeInTheDocument();
    await expect.element(page.getByText('M PLUS 1')).toBeInTheDocument();
  });

  it('renders one row per font', async () => {
    const { container } = await render(<FontRoles fonts={fonts} />);

    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(container.querySelectorAll('dd')).toHaveLength(2);
  });

  it('tags each family specimen with its font token', async () => {
    const { container } = await render(<FontRoles fonts={fonts} />);

    expect(container.querySelector('[data-font="display"]')).not.toBeNull();
    expect(container.querySelector('[data-font="body"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/(site)/colophon/_components/font-roles/font-roles.test.tsx"`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Write the styles**

`styles.css.ts` (each `data-font` selector sets the matching `fontFamily` token — strictTokens-safe):

```ts
import { css } from '@styled/css';

export const root = css({
  display: 'grid',
  gridTemplateColumns: '[max-content 1fr]',
  columnGap: 'block',
  rowGap: 'block',
});

export const row = css({
  display: 'grid',
  gridColumn: '[1 / -1]',
  gridTemplateColumns: '[subgrid]',
  alignItems: 'baseline',
});

// The family name set in its own typeface.
export const family = css({
  fontSize: 'h3',
  color: 'fg.default',
  '&[data-font="display"]': { fontFamily: 'display' },
  '&[data-font="body"]': { fontFamily: 'body' },
  '&[data-font="mono"]': { fontFamily: 'mono' },
});

export const detail = css({
  margin: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
});

export const role = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.muted',
});

export const why = css({
  fontFamily: 'body',
  fontSize: 'sm',
  lineHeight: 'body',
  color: 'fg.muted',
  maxWidth: '[60ch]',
});
```

- [ ] **Step 4: Write the minimal implementation**

`index.tsx`:

```tsx
import * as styles from './styles.css';

type Props = {
  fonts: readonly { family: string; role: string; why: string }[];
};

// The three typefaces and why each was chosen. The family name is rendered in
// its own font (data-font → fontFamily token) so the specimen is the evidence.
export const FontRoles = ({ fonts }: Props) => {
  return (
    <dl className={styles.root}>
      {fonts.map((font) => (
        <div key={font.role} className={styles.row}>
          <dt className={styles.family} data-font={font.role}>
            {font.family}
          </dt>
          <dd className={styles.detail}>
            <span className={styles.role}>{font.role}</span>
            <span className={styles.why}>{font.why}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run "src/app/(site)/colophon/_components/font-roles/font-roles.test.tsx"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(site\)/colophon/_components/font-roles
git commit -m "feat(colophon): add FontRoles table"
```

---

## Task 5: `type-scale` component (TDD)

A `<dl>` ladder: each row shows a glyph specimen rendered at the row's fontSize token (via `data-token` → fontSize), plus token name, px, ratio, role.

**Files:**

- Create: `src/app/(site)/colophon/_components/type-scale/type-scale.test.tsx`
- Create: `src/app/(site)/colophon/_components/type-scale/index.tsx`
- Create: `src/app/(site)/colophon/_components/type-scale/styles.css.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { TypeScale } from './index';

const rows = [
  { token: 'md', px: '16px', ratio: '1.00x', role: '本文' },
  { token: 'hero', px: '56→160px', ratio: 'clamp 15vw', role: 'ヒーロー' },
] as const;

describe('TypeScale', () => {
  it('renders each token, px, ratio and role', async () => {
    await render(<TypeScale rows={rows} />);

    await expect.element(page.getByText('md')).toBeInTheDocument();
    await expect.element(page.getByText('16px')).toBeInTheDocument();
    await expect.element(page.getByText('1.00x')).toBeInTheDocument();
    await expect.element(page.getByText('本文')).toBeInTheDocument();
    await expect.element(page.getByText('ヒーロー')).toBeInTheDocument();
  });

  it('renders one row per entry', async () => {
    const { container } = await render(<TypeScale rows={rows} />);

    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(container.querySelectorAll('dd')).toHaveLength(2);
  });

  it('tags each specimen with its size token', async () => {
    const { container } = await render(<TypeScale rows={rows} />);

    expect(container.querySelector('[data-token="md"]')).not.toBeNull();
    expect(container.querySelector('[data-token="hero"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/(site)/colophon/_components/type-scale/type-scale.test.tsx"`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Write the styles**

`styles.css.ts` (each `data-token` selector sets the matching `fontSize` token):

```ts
import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

export const row = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  paddingBlock: 'element',
  borderBottomWidth: 'hairline',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.subtle',
});

// The size specimen — decorative (aria-hidden); the meaning lives in the meta.
export const specimen = css({
  fontFamily: 'display',
  lineHeight: 'none',
  color: 'fg.default',
  overflow: 'hidden',
  '&[data-token="md"]': { fontSize: 'md' },
  '&[data-token="h3"]': { fontSize: 'h3' },
  '&[data-token="h2"]': { fontSize: 'h2' },
  '&[data-token="h1"]': { fontSize: 'h1' },
  '&[data-token="display"]': { fontSize: 'display' },
  '&[data-token="hero"]': { fontSize: 'hero' },
});

export const meta = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'element',
  alignItems: 'baseline',
});

export const token = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'accent.text',
});

export const figure = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});

export const role = css({
  fontFamily: 'body',
  fontSize: 'sm',
  color: 'fg.default',
});
```

- [ ] **Step 4: Write the minimal implementation**

`index.tsx`:

```tsx
import * as styles from './styles.css';

type Props = {
  rows: readonly { token: string; px: string; ratio: string; role: string }[];
};

// The type scale ladder. Each row renders a glyph specimen at the actual
// fontSize token (data-token → fontSize) so the jump between steps is visible,
// with the token name / px / ratio / role as the readable record.
export const TypeScale = ({ rows }: Props) => {
  return (
    <dl className={styles.root}>
      {rows.map((entry) => (
        <div key={entry.token} className={styles.row}>
          <dt className={styles.specimen} data-token={entry.token} aria-hidden="true">
            Ag
          </dt>
          <dd className={styles.meta}>
            <span className={styles.token}>{entry.token}</span>
            <span className={styles.figure}>{entry.px}</span>
            <span className={styles.figure}>{entry.ratio}</span>
            <span className={styles.role}>{entry.role}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run "src/app/(site)/colophon/_components/type-scale/type-scale.test.tsx"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(site\)/colophon/_components/type-scale
git commit -m "feat(colophon): add TypeScale ladder"
```

---

## Task 6: Add page-level layout styles

**Files:**

- Modify: `src/app/(site)/colophon/styles.css.ts`

- [ ] **Step 1: Append the new layout styles**

Add to the END of `src/app/(site)/colophon/styles.css.ts` (do not change existing exports):

```ts
// Loose narrator intro line that opens the type / components sections.
export const intro = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: { base: 'md', desktop: 'lg' },
  lineHeight: 'body',
  color: 'fg.muted',
  maxWidth: '[64ch]',
});

// The ambient-chrome pointer list (TypographyBand / GameOfLife / SysBar).
export const ambientList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  margin: '0',
  padding: '0',
  listStyleType: 'none',
});

// The component catalog grid: one column on mobile, two from tablet up.
export const demoGrid = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr', tablet: 'repeat(2, 1fr)' },
  gap: 'block',
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(site\)/colophon/styles.css.ts
git commit -m "feat(colophon): add intro/ambientList/demoGrid styles"
```

---

## Task 7: Assemble `page.tsx`

Wire the new data and components into the page: add sections 03 (type) and 04 (ui), renumber stack→05 and source→06, and map the six flow-component live demos by name.

**Files:**

- Modify: `src/app/(site)/colophon/page.tsx`

- [ ] **Step 1: Replace the whole file**

Replace the entire contents of `src/app/(site)/colophon/page.tsx` with:

```tsx
import { AmbientPointer } from './_components/ambient-pointer';
import { ComponentDemo } from './_components/component-demo';
import { FontRoles } from './_components/font-roles';
import { Manifesto } from './_components/manifesto';
import { TypeScale } from './_components/type-scale';
import { colophon } from './content';
import * as s from './styles.css';

import { Card } from '@components/card';
import { EchoText } from '@components/echo-text';
import { Marquee } from '@components/marquee';
import { PageHeader } from '@components/page-header';
import { ScrambleText } from '@components/scramble-text';
import { SectionHeading } from '@components/section-heading';
import { SystemAnnotation } from '@components/system-annotation';
import { Timeline } from '@components/timeline';

import type { TimelineItem } from '@components/timeline';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Revalidate hourly — ISR. Static page; its content is sourced from the repo's
// own rules, not the CMS.
export const revalidate = 3600;

const crumbs = [{ href: '/', label: 'home' }, { label: 'colophon' }];

// Sample data for the Timeline live demo (catalog illustration only).
const timelineDemo: TimelineItem[] = [
  { id: '1', date: '06/14', label: 'night vol.19 @ club eleven', meta: 'Tokyo', upcoming: true },
  { id: '2', date: '05/03', label: 'dawn session @ rooftop', meta: 'DJ set' },
  { id: '3', date: '04/12', label: 'ambient night @ gallery', meta: 'live' },
];

// Live demos keyed by component name, mapped against colophon.components.items.
// Kept here (not in content.ts) so the data file stays JSX-free.
const demos: Record<string, ReactNode> = {
  ScrambleText: <ScrambleText>static internet</ScrambleText>,
  Marquee: <Marquee>napochaan ✕ graphic · digital · since 2020 · </Marquee>,
  EchoText: <EchoText>napochaan</EchoText>,
  Timeline: <Timeline items={timelineDemo} />,
  Card: <Card as="div">night vol.13 — 2024.03.15 at Club Eleven</Card>,
  SystemAnnotation: (
    <>
      <SystemAnnotation tone="muted">sys.log: ready</SystemAnnotation>{' '}
      <SystemAnnotation tone="accent">status: ok</SystemAnnotation>{' '}
      <SystemAnnotation tone="danger">err: 404</SystemAnnotation>
    </>
  ),
};

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return colophon.title;
    },
    get description() {
      return colophon.lead;
    },
  };
};

const ColophonPage = () => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title={colophon.title} breadcrumbs={crumbs} kicker={colophon.kicker} lead={colophon.lead} annotation="壊して · ほどいて · 組み直す" />

      <section className={s.cell}>
        <SectionHeading no="01" more="$ cat making.md">
          site
        </SectionHeading>
        <Manifesto items={colophon.site} />
      </section>

      <section className={s.cell}>
        <SectionHeading no="02" more="$ cat code.md">
          code
        </SectionHeading>
        <Manifesto items={colophon.code} />
      </section>

      <section className={s.cell}>
        <SectionHeading no="03" more="$ cat type.md">
          type
        </SectionHeading>
        <p className={s.intro}>{colophon.typography.intro}</p>
        <TypeScale rows={colophon.typography.scale} />
        <FontRoles fonts={colophon.typography.fonts} />
        <SystemAnnotation tone="muted">{colophon.typography.bandNote}</SystemAnnotation>
      </section>

      <section className={s.cell}>
        <SectionHeading no="04" more="$ ls components/">
          ui
        </SectionHeading>
        <p className={s.intro}>{colophon.components.intro}</p>
        <ul className={s.ambientList}>
          {colophon.components.ambient.map((item) => (
            <AmbientPointer key={item.target} label={item.label} target={item.target} />
          ))}
        </ul>
        <div className={s.demoGrid}>
          {colophon.components.items.map((item) => (
            <ComponentDemo key={item.name} name={item.name} why={item.why}>
              {demos[item.name]}
            </ComponentDemo>
          ))}
        </div>
      </section>

      <section className={s.cell}>
        <SectionHeading no="05" more="$ ls stack/">
          stack
        </SectionHeading>
        <dl className={s.stack}>
          {colophon.stack.map((row) => (
            <div key={row.term} className={s.stackRow}>
              <dt className={s.stackTerm}>{row.term}</dt>
              <dd className={s.stackDesc}>{row.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={s.cell}>
        <SectionHeading no="06">source</SectionHeading>
        <a className={s.source} href={colophon.source.href} target="_blank" rel="noopener noreferrer">
          <span className={s.sourceLabel}>
            <ScrambleText>{colophon.source.label}</ScrambleText>
          </span>
          <span className={s.sourceHandle}>
            <ScrambleText>{colophon.source.handle}</ScrambleText>
          </span>
          <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>
  );
};

export default ColophonPage;
```

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS. (If oxlint flags `Record<string, ReactNode>` index access as possibly-undefined under your TS config, it will surface in typecheck — see Step 3 fallback.)

- [ ] **Step 3: If typecheck complains that `demos[item.name]` is possibly `undefined`**

Only if Step 2 fails on that line. `noUncheckedIndexedAccess` would make `demos[item.name]` be `ReactNode | undefined`, which is still a valid `children`, so this is unlikely to error. If it does, leave the record as-is — `ReactNode` already includes `undefined`. Do NOT add a non-null assertion (`!` is forbidden by `functional-programming.md`). Re-run `pnpm typecheck` to confirm PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/colophon/page.tsx
git commit -m "feat(colophon): assemble design-system page sections"
```

---

## Task 8: Run the full component test suite + manual verify

**Files:** none (verification only)

- [ ] **Step 1: Run all four new component tests together**

Run: `pnpm vitest run "src/app/(site)/colophon/_components"`
Expected: PASS — type-scale, font-roles, component-demo, ambient-pointer (manifesto too, if matched).

- [ ] **Step 2: Final lint + typecheck gate**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS (required by `.claude/rules/coding-rules.md` before completing any task).

- [ ] **Step 3: Manual visual check**

Run: `pnpm dev`, open `http://localhost:3000/colophon`. Verify:

- The 4-edge TypographyBand frame, drifting GameOfLife cells, and SysBar header are present (these are the live ambient demos the page points at).
- Section 03 shows the scale ladder (Ag specimens growing md→hero) and the three font specimens each in their own typeface.
- Section 04 shows three `▸ … → …` ambient pointers and a 2-column grid of six live component demos (hover ScrambleText to see it decode; Marquee scrolls; EchoText layers; Timeline highlights the upcoming row in accent).
- No horizontal page scroll from the hero specimen or Marquee.

---

## Task 9: Copy polish (design-writer)

The copy in `content.ts` (lead, intros, whys, bandNote) is a working 〜んだよなぁ調 draft. Refine the voice without touching `site[]`/`code[]` (those stay declarative).

**Files:**

- Modify: `src/app/(site)/colophon/content.ts` (copy strings only)

- [ ] **Step 1: Dispatch the design-writer agent**

Use the Agent tool with `subagent_type: "design-writer"`. Brief it: refine ONLY `lead`, `typography.intro`, `typography.bandNote`, each `components.items[].why`, and `components.intro` in `src/app/(site)/colophon/content.ts` into napochaan's raw 〜んだよなぁ😁 voice (consistent with news/blog). Do NOT touch `site[]`, `code[]`, `stack`, `source`, or the scale/fonts factual fields (token/px/ratio/role/family). Keep each string a single line.

- [ ] **Step 2: Apply the returned copy, then lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(site\)/colophon/content.ts
git commit -m "chore(colophon): polish 〜んだよなぁ copy"
```

---

## Task 10: Review handoff

**Files:** none

- [ ] **Step 1: Launch difit for review**

Per `CLAUDE.md`, start difit and request review from the user. Run: `pnpm difit` (or the project's configured difit command) and share the result.

- [ ] **Step 2: Update memory**

Update `colophon-design-system-page` memory: the page is now implemented and colophon's lead/narration IS aligned to the 〜んだよなぁ調 (the earlier "excluded from tone unification" note is superseded). Keep the [[design-direction]] / [[site-pages-ia]] links.

---

## Self-Review (completed by plan author)

- **Spec coverage:** 1枚完結統合 (Task 7) ✓ / 思想温存 (page keeps site+code, Task 7) ✓ / タイポ節 scale+jump+fonts (Tasks 1,4,5,7) ✓ / 厚選コンポ 6 inline + ambient pointers (Tasks 2,3,7) ✓ / 声の二層 (Task 1 draft + Task 9 polish, manifestos untouched) ✓ / 節順 思想→タイポ→コンポ→stack→source (Task 7) ✓ / chrome pointed-at not re-rendered (Task 2 + Task 8 manual) ✓ / no new shared components (all under colophon/\_components) ✓ / ISR revalidate kept (Task 7) ✓ / a11y headings: single h1 (PageHeader), sections use SectionHeading level 2 default, no skips ✓.
- **Placeholder scan:** none — all steps carry full code/commands. The "copy" strings are intentional working drafts refined in Task 9.
- **Type consistency:** `content.ts` shapes (`{token,px,ratio,role}`, `{family,role,why}`, `{label,target}`, `{name,why}`) match component props in Tasks 2–5 and usage in Task 7. `TimelineItem` import matches `@components/timeline` export. `Card as="div"`, `Marquee`, `EchoText(children:string)`, `SystemAnnotation tone`, `ScrambleText` default self — all match verified component signatures.
