# Shiki Code Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Syntax-highlight the RichText `code` block server-side with Shiki, adding zero client JS and minimal Worker bundle.

**Architecture:** The `code` converter extracts `{ code, lang }` from the Lexical code node and returns an async Server Component `<CodeBlock>`. `<CodeBlock>` awaits a module-singleton Shiki highlighter (created with `shiki/core` + the JavaScript regex engine, only ts/tsx/css/json/bash grammars), produces a hast via `codeToHast`, and renders it to React with `hast-util-to-jsx-runtime`. A custom theme paints token foregrounds via `var(--code-*)` CSS variables sourced from Panda tokens; the dark-terminal container is unchanged.

**Tech Stack:** Next.js RSC, Payload Lexical RichText, Shiki v3 (`shiki/core`, `shiki/engine/javascript`), `hast-util-to-jsx-runtime`, Panda CSS (strictTokens), Vitest (browser mode).

**Spec:** `docs/superpowers/specs/2026-06-14-shiki-code-highlight-design.md`

---

## File Structure

```
src/components/rich-text/converters/code/
├── index.tsx                    # MODIFY: codeConverter → extractCode + <CodeBlock/>
├── styles.css.ts                # MODIFY: container unchanged + --code-* var defs
├── extract-code/
│   ├── index.ts                 # CREATE: pure fold of code node → { code, lang }
│   └── extract-code.test.ts     # CREATE: TDD (node runtime)
├── highlighter/
│   ├── index.ts                 # CREATE: getHighlighter() singleton + INK_THEME
│   └── highlighter.test.ts      # CREATE: TDD (node runtime)
└── code-block/
    ├── index.tsx                # CREATE: async Server Component
    └── code-block.test.tsx      # CREATE: TDD (browser mode, DOM)
panda.config.ts                  # MODIFY (Task 6): colors.code.* semantic tokens
```

Convention notes for the implementer:

- All top-level functions are **arrow functions** (`const fn = () => {}`); class methods n/a here.
- Import styles as a namespace: `import * as styles from './styles.css'`.
- No `let`, no `forEach`, no `String()/Number()/Boolean()` coercion, no non-null `!`.
- Acronyms keep canonical casing in identifiers (not relevant here, but `lang` stays `lang`).
- Run a single test file with: `pnpm vitest run <path>`.

---

## Task 1: Install dependencies

**Files:** `package.json` (via pnpm)

- [ ] **Step 1: Add the packages**

Run:

```bash
pnpm add shiki hast-util-to-jsx-runtime
```

Expected: `shiki` (v3.x) and `hast-util-to-jsx-runtime` added to `dependencies`. `@shikijs/langs` / `@shikijs/themes` arrive transitively under `shiki`.

- [ ] **Step 2: Verify the fine-grained entry points resolve**

Run:

```bash
node -e "import('shiki/core').then(m=>console.log(typeof m.createHighlighterCore)); import('shiki/engine/javascript').then(m=>console.log(typeof m.createJavaScriptRegexEngine))"
```

Expected: prints `function` twice.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add shiki + hast-util-to-jsx-runtime"
```

---

## Task 2: `extractCode` pure function

Folds a Lexical `code` node's children into a raw string and reads its language.

**Files:**

- Create: `src/components/rich-text/converters/code/extract-code/index.ts`
- Test: `src/components/rich-text/converters/code/extract-code/extract-code.test.ts`

- [ ] **Step 1: Write the failing test**

`extract-code/extract-code.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { extractCode } from './index';

