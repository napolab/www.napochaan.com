# Design System Primitives Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Plan 1 で確定した token の上に、再利用可能な基盤 primitive（Button / Link / Tag / Badge / Card / SystemAnnotation）を Panda CSS + react-aria で実装し、browser-mode テストで挙動を保証する。

**Architecture:** 各 primitive は `src/components/<name>/{index.tsx, styles.css.ts, <name>.test.tsx}` の3点セット（既存 `src/components/image/` と同パターン）。スタイルは `@styled/css` の `css()`/`cva()`。CLAUDE.md の UI 実装順（1.HTML+CSS → 2.react-aria-components → 3.独自）に従い、**インタラクティブで a11y 要件のある Button のみ react-aria-components**、他は semantic HTML + Panda。`strictTokens: true` なので全スタイル値は token を使う。

**Tech Stack:** Panda CSS 1.11（`@styled/css` の `css`/`cva`）, react-aria-components 1.17, vitest 4 browser project（`*.test.tsx`, playwright chromium, `vitest-browser-react`）。

**前提 token（Plan 1 で確定済み・抜粋）:**

- color semantic: `bg.canvas/subtle/muted/emphasis`, `fg.default/muted/subtle/onSolid/onDanger`, `border.subtle/default/strong/focus`, `grid.line`, `accent.solid/solidHover/text/border`, `danger.solid/solidHover/text/border/spot`
- `fonts.display|body|mono`, `fontWeights.normal|medium|semibold`, `fontSizes.2xs|xs|sm|md|lg|xl|...`
- `radii.none|pill`, `borderWidths.none|hairline|default|strong`
- `spacing` 0〜24 + semantic `inline(8)|element(12)|block(24)|section(48)|page(24)`
- `sizes.targetComfortable(44px)`, `opacity.disabled`, `durations.snap`, `easings.stepSnap|step1`

---

## File Structure

| primitive        | files                                                                                   | UI 手段                                |
| ---------------- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| Button           | `src/components/button/{index.tsx,styles.css.ts,button.test.tsx}`                       | react-aria-components `Button` + `cva` |
| Link             | `src/components/link/{index.tsx,styles.css.ts,link.test.tsx}`                           | semantic `<a>` + `css`                 |
| Tag              | `src/components/tag/{index.tsx,styles.css.ts,tag.test.tsx}`                             | `<span>` pill + `cva`                  |
| Badge            | `src/components/badge/{index.tsx,styles.css.ts,badge.test.tsx}`                         | `<span>` + dot + `cva`                 |
| Card             | `src/components/card/{index.tsx,styles.css.ts,card.test.tsx}`                           | `<article>` frame + `css`              |
| SystemAnnotation | `src/components/system-annotation/{index.tsx,styles.css.ts,system-annotation.test.tsx}` | `<span>` mono + `cva`                  |

各 primitive は単一責任・独立テスト。barrel(index 再エクスポート)禁止（`no-barrel.md`）— consumer は各 `index.tsx` から直接 import。

**共通注意（全タスク）:**

- `strictTokens: true`。スタイル値は token のみ。`pnpm typecheck`(tsgo) が token 名を検証する。未知 token はエラーになるので、上記「前提 token」の範囲で組む。
- 規約: `.claude/rules/`（arrow 関数、`let`/`forEach`/`any`/`!` 禁止、early return、semantic-html、func-style）。
- テストは browser project: `pnpm test -- --project browser src/components/<name>/<name>.test.tsx`。
- 各タスク完了で commit（husky の lint+typecheck を通すこと。--no-verify 禁止）。
- `pnpm panda codegen` は通常不要（既存 styled-system に css/cva は生成済み）。新 recipe を panda.config に足す方式は採らない（`cva` インライン方式）。

---

## Task 1: Button（react-aria-components + cva）

**Files:**

- Create: `src/components/button/styles.css.ts`
- Create: `src/components/button/index.tsx`
- Test: `src/components/button/button.test.tsx`

- [ ] **Step 1: 失敗するテストを書く** — `src/components/button/button.test.tsx`

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { Button } from './index';

