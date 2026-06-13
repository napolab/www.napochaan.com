# Richtext Heading Copy-Anchor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hover-revealed left-gutter `#` affordance to richtext body headings that copies the heading's deep-link URL to the clipboard.

**Architecture:** A small `'use client'` island (`HeadingAnchor`) renders a react-aria `Button` whose `#`/`✓` glyph lives in CSS. It is injected as the first child of each slugged heading by the existing `headingConverter`. Visibility is driven by an inheriting `--anchor-opacity` custom property set on the heading (`:hover` / `:focus-within`), avoiding any descendant selector.

**Tech Stack:** React 19 RSC + client island, react-aria-components `Button`, Panda CSS (`strictTokens`), `@hooks/use-auto-reset-state`, vitest browser mode.

---

## Preconditions (not a code task)

- Per `.claude/rules/git-workflow.md`, prefer implementing on a fresh branch from up-to-date `main` (e.g. `feat/heading-copy-anchor`). The working tree currently sits on `content/blog-gallery-section` with unrelated uncommitted changes — confirm with the user whether to branch or continue on the current branch before committing.
- Spec: `docs/superpowers/specs/2026-06-13-richtext-heading-copy-anchor-design.md`.

## File Structure

| File                                                                 | Responsibility                                                          |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/components/rich-text/converters/heading/anchor/index.tsx`       | **Create.** Client island: copy button + transient state.               |
| `src/components/rich-text/converters/heading/anchor/styles.css.ts`   | **Create.** Gutter positioning, `#`/`✓` glyph, opacity-from-var reveal. |
| `src/components/rich-text/converters/heading/anchor/anchor.test.tsx` | **Create.** Unit test (browser mode).                                   |
| `src/components/rich-text/converters/heading/index.tsx`              | **Modify.** Inject `<HeadingAnchor>` when slug is non-empty.            |
| `src/components/rich-text/converters/heading/styles.css.ts`          | **Modify.** `position: relative` + `--anchor-opacity` reveal rules.     |
| `src/components/rich-text/rich-text.test.tsx`                        | **Modify.** Integration test: slugged heading renders the copy button.  |

No colophon entry — the anchor is internal to the already-cataloged rich-text component.

---

## Task 1: `HeadingAnchor` client island (TDD)

**Files:**

- Create: `src/components/rich-text/converters/heading/anchor/anchor.test.tsx`
- Create: `src/components/rich-text/converters/heading/anchor/styles.css.ts`
- Create: `src/components/rich-text/converters/heading/anchor/index.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/rich-text/converters/heading/anchor/anchor.test.tsx`:

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { HeadingAnchor } from './index';

