# QuoteShare (Selection Share Popover) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a reader selects body text on a detail page (PC only), float a Popover above the selection offering "copy a text-fragment deep link" and "quote it on X".

**Architecture:** A `'use client'` wrapper `<QuoteShare url>` receives the server-rendered `<RichText>` as `children` and stays a thin client island. It captures the selection on `onPointerUp` into `useState`, anchors a standalone react-aria `Popover` (`triggerRef` + controlled `isOpen`) to a fixed 0-size span placed at the selection rect, and renders a react-aria `Toolbar` with two actions built from the captured snapshot. Pure URL builders are extracted and unit-tested.

**Tech Stack:** Next.js App Router (RSC), react-aria-components (`Popover`, `Toolbar`), Panda CSS (`strictTokens`), vitest (node + browser mode via `vitest-browser-react`), `@typescript/native-preview` (tsgo).

---

## Pre-flight

- [ ] **Step 0: Branch from up-to-date main** (git-workflow rule)

```bash
git fetch origin main
git switch -c feat/quote-share origin/main
```

---

## File Structure

| File                                                          | Responsibility                                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/utils/tweet-intent/index.ts`                             | `buildTweetUrl(title, url)` — promoted from share-bar (now 2 consumers)                  |
| `src/utils/tweet-intent/tweet-intent.test.ts`                 | node test (moved)                                                                        |
| `src/utils/pointer-fine/index.ts`                             | `pointerFine()` snapshot + `subscribePointerFine()` over `matchMedia('(pointer: fine)')` |
| `src/hooks/use-pointer-fine/index.ts`                         | `usePointerFine(): boolean` via `useSyncExternalStore`                                   |
| `src/components/quote-share/build-text-fragment-url.ts`       | pure: `(baseUrl, text) => '…#:~:text=<encoded>'`                                         |
| `src/components/quote-share/truncate-quote.ts`                | pure: `(text) => '「…」'` clipped quote for the tweet                                    |
| `src/components/quote-share/index.tsx`                        | `QuoteShare` gate + `QuoteShareActive` logic + `QuoteToolbar`                            |
| `src/components/quote-share/styles.css.ts`                    | anchor span / popover / toolbar styles                                                   |
| `src/components/quote-share/quote-share.test.tsx`             | browser-mode behavior test                                                               |
| `src/components/share-bar/index.tsx`                          | MODIFY: import `buildTweetUrl` from `@utils/tweet-intent`                                |
| `src/app/(site)/blog/[id]/page.tsx`                           | MODIFY: wrap body `<RichText>`                                                           |
| `src/app/(site)/news/_components/news-detail/index.tsx`       | MODIFY: wrap body `<RichText>`                                                           |
| `src/app/(site)/works/[id]/_components/work-detail/index.tsx` | MODIFY: add `url` prop, wrap `<RichText>`                                                |
| `src/app/(site)/works/[id]/page.tsx`                          | MODIFY: pass `url` into `<WorkDetail>`                                                   |
| `src/app/(site)/colophon/content.ts`                          | MODIFY: add `quoteShare` item                                                            |
| `src/app/(site)/colophon/_demos/index.tsx`                    | MODIFY: add `quoteShare` demo                                                            |

**Reconciliation note (vs spec):** the spec mentioned drawing glyphs via CSS `::before` and a `data-copied` attribute. `@components/button` (`src/components/button/index.tsx`) **omits `className`** and owns its own styling, so we cannot pass per-instance `className`/`data-*` to it. We therefore mirror the **accepted `ShareBar` precedent**: swap the button label text (`引用リンク` → `コピーしました`, and `X で引用 ↗`) instead of CSS glyph swapping. This keeps the two share surfaces visually consistent.

---

## Task 1: Promote `buildTweetUrl` to `@utils/tweet-intent`

**Files:**

- Create: `src/utils/tweet-intent/index.ts`
- Create: `src/utils/tweet-intent/tweet-intent.test.ts`
- Modify: `src/components/share-bar/index.tsx` (import path)
- Delete: `src/components/share-bar/build-tweet-url.ts`, `src/components/share-bar/build-tweet-url.test.ts`

- [ ] **Step 1: Create the util (identical implementation, new home)**

`src/utils/tweet-intent/index.ts`:

```ts
// Build the X (Twitter) web intent URL. Stateless GET — prefills the compose
// window with `text` and `url`. Shared by ShareBar (whole-article share) and
// QuoteShare (selected-quote share).
export const buildTweetUrl = (title: string, url: string): string => {
  const text = encodeURIComponent(title);
  const target = encodeURIComponent(url);
  return `https://twitter.com/intent/tweet?text=${text}&url=${target}`;
};
```

- [ ] **Step 2: Move the test (only the import changes)**

`src/utils/tweet-intent/tweet-intent.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { buildTweetUrl } from './index';