describe('Button', () => {
  it('renders its label', async () => {
    render(<Button>送信</Button>);
    await expect.element(page.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });

  it('calls onPress when clicked', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>押す</Button>);
    await page.getByRole('button', { name: '押す' }).click();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('does not call onPress when disabled', async () => {
    const onPress = vi.fn();
    render(<Button isDisabled onPress={onPress}>無効</Button>);
    await page.getByRole('button', { name: '無効' }).click({ force: true }).catch(() => {});
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes the variant via data attribute', async () => {
    render(<Button variant="danger">削除</Button>);
    await expect.element(page.getByRole('button', { name: '削除' })).toHaveAttribute('data-variant', 'danger');
  });
});
```

- [ ] **Step 2: 失敗確認**
      Run: `pnpm test -- --project browser src/components/button/button.test.tsx`
      Expected: FAIL（`Cannot find module './index'`）

- [ ] **Step 3: styles 実装** — `src/components/button/styles.css.ts`

```ts
import { cva } from '@styled/css';

export const button = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'inline',
    minH: 'targetComfortable',
    px: '4',
    fontFamily: 'mono',
    fontSize: 'sm',
    fontWeight: 'semibold',
    lineHeight: 'snug',
    borderWidth: 'default',
    borderStyle: 'solid',
    borderColor: 'fg.default',
    borderRadius: 'none',
    cursor: 'pointer',
    transitionProperty: 'transform, background-color, color',
    transitionDuration: 'snap',
    transitionTimingFunction: 'stepSnap',
    _hover: { transform: 'translate(3px, 3px)' },
    _focusVisible: {
      outlineWidth: 'strong',
      outlineStyle: 'solid',
      outlineColor: 'border.focus',
      outlineOffset: '0.5',
    },
    _disabled: { opacity: 'disabled', cursor: 'not-allowed', _hover: { transform: 'none' } },
  },
  variants: {
    variant: {
      solid: { bg: 'accent.solid', color: 'fg.onSolid', borderColor: 'accent.solid', _hover: { bg: 'accent.solidHover' } },
      outline: { bg: 'transparent', color: 'fg.default' },
      danger: { bg: 'danger.solid', color: 'fg.onDanger', borderColor: 'danger.solid', _hover: { bg: 'danger.solidHover' } },
    },
  },
  defaultVariants: { variant: 'solid' },
});
```

（`outlineOffset: '0.5'` が strictTokens で弾かれる場合は `'1'` 等の spacing token か、`outlineOffset: '2px'` がダメなら適切な token に。typecheck で解決すること。）

- [ ] **Step 4: component 実装** — `src/components/button/index.tsx`

```tsx
'use client';

import { Button as AriaButton } from 'react-aria-components';

import { button } from './styles.css';

import type { ButtonProps as AriaButtonProps } from 'react-aria-components';

type Variant = 'solid' | 'outline' | 'danger';

type Props = AriaButtonProps & { variant?: Variant };

export const Button = ({ variant = 'solid', className, children, ...rest }: Props) => {
  return (
    <AriaButton {...rest} data-variant={variant} className={button({ variant })}>
      {children}
    </AriaButton>
  );
};
```

（`className` をマージしたい場合は `@utils/clsx` の `clsx` を使用。RAC の `className` は関数も取れるが、ここでは文字列で十分。`children` が render-prop の場合は考慮不要—YAGNI。）

- [ ] **Step 5: 合格確認**
      Run: `pnpm test -- --project browser src/components/button/button.test.tsx`
      Expected: PASS（4ケース）。RAC の `isDisabled` で onPress 抑止、`onPress` で発火を確認。

- [ ] **Step 6: lint/typecheck & コミット**
      Run: `pnpm oxfmt --write src/components/button` then `pnpm lint && pnpm typecheck`（green 必須）

```bash
git add src/components/button
git commit -m "feat(ui): Button primitive (react-aria + cva, solid/outline/danger)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Link

semantic `<a>`。アクセント色テキスト、hover で青反転（global の a スタイルと衝突しないようコンポーネント側で完結）。外部リンクには `rel`/`target` を呼び出し側で付与できるよう props 透過。

**Files:** `src/components/link/{styles.css.ts,index.tsx,link.test.tsx}`

- [ ] **Step 1: テスト** — `link.test.tsx`

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Link } from './index';