describe('HeadingAnchor', () => {
  it('exposes a labelled copy button', async () => {
    await render(<HeadingAnchor slug="intro" />);
    await expect.element(page.getByRole('button', { name: 'この見出しへのリンクをコピー' })).toBeInTheDocument();
  });

  it('copies the current page URL with the heading fragment on press', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(<HeadingAnchor slug="intro" />);
    await page.getByRole('button', { name: 'この見出しへのリンクをコピー' }).click();

    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = writeText.mock.calls[0]?.[0];
    expect(copied).toMatch(/#intro$/);
  });

  it('marks itself copied after a successful press', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await render(<HeadingAnchor slug="intro" />);
    const button = page.getByRole('button', { name: 'この見出しへのリンクをコピー' });
    await button.click();

    await expect.element(button).toHaveAttribute('data-copied', 'true');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/rich-text/converters/heading/anchor/anchor.test.tsx`
Expected: FAIL — cannot resolve `./index` (module not created yet).

- [ ] **Step 3: Write the styles**

Create `src/components/rich-text/converters/heading/anchor/styles.css.ts`:

```ts
import { css } from '@styled/css';

// Left-gutter copy affordance for a richtext heading. The `#` / `✓` glyph is CSS
// content, so no glyph text lands in JSX. Visibility is inherited from the
// heading's `--anchor-opacity` custom property (set there on :hover /
// :focus-within), so no descendant selector is needed here. The em-based offset,
// `var()` opacity, transitions and pixel sizes are strictTokens escape-hatch
// values (`[...]`) — they have no semantic token and must scale with the heading.
export const root = css({
  position: 'absolute',
  insetInlineStart: '[-1.5em]',
  top: '0',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[1.5rem]',
  height: '[1.5rem]',
  fontFamily: 'mono',
  fontSize: 'md',
  lineHeight: 'none',
  color: 'fg.muted',
  cursor: 'pointer',
  opacity: '[var(--anchor-opacity, 0)]',
  transitionProperty: '[opacity, color]',
  transitionDuration: '[150ms]',
  transitionTimingFunction: '[ease]',
  _before: { content: '"#"' },
  '&[data-hovered]': { color: 'accent.solid' },
  '&[data-copied]': { color: 'accent.solid' },
  '&[data-copied]::before': { content: '"✓"' },
  '&[data-focus-visible]': {
    outlineWidth: '[2px]',
    outlineStyle: 'solid',
    outlineColor: 'accent.solid',
    outlineOffset: '[2px]',
  },
});
```

- [ ] **Step 4: Write the component**

Create `src/components/rich-text/converters/heading/anchor/index.tsx`:

```tsx
'use client';

import { useCallback } from 'react';
import { Button } from 'react-aria-components';

import { useAutoResetState } from '@hooks/use-auto-reset-state';

import * as styles from './styles.css';

type Props = {
  slug: string;
};

// Hover-revealed gutter affordance for a richtext body heading. Copies the
// heading's deep-link URL (current page + #slug) to the clipboard and flips a
// transient `data-copied` flag (auto-resets via useAutoResetState, same idiom as
// ShareBar). The `#` / `✓` glyph lives in CSS, and reveal is driven by the parent
// heading's inheriting `--anchor-opacity`, so this island owns no hover state.
export const HeadingAnchor = ({ slug }: Props) => {
  const [copied, setCopied] = useAutoResetState(false);

  const handleCopy = useCallback(async () => {
    const href = new URL(`#${slug}`, window.location.href).href;
    await navigator.clipboard.writeText(href);
    setCopied(true);
  }, [slug, setCopied]);

  return (
    <Button
      type="button"
      aria-label="この見出しへのリンクをコピー"
      onPress={handleCopy}
      data-copied={copied || undefined}
      className={styles.root}
    />
  );
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run src/components/rich-text/converters/heading/anchor/anchor.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Lint & typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: no errors. (If Panda reports a strictTokens error on a token name, switch that single value to a `[...]` escape — do not introduce hardcoded non-escaped values.)

- [ ] **Step 7: Commit**

```bash
git add src/components/rich-text/converters/heading/anchor
git commit -m "feat(blog): add copy-link anchor for richtext headings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Wire the anchor into the heading converter (TDD)

**Files:**

- Modify: `src/components/rich-text/rich-text.test.tsx` (add one integration test)
- Modify: `src/components/rich-text/converters/heading/index.tsx`
- Modify: `src/components/rich-text/converters/heading/styles.css.ts`

- [ ] **Step 1: Write the failing integration test**

In `src/components/rich-text/rich-text.test.tsx`, add this test inside the `describe('RichText', ...)` block (e.g. directly after the existing `renders an h2 heading` test):

```tsx
  it('renders a copy-link button in a slugged heading', async () => {
    render(<RichText data={state([heading('h2', [text('はじめに')])])} />);
    await expect.element(page.getByRole('button', { name: 'この見出しへのリンクをコピー' })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/components/rich-text/rich-text.test.tsx -t "copy-link button"`
Expected: FAIL — no button with that accessible name (converter not wired yet).

- [ ] **Step 3: Modify the heading converter**

Edit `src/components/rich-text/converters/heading/index.tsx`. Add the import near the existing relative imports:

```tsx
import { HeadingAnchor } from './anchor';
```

Then change the returned JSX so the anchor is the heading's first child, gated on the same non-empty-slug condition already used for `id`:

```tsx
  heading: ({ node, nodesToJSX }) => {
    const level = tagToLevel(node.tag);
    const slug = slugifyHeading(headingText(node));
    return (
      <Heading level={level} id={slug !== '' ? slug : undefined} className={styles.heading}>
        {slug !== '' && <HeadingAnchor slug={slug} />}
        {nodesToJSX({ nodes: node.children })}
      </Heading>
    );
  },
```

- [ ] **Step 4: Add the reveal rules to the heading style**

Edit `src/components/rich-text/converters/heading/styles.css.ts`. Add `position` and the custom-property reveal rules to the existing `heading` css object (place them alongside the existing top-level declarations, before the `'&:first-child'` rule). Append the comment so the intent is clear:

```ts
  // The gutter copy-anchor (HeadingAnchor) is absolutely positioned against the
  // heading, and reveals itself by reading the inheriting `--anchor-opacity`
  // custom property — set to 0 at rest and raised on hover / keyboard focus.
  // A descendant selector (`.heading:hover .anchor`) is disallowed by the
  // no-child-selectors rule, so the heading publishes the value and the anchor
  // consumes it. Coarse pointers have no hover, so the baseline is raised to keep
  // the affordance discoverable on touch.
  position: 'relative',
  '--anchor-opacity': '0',
  '&:hover': { '--anchor-opacity': '1' },
  '&:focus-within': { '--anchor-opacity': '1' },
  '@media (pointer: coarse)': { '--anchor-opacity': '0.4' },
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm vitest run src/components/rich-text/rich-text.test.tsx`
Expected: PASS (all existing tests + the new `copy-link button` test).

- [ ] **Step 6: Lint & typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/rich-text/converters/heading/index.tsx \
        src/components/rich-text/converters/heading/styles.css.ts \
        src/components/rich-text/rich-text.test.tsx
git commit -m "feat(blog): reveal heading copy-anchor on hover in richtext

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the rich-text test suite**

Run: `pnpm vitest run src/components/rich-text`
Expected: PASS — Task 1 (3 tests) + Task 2 integration test + all pre-existing converter tests green.

- [ ] **Step 2: Lint & typecheck the whole project**

Run: `pnpm lint && pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Manual browser check (optional, needs a running dev server)**

If `pnpm dev` is running (localhost:3000, started by the user — do NOT start/kill it yourself per the dev-server memory rules), open a blog detail page with body headings and verify:

- Hovering a body `h2`/`h3` fades a `#` into the left gutter without shifting the heading text.
- Clicking copies `…/blog/<id>#<slug>` (paste to confirm) and the glyph briefly shows `✓`, then resets.
- Tab focus reaches the button and reveals it (`:focus-within`); the focus ring is visible.
- No horizontal scrollbar appears at narrow widths. If the gutter `#` causes overflow on mobile, reduce `insetInlineStart` from `[-1.5em]` toward the body's available inset and re-verify.

---

## Self-Review Notes

- **Spec coverage:** scope (richtext slugged headings only) → Task 2 slug gate; left-gutter `#` reveal → Task 1 styles + Task 2 reveal rules; copy-only behavior → Task 1 `handleCopy` (no `location.hash` write); `#`/`✓` in CSS → Task 1 `_before`/`data-copied`; transient state via `useAutoResetState` → Task 1; `new URL()` → Task 1; no child selector (inheriting var) → Task 2 Step 4; `data-*` variant not className → Task 1; react-aria Button → Task 1; narrow `slug: string` input → Task 1; TDD → Tasks 1–2; touch baseline → Task 2 Step 4; mobile-overflow risk → Task 3 Step 3.
- **No placeholders:** every code step shows full content; commands have expected output.
- **Type consistency:** `HeadingAnchor` props `{ slug: string }` defined in Task 1 and consumed identically in Task 2; accessible name string `この見出しへのリンクをコピー` matches across component, unit tests, and integration test; `data-copied` attribute asserted in Task 1 Step 1 matches the component in Step 4.
