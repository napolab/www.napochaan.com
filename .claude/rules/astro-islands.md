---
description: Which React components in apps/web (Astro) may hydrate, and how islands are placed
paths:
  - "apps/web/src/**/*.{astro,tsx}"
---

# Astro Islands (apps/web)

apps/web renders React components from `.astro` through `@astrojs/react`. Without a
`client:*` directive a React component renders to static HTML and ships no JS. This rule
was a repeated review finding during the Next → Astro migration.

## The Island Rule

1. **Only client leaves get `client:*`.** A client leaf is a component that genuinely needs
   the browser (state, effects, event handlers, browser APIs) — in the Next app these were
   the `'use client'` modules. Everything else stays directive-free.
2. **Server trees stay directive-free.** Never hydrate a parent because a child is
   interactive. Hydrating a server tree ships its whole subtree as JS and re-renders it on
   the client.
3. **Place client leaves from `.astro`.** Either render the server React component from
   `.astro` with no directive and inject the leaf through a slot (default slot → `children`,
   `<X slot="more" />` → prop `more`), or, when the leaves come from a `.map` inside the
   component, write an `.astro` twin next to it (`components/<x>/<x>.astro`).
4. **Hydrated trees never depend on now / timezone / locale.** Cached HTML can be up to a
   year old (`.claude/rules/workers-cache.md`) and the visitor's clock, timezone and locale
   differ from the Worker's, so a hydrated `dayjs()` / `toLocaleString()` mismatches the
   server HTML. Compute such values on the server (`.astro` / server-only React) or pass
   them in as props.
5. **Islands go through `withAppProviders`.** Each island is its own React root, so
   providers rendered in `.astro` never reach it. Export the entry from
   `components/<leaf>/island.tsx` as `withAppProviders(Leaf)` (react-aria `RouterProvider`
   for `Link` / `MenuItem` soft navigation, `PathnameProvider`, `MotionProvider`) and pass
   `pathname={Astro.url.pathname}` plus `props={{ … }}`.

```astro
---
import { SectionHeading } from '@components/section-heading';
import { ButtonIsland } from '@components/button/island';

const { pathname } = Astro.url;
---

<!-- Good: server heading, only the leaf hydrates -->
<SectionHeading no="02" moreHref="/works">
  works<ButtonIsland slot="more" client:load pathname={pathname} props={{ variant: 'outline', children: 'more' }} />
</SectionHeading>

<!-- Bad: hydrates the whole server tree for one interactive child -->
<SectionHeadingIsland client:load pathname={pathname} props={{ no: '02', moreHref: '/works', children: 'works' }} />
```

## Prefer No Island: Custom Elements for Small Imperative Leaves

A leaf whose only browser work is imperative DOM wiring (listeners, gsap, observers) needs
no React root at all. Ship it as an `.astro` component driven by a custom element, the way
`ScrambleText` is (`components/scramble-text/scramble-text.astro` + `element.ts`):

- Logic lives in a framework-free module shared with the React component (`bind-scramble.ts`),
  so React islands that still need the leaf and the element never drift.
- Use `connectedCallback` / `disconnectedCallback`, never a run-once `<script>`, so it
  rebinds after `<ClientRouter />` soft navigations and survives `transition:persist`.
- Register from a `<script>` in the `.astro` (Astro bundles and dedupes it); the element
  module extends `HTMLElement`, so never import it from frontmatter.
- Make the element a `display: contents` wrapper (set by class) so it adds no box.
- Shared state comes from non-React modules (e.g. `boot-status/default-store.ts`,
  `@utils/prefers-reduced-motion`).
- Ancestors that drive the leaf are marked explicitly (`data-scramble-host` +
  `<ScrambleText trigger="group" />`), never found by a generic parent walk.
- Check reduced motion (`prefersReducedMotion()`) BEFORE `loadGsap()` / binding, so a
  reduced-motion visitor never fetches the gsap chunk or starts a loop (a React island's
  hydration effect sees the server snapshot `reduced=false` and fetches it anyway).
- Don't reach for gsap when a plain rAF loop / listener does: a leaf in the site shell
  (every page) pays gsap core on every page. `typography-band/bind-band.ts` replicates
  the ticker (lagSmoothing), ScrollTrigger velocity and the scrollTo tween in ~200 lines
  instead of loading gsap core + ScrollTrigger + ScrollToPlugin (~46KB gz).
- Anything that measures scroll / layout at bind defers while `isSwapping()`
  (`@utils/client-router-swap`) and binds at `astro:page-load`.
- `transition:persist` goes on the element itself. The swap moves a persisted node with
  synchronous disconnect + connect pairs (and connects the incoming page's copy for a
  moment), so a stateful leaf that must not restart reconciles in a microtask on
  `isConnected` instead of tearing down in `disconnectedCallback`
  (`typography-band/element.ts`).
- Interactive leaves (buttons) keep the React markup: render the React component from
  `.astro` without a directive inside the element (`share-bar.astro`,
  `copy-hash-button.astro`, `retry-button.astro`) and listen for `click` (covers every
  input modality). A react-aria data attribute the styles key on (`data-hovered`) is set
  by the element the way react-aria sets it.
- Register the tag in `CLIENT_LEAF_ELEMENTS` (`src/test-utils/island-parity.ts`): parity
  tests strip its wrapper, and page tests count it with `leafElementsOf` /
  `mainLeafElementsOf` instead of an island list.

## Modules That Render Without a Directive

- `Link` — a static `<a>`; Astro's `<ClientRouter />` soft-navigates it.
- `Image` — the inline blur script clears the placeholder (`.claude/rules/images.md`).

Hydrating either only adds JS.

## Shared State Across Islands

React context cannot cross island roots or Astro slots. State that several islands share
(boot status, life engine, presence, motion) lives in module-level stores, not providers.
A provider and its consumers that must share context have to be one island.

## React Only on Intent: Lazy-Mounted Leaves

The site shell (`shell-backdrop.astro`, `sys-bar.astro`, `cursor-presence.astro`) ships no
island, so a page without islands of its own loads no react-dom. A shell piece that truly
needs react-aria (the SysBar mobile menu) stays static markup until the first intent and
then mounts React from a dynamic import:

- The element wires the server-rendered react-aria face with plain listeners and records
  the press (`sys-bar/nav-menu/track-trigger.ts` → the existing `handoff.ts`).
- On the first intent it `import()`s a mount module (`sys-bar/nav-menu/mount.tsx`) that
  `createRoot`s into the trigger's container inside `flushSync`, with `AppProviders`
  (RouterProvider → `navigate`) and a path seeded from `location.pathname`.
- Stores an element needs must be framework-free modules (`game-of-life/shared-engine.ts`,
  `cursor-presence/presence-count.ts`, `sys-bar/clock-store.ts`, `@utils/motion-toggle`);
  the React hooks wrap them. `src/test-utils/element-import-graph.test.ts` fails when an
  element's static import graph reaches React.
