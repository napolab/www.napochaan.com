# Richtext Heading Copy-Anchor — Design

Date: 2026-06-13
Status: Approved
Branch: `content/blog-gallery-section` (implementation may branch from up-to-date `main`)

## Summary

Add a hover-revealed anchor affordance to richtext **body headings**. When a reader
hovers a heading in an article body, a `#` glyph fades into the left gutter; clicking
it copies that heading's deep-link URL (`https://…/blog/x#slug`) to the clipboard and
briefly confirms with a `✓`. Copy-only — the address bar is left untouched.

This surfaces the deep-link targets that already exist: `headingConverter`
(`src/components/rich-text/converters/heading/index.tsx`) already stamps each heading
with `id={slug}` for TOC linking. The only thing missing is the affordance to grab
that link.

## Scope

- **In scope:** headings rendered by the richtext heading converter that have a
  non-empty slug (i.e. an `id` is set). In practice article-body `h2`/`h3` in
  blog / works / news bodies.
- **Out of scope:** `PageHeader` page titles, the site-wide `Heading` primitive
  outside richtext, the TOC component, address-bar / `location.hash` updates.

## Interaction

```
## セクションの見出し          ← resting (anchor invisible)
        ↓ hover / focus-within
 # ▏## セクションの見出し       ← # fades into the left gutter
        ↓ click / press
 ✓ ▏## セクションの見出し       ← glyph → ✓, auto-resets after the timeout
```

- Resting: anchor is present in the DOM but `opacity: 0`.
- Revealed on the heading's `:hover` **or** `:focus-within` (keyboard reachable).
- Touch / coarse pointer (no hover): faint baseline opacity (~`0.4`) so it is
  discoverable without a hover state.
- Click/press copies; the glyph swaps `#` → `✓`; state auto-resets.

## Architecture

### New client island

`src/components/rich-text/converters/heading/anchor/`

```
anchor/
├── index.tsx        # 'use client' component
├── styles.css.ts    # Panda CSS
└── anchor.test.tsx  # vitest browser-mode test
```

- `'use client'`.
- Props: `{ slug: string }` — narrow input contract (no `null`).
- Renders a **react-aria `Button`** (UI rule tier 2), `aria-label="この見出しへのリンクをコピー"`.
- On press (async `useCallback`, no `.then`/IIFE):
  ```ts
  const handleCopy = useCallback(async () => {
    const href = new URL(`#${slug}`, window.location.href).href;
    await navigator.clipboard.writeText(href);
    setCopied(true);
  }, [slug, setCopied]);
  ```
- Transient confirmation via `useAutoResetState(false)` from `@hooks/use-auto-reset-state`
  (same idiom as `ShareBar`).
- Copied state mapped to a `data-copied` attribute (`data-copied={copied || undefined}`),
  never a conditional className.
- The `#` / `✓` glyph is drawn in CSS via `::before { content }`, switched on
  `&[data-copied]`. No glyph text in JSX (per the share-bar review rule).

Naming note: it both marks the anchor and copies the link; named `HeadingAnchor`.
It is internal to the richtext heading converter, so it is **not** added to the
colophon catalog — rich-text is already cataloged as a whole.

### Converter change

`src/components/rich-text/converters/heading/index.tsx`

Render the anchor as the heading's first child, gated on the existing non-empty-slug
condition:

```tsx
const slug = slugifyHeading(headingText(node));
return (
  <Heading level={level} id={slug !== '' ? slug : undefined} className={styles.heading}>
    {slug !== '' && <HeadingAnchor slug={slug} />}
    {nodesToJSX({ nodes: node.children })}
  </Heading>
);
```

The `HeadingAnchor` is a client component rendered as a child of the server-rendered
`<Heading>` — a valid RSC boundary (client island inside server output).

### Reveal mechanism (inheriting CSS custom property)

The "No child selectors" rule forbids `.heading:hover .anchor { … }`. Instead the
heading publishes an **inheriting custom property** that the anchor consumes:

`converters/heading/styles.css.ts` (additions to the existing `heading` style):

```ts
position: 'relative',
'--anchor-opacity': '0',
'&:hover':        { '--anchor-opacity': '1' },
'&:focus-within': { '--anchor-opacity': '1' },
```

anchor `styles.css.ts`:

```ts
position: 'absolute',
// left gutter: negative inline-start offset, within the body's existing inset
// (guard against horizontal overflow on narrow viewports).
opacity: 'var(--anchor-opacity, 0)',
// transition + opacity are strictTokens escape-hatch values (see share-bar note).
'@media (pointer: coarse)': { '--anchor-opacity': '0.4' },
```