describe('Link', () => {
  it('renders an anchor with href and label', async () => {
    render(<Link href="/works">作品</Link>);
    const link = page.getByRole('link', { name: '作品' });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute('href', '/works');
  });

  it('passes through target/rel for external links', async () => {
    render(<Link href="https://example.com" target="_blank" rel="noreferrer">外部</Link>);
    const link = page.getByRole('link', { name: '外部' });
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noreferrer');
  });
});
```

- [ ] **Step 2: 失敗確認**
      Run: `pnpm test -- --project browser src/components/link/link.test.tsx` → FAIL

- [ ] **Step 3: styles** — `styles.css.ts`

```ts
import { css } from '@styled/css';

export const link = css({
  color: 'accent.text',
  textDecorationLine: 'underline',
  textUnderlineOffset: '2px',
  borderRadius: 'none',
  transitionProperty: 'background-color, color',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: { bg: 'accent.solid', color: 'fg.onSolid', textDecorationLine: 'none' },
  _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0.5' },
});
```

（`textUnderlineOffset: '2px'` が strictTokens で不可なら token 化 or 許容値へ。typecheck で確認。）

- [ ] **Step 4: component** — `index.tsx`

```tsx
import { clsx } from '@utils/clsx';

import { link } from './styles.css';

import type { AnchorHTMLAttributes } from 'react';

type Props = AnchorHTMLAttributes<HTMLAnchorElement>;

export const Link = ({ className, children, ...rest }: Props) => {
  return (
    <a {...rest} className={clsx(link, className)}>
      {children}
    </a>
  );
};
```

- [ ] **Step 5: 合格確認** — Run browser test → PASS
- [ ] **Step 6: コミット**

```bash
pnpm oxfmt --write src/components/link && pnpm lint && pnpm typecheck
git add src/components/link
git commit -m "feat(ui): Link primitive (semantic anchor, accent text + invert hover)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Tag（pill）

非インタラクティブな分類ラベル。`<span>`、`radius: pill`、mono、variants（default=ink/blue/outline）。

**Files:** `src/components/tag/{styles.css.ts,index.tsx,tag.test.tsx}`

- [ ] **Step 1: テスト** — `tag.test.tsx`

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Tag } from './index';

describe('Tag', () => {
  it('renders label text', async () => {
    render(<Tag>flyer</Tag>);
    await expect.element(page.getByText('flyer')).toBeInTheDocument();
  });
  it('applies the tone via data attribute', async () => {
    render(<Tag tone="blue">live</Tag>);
    await expect.element(page.getByText('live')).toHaveAttribute('data-tone', 'blue');
  });
});
```

- [ ] **Step 2: 失敗確認** → FAIL
- [ ] **Step 3: styles** — `styles.css.ts`

```ts
import { cva } from '@styled/css';

export const tag = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: '2',
    fontFamily: 'mono',
    fontSize: '2xs',
    lineHeight: 'snug',
    letterSpacing: 'wide',
    borderRadius: 'pill',
    whiteSpace: 'nowrap',
  },
  variants: {
    tone: {
      default: { bg: 'fg.default', color: 'fg.onSolid' },
      blue: { bg: 'accent.solid', color: 'fg.onSolid' },
      outline: { bg: 'transparent', color: 'fg.default', borderWidth: 'hairline', borderStyle: 'solid', borderColor: 'fg.default' },
    },
  },
  defaultVariants: { tone: 'default' },
});
```

- [ ] **Step 4: component** — `index.tsx`

```tsx
import { tag } from './styles.css';

import type { HTMLAttributes } from 'react';

type Tone = 'default' | 'blue' | 'outline';

type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export const Tag = ({ tone = 'default', className, children, ...rest }: Props) => {
  return (
    <span {...rest} data-tone={tone} className={tag({ tone })}>
      {children}
    </span>
  );
};
```

（`className` マージが要るなら `clsx(tag({ tone }), className)`。cva の戻り値は文字列なので clsx 可。）

- [ ] **Step 5: 合格確認** → PASS
- [ ] **Step 6: コミット**

```bash
pnpm oxfmt --write src/components/tag && pnpm lint && pnpm typecheck
git add src/components/tag
git commit -m "feat(ui): Tag primitive (pill, mono, default/blue/outline tones)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Badge（status: dot + label）

「now playing」「rec」等の状態表示。`<span>` に色ドット + ラベル。variants（accent/danger/neutral）。