describe('extractCode', () => {
  it('folds code-highlight children into a single string', () => {
    const node = {
      language: 'typescript',
      children: [
        { type: 'code-highlight', text: 'const x' },
        { type: 'code-highlight', text: ' = 1' },
      ],
    };

    expect(extractCode(node)).toEqual({ code: 'const x = 1', lang: 'typescript' });
  });

  it('turns linebreak children into newlines and tab into a tab', () => {
    const node = {
      language: 'css',
      children: [
        { type: 'code-highlight', text: 'a {' },
        { type: 'linebreak' },
        { type: 'tab' },
        { type: 'code-highlight', text: 'color: red;' },
        { type: 'linebreak' },
        { type: 'code-highlight', text: '}' },
      ],
    };

    expect(extractCode(node).code).toBe('a {\n\tcolor: red;\n}');
  });

  it('returns lang undefined when language is absent or null', () => {
    expect(extractCode({ children: [{ type: 'code-highlight', text: 'x' }] }).lang).toBeUndefined();
    expect(extractCode({ language: null, children: [] }).lang).toBeUndefined();
  });

  it('returns empty string for no children', () => {
    expect(extractCode({ language: 'json' })).toEqual({ code: '', lang: 'json' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/rich-text/converters/code/extract-code/extract-code.test.ts`
Expected: FAIL — `extractCode` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

`extract-code/index.ts`:

```ts
// Lexical's @lexical/code `code` block stores each token as a `code-highlight`
// child, with `linebreak` / `tab` nodes between them. Fold them back into the
// raw source string Shiki needs, and surface the node's `language`.
type CodeChild = { readonly type: string; readonly text?: string };
type CodeNode = { readonly language?: string | null; readonly children?: readonly CodeChild[] };

const childText = (child: CodeChild): string => {
  if (child.type === 'linebreak') return '\n';
  if (child.type === 'tab') return '\t';
  return child.text ?? '';
};

export const extractCode = (node: CodeNode): { code: string; lang?: string } => ({
  code: (node.children ?? []).map(childText).join(''),
  lang: node.language ?? undefined,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/rich-text/converters/code/extract-code/extract-code.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/rich-text/converters/code/extract-code
git commit -m "feat(rich-text): add extractCode for lexical code nodes"
```

---

## Task 3: Highlighter singleton + custom theme

A memoized Shiki highlighter using the JS regex engine and only the 5 grammars.

**Files:**

- Create: `src/components/rich-text/converters/code/highlighter/index.ts`
- Test: `src/components/rich-text/converters/code/highlighter/highlighter.test.ts`

- [ ] **Step 1: Write the failing test**

`highlighter/highlighter.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { getHighlighter, INK_THEME_NAME } from './index';

describe('getHighlighter', () => {
  it('returns a memoized singleton (same instance across calls)', async () => {
    const a = await getHighlighter();
    const b = await getHighlighter();

    expect(a).toBe(b);
  });

  it('loads the five expected languages', async () => {
    const hl = await getHighlighter();
    const loaded = hl.getLoadedLanguages();

    expect(loaded).toContain('typescript');
    expect(loaded).toContain('tsx');
    expect(loaded).toContain('css');
    expect(loaded).toContain('json');
    expect(loaded).toContain('bash');
  });

  it('highlights typescript into a hast tree under the ink theme', async () => {
    const hl = await getHighlighter();
    const hast = hl.codeToHast('const x = 1', { lang: 'typescript', theme: INK_THEME_NAME });

    expect(hast.type).toBe('root');
    expect(JSON.stringify(hast)).toContain('var(--code-');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/rich-text/converters/code/highlighter/highlighter.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

`highlighter/index.ts`:

```ts
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

import type { HighlighterCore, ThemeRegistrationRaw } from 'shiki/core';

export const INK_THEME_NAME = 'napochaan-ink';

// Token foregrounds are CSS variables, defined from Panda tokens in the code
// block's styles.css.ts. `background` is transparent so the Panda dark-terminal
// container provides the panel surface; Shiki only paints token colors.
const INK_THEME: ThemeRegistrationRaw = {
  name: INK_THEME_NAME,
  type: 'dark',
  settings: [
    { settings: { foreground: 'var(--code-fg)', background: 'transparent' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--code-comment)' } },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator'],
      settings: { foreground: 'var(--code-keyword)' },
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string', 'constant.other.symbol'],
      settings: { foreground: 'var(--code-string)' },
    },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: 'var(--code-number)' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call', 'entity.name.tag'], settings: { foreground: 'var(--code-function)' } },
    { scope: ['punctuation', 'meta.brace', 'meta.delimiter'], settings: { foreground: 'var(--code-punctuation)' } },
  ],
};

// Module-level singleton: a Worker isolate initializes the highlighter once and
// reuses it across requests. createHighlighterCore is async + costly.
let highlighterPromise: Promise<HighlighterCore> | undefined;

export const getHighlighter = (): Promise<HighlighterCore> => {
  highlighterPromise ??= createHighlighterCore({
    themes: [INK_THEME],
    langs: [
      import('@shikijs/langs/typescript'),
      import('@shikijs/langs/tsx'),
      import('@shikijs/langs/css'),
      import('@shikijs/langs/json'),
      import('@shikijs/langs/bash'),
    ],
    engine: createJavaScriptRegexEngine(),
  });

  return highlighterPromise;
};
```

> Note on `let`: the functional-programming rule bans `let` in app code. A module-level memo cell is the standard singleton pattern and is the one pragmatic exception; if oxlint flags it, use a holder object instead:
>
> ```ts
> const cache: { promise?: Promise<HighlighterCore> } = {};
> export const getHighlighter = (): Promise<HighlighterCore> => {
>   cache.promise ??= createHighlighterCore({ /* …same… */ });
>   return cache.promise;
> };
> ```
>
> Prefer the holder-object form to stay lint-clean.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/rich-text/converters/code/highlighter/highlighter.test.ts`
Expected: PASS (3 tests). If `@shikijs/langs/typescript` fails to resolve, switch the lang imports to `import('shiki/langs/typescript.mjs')` (same modules, package-internal path) and re-run.

- [ ] **Step 5: Commit**

```bash
git add src/components/rich-text/converters/code/highlighter
git commit -m "feat(rich-text): add memoized shiki highlighter (js engine, 5 langs)"
```

---

## Task 4: `<CodeBlock>` async Server Component

Awaits the singleton, highlights, renders hast → React, wraps in the Panda container.

**Files:**

- Create: `src/components/rich-text/converters/code/code-block/index.tsx`
- Test: `src/components/rich-text/converters/code/code-block/code-block.test.tsx`

- [ ] **Step 1: Write the failing test**

`code-block/code-block.test.tsx`:

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { CodeBlock } from './index';

describe('CodeBlock', () => {
  it('renders highlighted typescript with token color variables', async () => {
    const { container } = await render(<>{await CodeBlock({ code: 'const x = 1', lang: 'typescript' })}</>);

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    // Shiki emits inline color styles referencing our CSS variables.
    expect(container.innerHTML).toContain('var(--code-');
    expect(pre?.textContent).toBe('const x = 1');
  });

  it('falls back to plain text for an unsupported language', async () => {
    const { container } = await render(<>{await CodeBlock({ code: 'SELECT 1', lang: 'sql' })}</>);

    const pre = container.querySelector('pre');
    expect(pre?.textContent).toBe('SELECT 1');
  });

  it('renders plain text when language is undefined', async () => {
    const { container } = await render(<>{await CodeBlock({ code: 'plain', lang: undefined })}</>);

    expect(container.querySelector('pre')?.textContent).toBe('plain');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/rich-text/converters/code/code-block/code-block.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

`code-block/index.tsx`:

```tsx
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

import { getHighlighter, INK_THEME_NAME } from '../highlighter';
import * as styles from '../styles.css';

import type { Components } from 'hast-util-to-jsx-runtime';
import type { ReactNode } from 'react';

type Props = {
  readonly code: string;
  readonly lang?: string;
};

// Replace Shiki's <pre> (which carries a transparent inline background and the
// `.shiki` class) with the project's dark-terminal container. The inner <code>
// and its token <span>s — carrying `color:var(--code-*)` — are kept verbatim.
const CodePre = ({ children }: { readonly children?: ReactNode }) => <pre className={styles.codeBlock}>{children}</pre>;

const components: Partial<Components> = { pre: CodePre };

/**
 * Async Server Component. Highlights `code` with the singleton Shiki highlighter
 * and renders the resulting hast to React. Unsupported / missing `lang` falls
 * back to `text` (plain, no tokens) so it never throws. Zero client JS.
 */
export const CodeBlock = async ({ code, lang }: Props) => {
  const highlighter = await getHighlighter();
  const resolved = lang !== undefined && highlighter.getLoadedLanguages().includes(lang) ? lang : 'text';
  const hast = highlighter.codeToHast(code, { lang: resolved, theme: INK_THEME_NAME });

  return toJsxRuntime(hast, { Fragment, jsx, jsxs, components });
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/rich-text/converters/code/code-block/code-block.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/rich-text/converters/code/code-block
git commit -m "feat(rich-text): add async CodeBlock that highlights via shiki"
```

---

## Task 5: Wire the converter + provisional `--code-*` variables

Replace the plain `<pre><code>` converter with `extractCode` + `<CodeBlock>`, and define the `--code-*` variables from existing tokens (provisional — replaced by dedicated tokens in Task 6).

**Files:**

- Modify: `src/components/rich-text/converters/code/index.tsx`
- Modify: `src/components/rich-text/converters/code/styles.css.ts`

- [ ] **Step 1: Rewrite the converter**

Replace the entire body of `code/index.tsx` with:

```tsx
import { CodeBlock } from './code-block';
import { extractCode } from './extract-code';

import type { SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical';
import type { JSXConverter, JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

// Lexical's `code` block node is not in Payload's DefaultNodeTypes (it comes
// from @lexical/code). We register it via the string-keyed index signature so
// the converter fires when a `code` node appears in the document. The raw source
// and language are folded out of the node, then highlighted server-side.
type CodeBlockNode = SerializedLexicalNode & { language?: string | null; children?: { type: string; text?: string }[] };

const codeNodeConverter: JSXConverter<CodeBlockNode> = ({ node }) => {
  const { code, lang } = extractCode(node);

  return <CodeBlock code={code} lang={lang} />;
};

/**
 * Syntax-highlighted code block. Handles the Lexical `code` block node (fenced
 * code blocks from @lexical/code) — see ./code-block for the Shiki pipeline.
 */
export const codeConverter: Partial<JSXConverters<NodeTypes>> = {
  code: codeNodeConverter as JSXConverter,
};
```

- [ ] **Step 2: Add provisional `--code-*` vars to the container style**

In `code/styles.css.ts`, keep the existing `codeBlock` style and add the CSS variable definitions. Replace the file with:

```ts
import { css } from '@styled/css';

// DARK TERMINAL code block: ink bg, canvas text. Shiki paints token foregrounds
// via the --code-* variables below (theme `bg` is transparent, so this surface
// shows through). Provisional palette using existing tokens — Task 6 swaps these
// for dedicated colors.code.* tokens that meet WCAG AA on the ink background.
export const codeBlock = css({
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'sm',
  bg: 'fg.default',
  color: 'bg.canvas',
  p: 'element',
  borderRadius: 'none',
  overflowX: 'auto',
  marginBlockEnd: 'block',
  '&:last-child': { marginBlockEnd: '0' },
  '--code-fg': 'token(colors.bg.canvas)',
  '--code-comment': 'token(colors.fg.muted)',
  '--code-keyword': 'token(colors.accent.text)',
  '--code-string': 'token(colors.bg.canvas)',
  '--code-number': 'token(colors.accent.text)',
  '--code-function': 'token(colors.bg.canvas)',
  '--code-punctuation': 'token(colors.bg.canvas)',
});
```

> If oxlint/Panda rejects a custom-property key in the recipe, wrap them in an explicit `[` ` ]` arbitrary value (`'--code-fg': '[token(colors.bg.canvas)]'`) per the dynamic-styles escape-hatch convention, and re-run lint.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS. (`pnpm lint` runs oxfmt --check + oxlint; `pnpm typecheck` runs tsgo.)

- [ ] **Step 4: Run the whole rich-text test suite (regression)**

Run: `pnpm vitest run src/components/rich-text`
Expected: PASS — existing converter tests still pass; new code/\* tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/rich-text/converters/code/index.tsx src/components/rich-text/converters/code/styles.css.ts
git commit -m "feat(rich-text): wire shiki CodeBlock into the code converter"
```

---

## Task 6: Dedicated `colors.code.*` palette (token approval gate)

Replace the provisional colors with a dedicated, AA-contrast syntax palette. **This task is gated on user approval of the palette** per the panda-css rule — do not invent tokens silently.

**Files:**

- Modify: `panda.config.ts`
- Modify: `src/components/rich-text/converters/code/styles.css.ts`

- [ ] **Step 1: Propose the palette and get approval**

Use AskUserQuestion to present 1–2 candidate palettes for the seven token roles (`fg`, `comment`, `keyword`, `string`, `number`, `function`, `punctuation`) as hex values on the ink background (`colors.fg.default`). Each non-comment role must meet **WCAG 2.1 AA (≥ 4.5:1)** against the ink bg; `comment` may sit at the AA-large threshold but should stay legible. Show the contrast ratios. Do not proceed until the user picks.

- [ ] **Step 2: Add semantic tokens to `panda.config.ts`**

Locate the `theme.extend.tokens.colors` (or `semanticTokens.colors`) block and add a `code` group with the approved hex values, following the existing token-definition shape in the file. (Read the file first to match the exact structure — raw `tokens` vs `semanticTokens`, and the `{ value: '#…' }` form already in use.)

- [ ] **Step 3: Regenerate Panda + typecheck**

Run:

```bash
pnpm prepare && pnpm typecheck
```

(or the project's Panda codegen script — check `package.json` `scripts` for `panda codegen` / a `prepare` hook). Expected: `styled-system` regenerated, typecheck PASS. The new tokens are now valid in `token(colors.code.*)`.

- [ ] **Step 4: Repoint `--code-*` to the dedicated tokens**

In `code/styles.css.ts`, change the seven `--code-*` values from the provisional tokens to `token(colors.code.fg)`, `token(colors.code.comment)`, `token(colors.code.keyword)`, `token(colors.code.string)`, `token(colors.code.number)`, `token(colors.code.function)`, `token(colors.code.punctuation)`.

- [ ] **Step 5: Lint + typecheck + tests**

Run: `pnpm lint && pnpm typecheck && pnpm vitest run src/components/rich-text/converters/code`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add panda.config.ts src/components/rich-text/converters/code/styles.css.ts
git commit -m "feat(theme): add code syntax palette tokens (WCAG AA on ink)"
```

---

## Task 7: Build + visual verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck + lint + tests**

Run: `pnpm lint && pnpm typecheck && pnpm vitest run src/components/rich-text`
Expected: all PASS.

- [ ] **Step 2: Production build (proves async converter child works under OpenNext)**

Run: `pnpm build`
Expected: build succeeds. This is the real check that an async Server Component returned from a Payload converter renders under the production/RSC pipeline (typecheck alone cannot prove it — see spec Risks).

- [ ] **Step 3: Visual confirmation (manual, with the user)**

Because no seeded content contains a code block yet, ask the user to confirm visually once the first code block exists. Two options to offer:

- (a) Temporarily add a fenced code block to a local draft of the v3 blog post in the Payload admin and view `/blog/{id}` via `pnpm dev` (the user runs `pnpm dev`).
- (b) Defer visual sign-off to when the gallery technical post is authored.

Confirm: token colors render, the ink container is intact (background is ink, not transparent), horizontal overflow scrolls, and an unsupported-language block degrades to plain text.

- [ ] **Step 4: Report bundle impact (informational)**

After `pnpm build`, note the Worker bundle size from the build output and confirm it stays within Cloudflare limits. There is no client-bundle delta (Shiki never ships to the browser).

---

## Self-Review notes

- **Spec coverage:** server-side RSC (Tasks 4,7) · JS engine + core + 5 langs (Task 3) · async-converter-via-async-component (Task 4) · css-vars→Panda tokens (Tasks 5,6) · extractCode + fallback (Tasks 2,4) · TDD colocated tests (Tasks 2–4) · build/visual verification (Task 7). All spec sections map to a task.
- **Type consistency:** `getHighlighter()` / `INK_THEME_NAME` exported in Task 3 and consumed verbatim in Task 4; `extractCode` shape `{ code, lang? }` defined in Task 2 and consumed in Tasks 4–5; `CodeBlock` prop shape `{ code: string; lang?: string }` consistent across Tasks 4–5.
- **Fallback path:** `'text'` is Shiki's built-in plain language (needs no loaded grammar), so the fallback in Task 4 never throws even though `text` is not in the loaded-langs list.

```

```