`opacity` and `transitionProperty` require the strictTokens escape-hatch syntax
(noted previously with the share-bar work). Custom-property inheritance means the
anchor reads the heading's hovered value without any descendant selector.

## Constraints honored

| Rule                                | How                                                      |
| ----------------------------------- | -------------------------------------------------------- |
| Decorative glyphs in CSS, not JSX   | `#` / `✓` via `::before content`, keyed on `data-copied` |
| Transient state → generic hook      | `useAutoResetState` (no bespoke `useCopy`)               |
| URLs built with `new URL()`         | `new URL(\`#${slug}\`, window.location.href)`            |
| No child selectors                  | inheriting `--anchor-opacity` custom property            |
| Variant via `data-*`, not className | `data-copied` attribute                                  |
| UI tier order                       | react-aria `Button` (tier 2)                             |
| Narrow input contract               | `slug: string` (no `null`/`undefined` union)             |
| Async handler (no `.then`/IIFE)     | async `useCallback`                                      |
| TDD for `src/components`            | vitest browser-mode test, Red → Green → Refactor         |

## Testing

`anchor.test.tsx` (vitest browser mode — `.tsx`, DOM + `window` available):

1. Renders a button with the accessible name `この見出しへのリンクをコピー`.
2. Pressing it writes `…#<slug>` to a mocked `navigator.clipboard.writeText`
   (assert the URL ends with `#${slug}`).
3. After press, `data-copied` is set (confirmation state); reset behavior follows
   `useAutoResetState`.

No new colophon entry (internal to rich-text). Run `pnpm lint && pnpm typecheck`
after implementation.

## Revision — 2026-06-13 (post-implementation feedback)

After Tasks 1–2 landed, the author revised three points:

1. **Click = copy + smooth-scroll + hash (was copy-only).** Pressing the anchor now
   also smooth-scrolls the heading into view and updates the address bar to `#slug`
   via `history.replaceState` (replaceState, not `location.hash`, so the smooth
   scroll is not interrupted by an instant jump). The heading gains
   `scrollMarginBlockStart` so it clears any fixed top chrome on arrival.
2. **Confirmation is an accent flash, not `✓`.** The `#` → `✓` glyph swap is removed.
   On a successful copy the `#` briefly lights up in `accent.solid` (with a subtle
   glow) and fades back. Because hovering is a precondition of clicking, the
   _revealed_ `#` stays in a neutral tone (`fg.muted`, hover `fg.default`) and the
   electric-blue is reserved for the copied flash — otherwise the flash would be
   invisible against a hover-accent. The flash auto-resets fast (~800ms).
3. **`#` matches the heading font size.** The glyph is `1em` (was `md`); the button
   box scales with it (`1.5em` square).

The `data-copied` flag still drives the confirmation — it now toggles the flash
color/glow instead of the glyph content.

### Second round (visual + a11y polish)

- **Vertical centering.** The `#` is centered on the heading's first line via
  `top: 0.5lh` + `translateY(-50%)` (the anchor inherits the heading line-height,
  so `lh` resolves to the heading's line box) — it no longer sits low.
- **Bold glyph.** The `#` is `fontVariationSettings: '"wght" 700'` (mono variable
  axis, like the TOC label) so it reads as a deliberate mark, not incidental text.
- **Tighter focus ring.** Box `1.5em`→`1.4em`, `outlineOffset` `2px`→`1px`.
- **Focus ring no longer clipped.** The SiteShell `stage` (`overflowX: clip`) gains
  `overflowClipMargin: 8px` — the colophon demo-stage pattern — so a heading's
  gutter anchor ring near the content edge survives while wide transient overflow
  is still clipped.
- **Reduced motion honored.** The press scroll uses `behavior: 'auto'` when
  `usePrefersReducedMotion()` is true (matches the site's global scroll-behavior
  gate), `'smooth'` otherwise.

## Risks / edge cases

- **Mobile horizontal overflow:** the negative left offset must stay within the
  article body's existing left inset. Verify no horizontal scroll on narrow screens;
  reduce the offset (or clamp) if needed.
- **Headings without slugs:** anchor is simply not rendered (gated on slug).
- **Clipboard unavailable / denied:** `navigator.clipboard.writeText` rejects; the
  async handler should not crash the page (state simply does not flip). No silent
  catch that hides a real failure beyond the no-op.

```

```
