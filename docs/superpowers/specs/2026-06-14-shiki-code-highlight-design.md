# Shiki code highlighting (RichText code block) — design

- Date: 2026-06-14
- Status: approved (design), pending implementation plan
- Scope: syntax-highlight the RichText `code` block server-side with Shiki, minimizing bundle size

## Goal

Bring syntax highlighting to fenced code blocks in CMS rich text (blog / works / news
bodies) so technical posts can intersperse code with prose. The hard constraint is
**minimal bundle size** — specifically the Cloudflare Worker (server) bundle, since the
Worker has a 1 MB compressed / 3 MB uncompressed limit and OpenNext bundles everything.

Non-goal: highlighting inline code (`` `const x = 1` ``). Inline code keeps its current
Panda-styled `inlineCode` treatment. Only block-level `code` nodes are highlighted.

## Why server-side (RSC)

`RichText` (`src/components/rich-text/index.tsx`) is a Server Component (no `'use client'`).
Highlighting therefore runs at render time in the Worker, and the client receives
**pre-colored HTML + CSS only — zero client JS for Shiki**. The bundle concern is entirely
the server/Worker bundle, not the client.

This is the inverse of the common "Shiki bloated my bundle" reports, which highlight in the
browser (client `codeToHtml`). We never do that.

## Architecture

```
[blog detail page]  (RSC, async)
  └─ <RichText data={lexical}/>                 (RSC)
       └─ codeConverter(node)                   sync: extractCode(node) → { code, lang }
            └─ <CodeBlock code lang/>           ★ async Server Component
                 ├─ const hl = await getHighlighter()      module singleton (memoized)
                 ├─ const hast = hl.codeToHast(code, { lang, theme })   sync once loaded
                 └─ toJsxRuntime(hast)          → colored <span> tree (React elements)
```

The sync-converter-cannot-await problem is solved by having the converter return an
**async Server Component** (`<CodeBlock>`); React's RSC renderer awaits it. No pre-warm
ordering to manage.

### Components & responsibilities

- `code/index.tsx` — `codeConverter`. Synchronously calls `extractCode(node)` and returns
  `<CodeBlock code={code} lang={lang} />`. No Shiki import here.
- `code/extract-code/index.ts` — pure function `extractCode(node)`. Reads the @lexical/code
  `code` node's `language` and folds its children (text + linebreak nodes) into a raw
  string. Returns `{ code, lang }`. Colocated test (TDD).
- `code/code-block/index.tsx` — **async Server Component**. Awaits the highlighter singleton,
  produces a hast via `codeToHast`, renders it to React with `hast-util-to-jsx-runtime`,
  wraps it in the Panda-styled `<pre>` container.
- `code/highlighter/index.ts` — `getHighlighter()` singleton (memoized promise wrapping
  `createHighlighterCore`), the JS regex engine, the lang list, and the custom theme object.
- `code/styles.css.ts` — the dark-terminal container (unchanged look) plus the `--code-*`
  CSS variable definitions sourced from Panda tokens.

## Bundle strategy

| Lever        | Decision                                                                | Effect                                                                                                           |
| ------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Engine       | `createJavaScriptRegexEngine` from `shiki/engine/javascript`            | Drops the ~1.5 MB Oniguruma WASM. ~23% smaller (39% gzipped). No wasm import on Workers.                         |
| Core         | `createHighlighterCore` from `shiki/core`                               | Avoids `shiki` barrel which pulls all langs/themes.                                                              |
| Languages    | individual imports, **`typescript`, `tsx`, `css`, `json`, `bash`** only | Grammars are the main Worker-bundle variable (~5–30 KB each). Add `glsl`/`html` later per-need, one import line. |
| Theme        | one hand-authored css-variables theme                                   | A few KB.                                                                                                        |
| hast → React | `hast-util-to-jsx-runtime`                                              | Small; avoids `dangerouslySetInnerHTML` and lets the Panda `className` sit on the container.                     |

New dependencies: `pnpm add shiki hast-util-to-jsx-runtime`
(`@shikijs/langs` / `@shikijs/themes` come transitively with `shiki`.)

The highlighter is a **module-level singleton** so a Worker isolate initializes it once and
reuses it across requests.

## Theme: Panda tokens via CSS variables

- The custom Shiki theme is `{ type: 'dark', bg: 'transparent', fg: 'var(--code-fg)', settings: [...] }`,
  where each scope's `foreground` is a `var(--code-*)` placeholder (keyword, string, number,
  comment, function, punctuation, …). `bg: transparent` because the panel background stays
  the existing Panda dark-terminal container.
- `styles.css.ts` defines `--code-fg`, `--code-keyword`, etc. from **new semantic Panda
  tokens** (e.g. `token(colors.code.keyword)`), so all colors live in the design system and
  remain swappable/themable.
- The container itself (ink `bg`, padding, `mono` font, no radius, `overflowX:auto`) is the
  current `codeBlock` style, kept as-is. Shiki only paints token foregrounds.

### Open item resolved at implementation time

The syntax palette requires **~6–8 new semantic color tokens** on the ink background. Per the
`panda-css` rule, adding tokens needs explicit approval: during implementation, propose the
palette (hex values meeting **WCAG 2.1 AA** contrast against the ink bg) via AskUserQuestion
and only add tokens to `panda.config.ts` after sign-off, then run Panda codegen.

## Language handling & fallback

- Supported langs are the bounded set above. `extractCode` returns the node's `language`.
- If `language` is missing or unsupported, fall back to `text` (plain, no tokens) — never
  throw. The block still renders in the dark-terminal container.

## Testing (TDD)

- `extract-code/extract-code.test.ts` — folds children into raw text correctly (text nodes,
  linebreaks → `\n`), reads `language`, handles missing language.
- `code-block` — a component test asserting that a known snippet produces token `<span>`s
  (e.g. a `keyword` color var) and that an unsupported lang renders plain text.

## Risks & verification

- **Async converter child under Payload `RichText`**: expected to work in RSC, but
  `pnpm typecheck` alone won't prove rendering. Verify with `pnpm build` + visual check of a
  blog detail page that contains a code block.
- **Regression**: there are currently 0 code nodes in seeded content, so the change cannot
  break existing rendered output; it only activates when a code block first appears.
- **ISR**: highlighting runs during the ISR render in the Worker; the singleton persists per
  isolate. No special cache handling needed.

## Out of scope

- Inline code highlighting.
- Line numbers, diff highlighting, copy-button, focus/highlight ranges (Shiki transformers) —
  addable later as transformers without changing this architecture.
- Authoring the gallery technical blog post itself (separate content task).