**Files:** `src/components/badge/{styles.css.ts,index.tsx,badge.test.tsx}`

- [ ] **Step 1: テスト** — `badge.test.tsx`

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Badge } from './index';

describe('Badge', () => {
  it('renders label and a status dot', async () => {
    render(<Badge>now playing</Badge>);
    await expect.element(page.getByText('now playing')).toBeInTheDocument();
    await expect.element(page.getByTestId('badge-dot')).toBeInTheDocument();
  });
  it('applies tone via data attribute', async () => {
    render(<Badge tone="danger">rec</Badge>);
    await expect.element(page.getByText('rec')).toHaveAttribute('data-tone', 'danger');
  });
});
```

- [ ] **Step 2: 失敗確認** → FAIL
- [ ] **Step 3: styles** — `styles.css.ts`

```ts
import { cva } from '@styled/css';

export const badge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'inline',
    fontFamily: 'mono',
    fontSize: 'xs',
    lineHeight: 'snug',
    color: 'fg.default',
  },
  variants: {
    tone: {
      accent: {},
      danger: {},
      neutral: {},
    },
  },
  defaultVariants: { tone: 'accent' },
});

export const dot = cva({
  base: { width: '2', height: '2', borderRadius: 'pill', flexShrink: '0' },
  variants: {
    tone: {
      accent: { bg: 'accent.solid' },
      danger: { bg: 'danger.solid' },
      neutral: { bg: 'fg.muted' },
    },
  },
  defaultVariants: { tone: 'accent' },
});
```

- [ ] **Step 4: component** — `index.tsx`

```tsx
import { badge, dot } from './styles.css';

import type { HTMLAttributes } from 'react';

type Tone = 'accent' | 'danger' | 'neutral';

type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export const Badge = ({ tone = 'accent', className, children, ...rest }: Props) => {
  return (
    <span {...rest} data-tone={tone} className={badge({ tone })}>
      <span data-testid="badge-dot" aria-hidden="true" className={dot({ tone })} />
      {children}
    </span>
  );
};
```

- [ ] **Step 5: 合格確認** → PASS
- [ ] **Step 6: コミット**

```bash
pnpm oxfmt --write src/components/badge && pnpm lint && pnpm typecheck
git add src/components/badge
git commit -m "feat(ui): Badge primitive (status dot + label, accent/danger/neutral)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Card（2px frame）

自己完結コンテンツの枠。semantic-html.md に従い既定要素は `<article>`（`as` で `div`/`section` に変更可）。2px ink ボーダー、radius none、hover で青アウトライン。

**Files:** `src/components/card/{styles.css.ts,index.tsx,card.test.tsx}`

- [ ] **Step 1: テスト** — `card.test.tsx`

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Card } from './index';