describe('buildTweetUrl', () => {
  it('builds an X intent URL with encoded title and url', () => {
    const result = buildTweetUrl('作品 & タイトル', 'https://www.napochaan.com/works/1');
    expect(result).toBe('https://twitter.com/intent/tweet?text=%E4%BD%9C%E5%93%81%20%26%20%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB&url=https%3A%2F%2Fwww.napochaan.com%2Fworks%2F1');
  });
});
```

- [ ] **Step 3: Delete the old files and repoint ShareBar**

```bash
git rm src/components/share-bar/build-tweet-url.ts src/components/share-bar/build-tweet-url.test.ts
```

In `src/components/share-bar/index.tsx` change the import line:

```ts
// before:  import { buildTweetUrl } from './build-tweet-url';
import { buildTweetUrl } from '@utils/tweet-intent';
```

- [ ] **Step 4: Run the moved test + the existing share-bar test**

Run: `pnpm vitest run src/utils/tweet-intent src/components/share-bar`
Expected: PASS (both files green).

- [ ] **Step 5: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add -A
git commit -m "refactor(share): promote buildTweetUrl to @utils/tweet-intent"
```

---

## Task 2: `build-text-fragment-url` pure util (TDD)

**Files:**

- Create: `src/components/quote-share/build-text-fragment-url.test.ts`
- Create: `src/components/quote-share/build-text-fragment-url.ts`

- [ ] **Step 1: Write the failing test**

`src/components/quote-share/build-text-fragment-url.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { buildTextFragmentUrl } from './build-text-fragment-url';

describe('buildTextFragmentUrl', () => {
  it('appends an encoded text fragment to the base url', () => {
    expect(buildTextFragmentUrl('https://www.napochaan.com/blog/1', 'hello world')).toBe(
      'https://www.napochaan.com/blog/1#:~:text=hello%20world',
    );
  });

  it('strips any existing fragment before appending', () => {
    expect(buildTextFragmentUrl('https://www.napochaan.com/blog/1#foo', 'hi')).toBe(
      'https://www.napochaan.com/blog/1#:~:text=hi',
    );
  });

  it('trims and percent-encodes reserved characters', () => {
    expect(buildTextFragmentUrl('https://x.test/p', '  a & b  ')).toBe('https://x.test/p#:~:text=a%20%26%20b');
  });

  it('caps the fragment to the first 200 characters', () => {
    const long = 'あ'.repeat(300);
    const result = buildTextFragmentUrl('https://x.test/p', long);
    expect(result).toBe(`https://x.test/p#:~:text=${encodeURIComponent('あ'.repeat(200))}`);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/components/quote-share/build-text-fragment-url.test.ts`
Expected: FAIL — `buildTextFragmentUrl` is not defined / module missing.

- [ ] **Step 3: Write the minimal implementation**

`src/components/quote-share/build-text-fragment-url.ts`:

```ts
// Scroll-to-Text-Fragment deep link. Naive encode (single-block assumption): drop
// any existing fragment, trim, cap length, percent-encode. Long / multi-block
// selections may not match exactly — accepted tradeoff (see design doc risks).
const MAX_FRAGMENT_LEN = 200;

export const buildTextFragmentUrl = (baseUrl: string, selectedText: string): string => {
  const [base = baseUrl] = baseUrl.split('#');
  const text = selectedText.trim().slice(0, MAX_FRAGMENT_LEN);
  return `${base}#:~:text=${encodeURIComponent(text)}`;
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run src/components/quote-share/build-text-fragment-url.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/quote-share/build-text-fragment-url.ts src/components/quote-share/build-text-fragment-url.test.ts
git commit -m "feat(quote-share): add buildTextFragmentUrl"
```

---

## Task 3: `truncate-quote` pure util (TDD)

**Files:**

- Create: `src/components/quote-share/truncate-quote.test.ts`
- Create: `src/components/quote-share/truncate-quote.ts`

- [ ] **Step 1: Write the failing test**

`src/components/quote-share/truncate-quote.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { truncateQuote } from './truncate-quote';

describe('truncateQuote', () => {
  it('wraps a short selection in corner brackets', () => {
    expect(truncateQuote('やあ')).toBe('「やあ」');
  });

  it('trims surrounding whitespace', () => {
    expect(truncateQuote('  ことば  ')).toBe('「ことば」');
  });

  it('clips a long selection to 100 chars with an ellipsis', () => {
    const long = 'あ'.repeat(150);
    expect(truncateQuote(long)).toBe(`「${'あ'.repeat(100)}…」`);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/components/quote-share/truncate-quote.test.ts`
Expected: FAIL — `truncateQuote` is not defined.

- [ ] **Step 3: Write the minimal implementation**

`src/components/quote-share/truncate-quote.ts`:

```ts
// Format a selected passage as a quote for the tweet body: trim, clip to keep the
// tweet within limits (the URL eats characters too), wrap in Japanese corner brackets.
const MAX_QUOTE_LEN = 100;

export const truncateQuote = (text: string): string => {
  const trimmed = text.trim();
  const body = trimmed.length > MAX_QUOTE_LEN ? `${trimmed.slice(0, MAX_QUOTE_LEN)}…` : trimmed;
  return `「${body}」`;
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run src/components/quote-share/truncate-quote.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/quote-share/truncate-quote.ts src/components/quote-share/truncate-quote.test.ts
git commit -m "feat(quote-share): add truncateQuote"
```

---

## Task 4: `pointer: fine` detection (util + hook, TDD)

**Files:**

- Create: `src/utils/pointer-fine/index.ts`
- Create: `src/utils/pointer-fine/pointer-fine.test.tsx` (`.tsx` — touches `window`/`matchMedia`, so browser env per the test-extension routing rule)
- Create: `src/hooks/use-pointer-fine/index.ts`

- [ ] **Step 1: Write the failing test**

`src/utils/pointer-fine/pointer-fine.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';

import { pointerFine } from './index';

const stubMatchMedia = (matches: boolean): void => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pointerFine', () => {
  it('is true when (pointer: fine) matches', () => {
    stubMatchMedia(true);
    expect(pointerFine()).toBe(true);
  });

  it('is false when it does not match', () => {
    stubMatchMedia(false);
    expect(pointerFine()).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/utils/pointer-fine`
Expected: FAIL — module missing.

- [ ] **Step 3: Write the util**

`src/utils/pointer-fine/index.ts`:

```ts
// Whether the primary pointer is a mouse-like "fine" pointer. The selection-share
// Popover is desktop-only; touch devices fall back to the OS selection menu.
const QUERY = '(pointer: fine)';

export const pointerFine = (): boolean => typeof window !== 'undefined' && window.matchMedia(QUERY).matches;

export const subscribePointerFine = (onChange: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
```

- [ ] **Step 4: Write the hook**

`src/hooks/use-pointer-fine/index.ts`:

```ts
'use client';

import { useSyncExternalStore } from 'react';

import { pointerFine, subscribePointerFine } from '@utils/pointer-fine';

const getServerSnapshot = (): boolean => false;

// Live snapshot of `(pointer: fine)`. SSR defaults to false (touch-safe) so the
// interactive layer only attaches after hydration confirms a fine pointer.
export const usePointerFine = (): boolean => useSyncExternalStore(subscribePointerFine, pointerFine, getServerSnapshot);
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm vitest run src/utils/pointer-fine`
Expected: PASS (2 tests).

- [ ] **Step 6: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add src/utils/pointer-fine src/hooks/use-pointer-fine
git commit -m "feat(hooks): add usePointerFine (pointer: fine detection)"
```

---

## Task 5: `QuoteShare` component (TDD, browser mode)

**Files:**

- Create: `src/components/quote-share/quote-share.test.tsx`
- Create: `src/components/quote-share/index.tsx`
- Create: `src/components/quote-share/styles.css.ts`
- Reference (read before styling): `src/components/sys-bar/styles.css.ts` (the `popover` style — reuse its surface tokens so the floating bar matches the existing popover and stays within `strictTokens`).

- [ ] **Step 1: Write the failing behavior test**

`src/components/quote-share/quote-share.test.tsx`:

```tsx
import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { QuoteShare } from './index';

// Force a fine pointer so the interactive layer mounts deterministically.
const stubFinePointer = (): void => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(pointer: fine)',
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
};

// Select the whole paragraph and finish the gesture with a pointerup.
const selectParagraph = (el: Element): void => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('QuoteShare', () => {
  it('opens a share toolbar above a text selection and copies a text-fragment url', async () => {
    stubFinePointer();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(
      <QuoteShare url="https://www.napochaan.com/blog/1">
        <p>引用したい本文のテキスト</p>
      </QuoteShare>,
    );

    selectParagraph(page.getByText('引用したい本文のテキスト').element());

    const copy = page.getByRole('button', { name: '引用リンク' });
    await expect.element(copy).toBeInTheDocument();
    await copy.click();

    expect(writeText).toHaveBeenCalledWith('https://www.napochaan.com/blog/1#:~:text=%E5%BC%95%E7%94%A8%E3%81%97%E3%81%9F%E3%81%84%E6%9C%AC%E6%96%87%E3%81%AE%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88');
    await expect.element(page.getByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
  });

  it('exposes an X quote link whose href carries the text-fragment url', async () => {
    stubFinePointer();
    await render(
      <QuoteShare url="https://www.napochaan.com/blog/1">
        <p>引用したい本文のテキスト</p>
      </QuoteShare>,
    );

    selectParagraph(page.getByText('引用したい本文のテキスト').element());

    const link = page.getByRole('link', { name: /x/i });
    const href = link.element().getAttribute('href') ?? '';
    expect(href).toContain('twitter.com/intent/tweet');
    expect(href).toContain(encodeURIComponent('https://www.napochaan.com/blog/1#:~:text='));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/components/quote-share/quote-share.test.tsx`
Expected: FAIL — module `./index` has no `QuoteShare` export.

- [ ] **Step 3: Write the component**

`src/components/quote-share/index.tsx`:

```tsx
'use client';

import { useCallback, useRef, useState } from 'react';
import { Popover, Toolbar } from 'react-aria-components';

import { Button } from '@components/button';
import { useAutoResetState } from '@hooks/use-auto-reset-state';
import { usePointerFine } from '@hooks/use-pointer-fine';
import { buildTweetUrl } from '@utils/tweet-intent';

import { buildTextFragmentUrl } from './build-text-fragment-url';
import { truncateQuote } from './truncate-quote';
import * as styles from './styles.css';

import type { CSSProperties, ReactNode } from 'react';

type Rect = { top: number; left: number; width: number; height: number };
type Snapshot = { text: string; rect: Rect };

type Props = {
  url: string;
  children: ReactNode;
};

// Gate: only mount the interactive layer on a fine pointer. On touch we return the
// body untouched so the OS selection menu (copy / share) stays the affordance.
export const QuoteShare = ({ url, children }: Props) => {
  const fine = usePointerFine();
  if (!fine) return <>{children}</>;

  return <QuoteShareActive url={url}>{children}</QuoteShareActive>;
};

const QuoteShareActive = ({ url, children }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  // pointerup = selection settled. Capture text + rect when the (non-empty)
  // selection is inside our body; otherwise clear. Reading the live selection in a
  // React event handler avoids useEffect / external-store subscription.
  const handlePointerUp = useCallback(() => {
    const selection = window.getSelection();
    const container = containerRef.current;
    if (selection === null || selection.isCollapsed || container === null) {
      setSnapshot(null);
      return;
    }
    const text = selection.toString().trim();
    const anchorNode = selection.anchorNode;
    if (text === '' || anchorNode === null || !container.contains(anchorNode)) {
      setSnapshot(null);
      return;
    }
    const domRect = selection.getRangeAt(0).getBoundingClientRect();
    setSnapshot({ text, rect: { top: domRect.top, left: domRect.left, width: domRect.width, height: domRect.height } });
  }, []);

  // Starting a fresh gesture in the body dismisses the current toolbar. Presses on
  // the toolbar are portaled out of this container, so they never reach here.
  const handlePointerDown = useCallback(() => {
    setSnapshot(null);
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) setSnapshot(null);
  }, []);

  const anchorStyle =
    snapshot === null
      ? undefined
      : ({
          '--anchor-top': `${snapshot.rect.top}px`,
          '--anchor-left': `${snapshot.rect.left}px`,
          '--anchor-width': `${snapshot.rect.width}px`,
          '--anchor-height': `${snapshot.rect.height}px`,
        } as CSSProperties);

  return (
    <div ref={containerRef} className={styles.root} onPointerUp={handlePointerUp} onPointerDown={handlePointerDown}>
      {children}
      <span ref={triggerRef} className={styles.anchor} style={anchorStyle} aria-hidden="true" />
      {snapshot !== null && (
        <Popover triggerRef={triggerRef} isOpen onOpenChange={handleOpenChange} placement="top" isNonModal className={styles.popover}>
          <QuoteToolbar url={url} text={snapshot.text} />
        </Popover>
      )}
    </div>
  );
};

type ToolbarProps = {
  url: string;
  text: string;
};

// Snapshot is guaranteed non-null here (only rendered while a selection is captured),
// so both action URLs are built from a settled string — pressing a button can't
// break them even though the click collapses the live selection.
const QuoteToolbar = ({ url, text }: ToolbarProps) => {
  const [copied, setCopied] = useAutoResetState(false);
  const fragmentUrl = buildTextFragmentUrl(url, text);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fragmentUrl);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
  }, [fragmentUrl, setCopied]);

  return (
    <Toolbar aria-label="選択したテキストを共有" className={styles.toolbar}>
      <Button variant="outline" onPress={handleCopy}>
        {copied ? 'コピーしました' : '引用リンク'}
      </Button>
      <Button variant="outline" href={buildTweetUrl(truncateQuote(text), fragmentUrl)} target="_blank" rel="noopener noreferrer">
        X で引用 ↗
      </Button>
    </Toolbar>
  );
};
```

- [ ] **Step 4: Write the styles**

`src/components/quote-share/styles.css.ts` (layout below is concrete; for `popover` copy the exact surface tokens from `src/components/sys-bar/styles.css.ts`'s `popover` so it matches the existing popover and passes `strictTokens`):

```ts
import { css } from '@styled/css';

// display: contents — the wrapper adds no box (no layout shift) but stays in the
// DOM so `containerRef.contains(node)` can scope selections, and pointer events
// from the body bubble up to it.
export const root = css({
  display: 'contents',
});

// Invisible 0-interaction anchor pinned to the selection rect; react-aria positions
// the Popover relative to it. Fixed so getBoundingClientRect returns viewport coords.
export const anchor = css({
  position: 'fixed',
  top: 'var(--anchor-top)',
  left: 'var(--anchor-left)',
  width: 'var(--anchor-width)',
  height: 'var(--anchor-height)',
  pointerEvents: 'none',
});

// Floating surface — MIRROR sys-bar `popover` tokens (bg / border / shadow / z).
export const popover = css({
  // e.g. bg: 'bg.surface', borderWidth: 'default', borderStyle: 'solid',
  // borderColor: '<same as sys-bar>', ...  ← copy verbatim from sys-bar/styles.css.ts
});

export const toolbar = css({
  display: 'flex',
  gap: '2',
  padding: '2',
});
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm vitest run src/components/quote-share/quote-share.test.tsx`
Expected: PASS (2 tests). If `(pointer: fine)` matching is flaky, confirm the `stubFinePointer()` global stub is applied before `render`.

- [ ] **Step 6: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add src/components/quote-share
git commit -m "feat(quote-share): add selection-share Popover component"
```

---

## Task 6: Integrate into the three detail pages

**Files:**

- Modify: `src/app/(site)/blog/[id]/page.tsx`
- Modify: `src/app/(site)/news/_components/news-detail/index.tsx`
- Modify: `src/app/(site)/works/[id]/_components/work-detail/index.tsx`
- Modify: `src/app/(site)/works/[id]/page.tsx`

- [ ] **Step 1: Blog — wrap the body RichText**

In `src/app/(site)/blog/[id]/page.tsx` add the import:

```ts
import { QuoteShare } from '@components/quote-share';
```

Wrap the body cell's RichText (currently `{post.body === undefined ? null : <RichText data={post.body} />}`):

```tsx
<div className={s.bodyCol} data-toc-body>
  {post.body === undefined ? null : (
    <QuoteShare url={absoluteUrl(`/blog/${id}`)}>
      <RichText data={post.body} />
    </QuoteShare>
  )}
</div>
```

- [ ] **Step 2: News — wrap the body RichText**

In `src/app/(site)/news/_components/news-detail/index.tsx` add:

```ts
import { QuoteShare } from '@components/quote-share';
```

Wrap (current line 37, `<div className={s.body}>{item.body === undefined ? null : <RichText data={item.body} />}</div>`):

```tsx
<div className={s.body}>
  {item.body === undefined ? null : (
    <QuoteShare url={absoluteUrl(`/news/${item.id}`)}>
      <RichText data={item.body} />
    </QuoteShare>
  )}
</div>
```

- [ ] **Step 3: Works — add `url` prop to WorkDetail and wrap**

In `src/app/(site)/works/[id]/_components/work-detail/index.tsx`:

Add the import and extend the props type (the existing props type has `body?: SerializedEditorState` etc. — add `url: string`):

```ts
import { QuoteShare } from '@components/quote-share';
```

Add `url: string` to the component's props type, accept it in the destructure, and wrap the body (current line 56, `{body === undefined ? null : <RichText data={body} className={s.body} />}`):

```tsx
{body === undefined ? null : (
  <QuoteShare url={url}>
    <RichText data={body} className={s.body} />
  </QuoteShare>
)}
```

- [ ] **Step 4: Works page — pass the canonical url**

In `src/app/(site)/works/[id]/page.tsx`, the page already computes `absoluteUrl(\`/works/${id}\`)`for`ShareBar`. Pass the same to `WorkDetail`:

```tsx
<WorkDetail work={work} url={absoluteUrl(`/works/${id}`)} />
```

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (no type errors — `QuoteShare` accepts `{ url, children }`, `WorkDetail` now requires `url`).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(site)/blog/[id]/page.tsx" "src/app/(site)/news/_components/news-detail/index.tsx" "src/app/(site)/works/[id]/_components/work-detail/index.tsx" "src/app/(site)/works/[id]/page.tsx"
git commit -m "feat(quote-share): wire QuoteShare into blog/news/works detail bodies"
```

---

## Task 7: Colophon catalog entry (components rule — required)

**Files:**

- Modify: `src/app/(site)/colophon/content.ts`
- Modify: `src/app/(site)/colophon/_demos/index.tsx`

- [ ] **Step 1: Read both files to learn the exact shapes**

Run: `sed -n '1,40p' "src/app/(site)/colophon/content.ts"` and inspect how `components.items` entries (`{ name, why }`) and an existing flow demo in `_demos/index.tsx` are written (the demo map is keyed by component name; a name without a demo, or a demo without a content entry, is a compile error).

- [ ] **Step 2: Add the content entry**

In `src/app/(site)/colophon/content.ts`, add to `components.items`:

```ts
{ name: 'quoteShare', why: '本文を選択すると、その一節への text-fragment 深リンクのコピーと X 引用を選択範囲の上の Popover で出す（PC のみ）。' },
```

- [ ] **Step 3: Add the demo (selection is live; external href is noaction)**

In `src/app/(site)/colophon/_demos/index.tsx`, add a `quoteShare` entry that wraps a sample paragraph the visitor can actually select. Use a non-navigating sample URL; the X link inside the toolbar is real markup, so neutralize navigation per the rule by intercepting clicks on the demo region:

```tsx
quoteShare: (
  <QuoteShare url="https://www.napochaan.com/blog/sample">
    <p>この段落をドラッグで選択すると、選択範囲の上に共有バーが出ます（PC のみ）。</p>
  </QuoteShare>
),
```

Add the import at the top of `_demos/index.tsx`:

```ts
import { QuoteShare } from '@components/quote-share';
```

If the surrounding demo cells neutralize external navigation via a wrapper `onClickCapture={(e) => e.preventDefault()}` (follow whatever pattern the existing demos use for links/hrefs), ensure the `quoteShare` demo is inside that same neutralizing wrapper so the "X で引用" link does not actually navigate.

- [ ] **Step 4: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add "src/app/(site)/colophon/content.ts" "src/app/(site)/colophon/_demos/index.tsx"
git commit -m "docs(colophon): catalog QuoteShare"
```

---

## Final Verification

- [ ] **Step 1: Full test + lint + typecheck**

```bash
pnpm vitest run src/utils/tweet-intent src/utils/pointer-fine src/components/quote-share src/components/share-bar
pnpm lint && pnpm typecheck
```

Expected: all green.

- [ ] **Step 2: Manual browser check (ask the user to run `pnpm dev` — do not run it yourself)**

On `http://localhost:3000/blog/1` (and a works / news detail):

1. Drag-select a sentence in the body → a small bar appears above the selection.
2. Click **引用リンク** → label flips to **コピーしました**; paste the clipboard into the address bar → it ends with `#:~:text=…` and, on open, the browser scrolls to and highlights the passage.
3. Click **X で引用** → a new tab opens the X composer with `「…」` quote text and the text-fragment URL.
4. Press Escape / click elsewhere → the bar dismisses.
5. Open DevTools device toolbar (touch emulation) or a phone → selecting text shows the **OS** menu, not our bar (gate works).

- [ ] **Step 3: Finish the branch**

Use the `superpowers:finishing-a-development-branch` skill to open a PR (do not auto-commit/merge beyond the per-task commits above; the project rule forbids committing/merging without an explicit ask).

---

## Spec Coverage Check

| Spec requirement                               | Task                            |
| ---------------------------------------------- | ------------------------------- |
| Selection → Popover above range (PC only)      | 4 (gate), 5                     |
| `Popover` not `Tooltip`; `Toolbar` inside      | 5                               |
| ① copy text-fragment deep link                 | 2, 5                            |
| ② X quote with fragment URL                    | 1, 3, 5                         |
| Naive `encodeURIComponent` fragment            | 2                               |
| Captured-snapshot (selection-collapse trap)    | 5                               |
| `display: contents` wrapper, fixed anchor span | 5                               |
| `usePointerFine` via `useSyncExternalStore`    | 4                               |
| `buildTweetUrl` promoted, 2 consumers          | 1                               |
| Wire into blog / news / works                  | 6                               |
| Colophon entry                                 | 7                               |
| Dismiss on Escape / outside / new selection    | 5                               |
| Risks (multi-block, browser support)           | accepted in design doc; no code |