describe('Card', () => {
  it('renders children inside an article by default', async () => {
    render(<Card><h3>night vol.13</h3></Card>);
    const article = page.getByRole('article');
    await expect.element(article).toBeInTheDocument();
    await expect.element(page.getByRole('heading', { name: 'night vol.13' })).toBeInTheDocument();
  });

  it('can render as a different element', async () => {
    render(<Card as="div">x</Card>);
    await expect.element(page.getByText('x')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 失敗確認** → FAIL
- [ ] **Step 3: styles** — `styles.css.ts`

```ts
import { css } from '@styled/css';

export const card = css({
  display: 'block',
  bg: 'bg.canvas',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  borderRadius: 'none',
  p: 'element',
  transitionProperty: 'outline-color',
  transitionDuration: 'fast',
  transitionTimingFunction: 'stepSnap',
  _hover: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'accent.solid', outlineOffset: '-3px' },
});
```

（`outlineOffset: '-3px'` が strictTokens 不可なら負の token/許容値に。typecheck で解決。）

- [ ] **Step 4: component** — `index.tsx`

```tsx
import { clsx } from '@utils/clsx';

import { card } from './styles.css';

import type { ElementType, HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLElement> & { as?: ElementType };

export const Card = ({ as: Tag = 'article', className, children, ...rest }: Props) => {
  return (
    <Tag {...rest} className={clsx(card, className)}>
      {children}
    </Tag>
  );
};
```

（`Tag` は ElementType。`func-style`/JSX 大文字始まりに注意。`as` の型は最小限で良い—多態の完全型付けは YAGNI。）

- [ ] **Step 5: 合格確認** → PASS
- [ ] **Step 6: コミット**

```bash
pnpm oxfmt --write src/components/card && pnpm lint && pnpm typecheck
git add src/components/card
git commit -m "feat(ui): Card primitive (2px ink frame, article default, accent hover)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: SystemAnnotation（mono system text）

タイムスタンプ・座標・`not found`・`gen/alive` 等の「機械の声」。`<span>` mono、tone（muted/accent/danger）。装飾なので `aria-hidden` を任意で付けられる（既定は読み上げ対象=false でなく、呼び出し側判断。ここでは付けない）。

**Files:** `src/components/system-annotation/{styles.css.ts,index.tsx,system-annotation.test.tsx}`

- [ ] **Step 1: テスト** — `system-annotation.test.tsx`

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SystemAnnotation } from './index';

describe('SystemAnnotation', () => {
  it('renders mono system text', async () => {
    render(<SystemAnnotation>00:25AM</SystemAnnotation>);
    await expect.element(page.getByText('00:25AM')).toBeInTheDocument();
  });
  it('applies tone via data attribute', async () => {
    render(<SystemAnnotation tone="danger">not found</SystemAnnotation>);
    await expect.element(page.getByText('not found')).toHaveAttribute('data-tone', 'danger');
  });
});
```

- [ ] **Step 2: 失敗確認** → FAIL
- [ ] **Step 3: styles** — `styles.css.ts`

```ts
import { cva } from '@styled/css';

export const annotation = cva({
  base: {
    fontFamily: 'mono',
    fontSize: 'xs',
    lineHeight: 'snug',
    letterSpacing: 'wide',
  },
  variants: {
    tone: {
      muted: { color: 'fg.muted' },
      accent: { color: 'accent.text' },
      danger: { color: 'danger.text' },
    },
  },
  defaultVariants: { tone: 'muted' },
});
```

- [ ] **Step 4: component** — `index.tsx`

```tsx
import { annotation } from './styles.css';

import type { HTMLAttributes } from 'react';

type Tone = 'muted' | 'accent' | 'danger';

type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export const SystemAnnotation = ({ tone = 'muted', className, children, ...rest }: Props) => {
  return (
    <span {...rest} data-tone={tone} className={annotation({ tone })}>
      {children}
    </span>
  );
};
```

- [ ] **Step 5: 合格確認** → PASS
- [ ] **Step 6: コミット**

```bash
pnpm oxfmt --write src/components/system-annotation && pnpm lint && pnpm typecheck
git add src/components/system-annotation
git commit -m "feat(ui): SystemAnnotation primitive (mono system text, muted/accent/danger)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

- **Spec coverage:** primitive 一覧（spec §6 抽出 primitive）= Button/Link/Tag/Badge/Card/SystemAnnotation を Task 1-6 で網羅。avatar/image-frame/timeline-item/prose は Plan 3-4（レイアウト/コンテンツ）で扱う。
- **Placeholder scan:** 各 Task に test + styles + component の完全コードあり。strictTokens で弾かれうる値（outlineOffset/textUnderlineOffset）は注記し、実装者が typecheck で解決する指示。
- **Type consistency:** variants 名 `variant`(Button) / `tone`(Tag/Badge/SystemAnnotation) を統一。`data-variant`/`data-tone` 属性でテスト検証。clsx は `@utils/clsx`。
- **規約:** no-barrel（各 index から直接 import）、semantic-html（Card=article, Badge dot は aria-hidden）、func-style（arrow）、early-return。

## 注意（実装者向け）

- react-aria-components の `Button` は `onPress`（`onClick` でなく）。テストの click は RAC が press に変換。`isDisabled` で press 抑止。
- `strictTokens` でスタイル値が token 必須。`px:'4'` は spacing token(1rem)。`outlineOffset`/`textUnderlineOffset` 等が token を要求してエラーなら、近い spacing token（`'0.5'`=2px 等）に変更。どうしても token 化できない CSS は `[2px]` のエスケープ記法（Panda の arbitrary value）を使ってよい。
- browser テストは playwright chromium 起動に時間がかかる。タイムアウトに注意。
