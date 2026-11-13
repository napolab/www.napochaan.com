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
import { ScrambleTextIsland } from '@components/scramble-text/island';

const { pathname } = Astro.url;
---

<!-- Good: server heading, only the leaf hydrates -->
<SectionHeading no="02" moreHref="/works">
  works<ScrambleTextIsland slot="more" client:load pathname={pathname} props={{ children: '$ ls works/' }} />
</SectionHeading>

<!-- Bad: hydrates the whole server tree for one interactive child -->
<SectionHeadingIsland client:load pathname={pathname} props={{ no: '02', moreHref: '/works', children: 'works' }} />
```

## Modules That Render Without a Directive

- `Link` — a static `<a>`; Astro's `<ClientRouter />` soft-navigates it.
- `Image` — the inline blur script clears the placeholder (`.claude/rules/images.md`).

Hydrating either only adds JS.

## Shared State Across Islands

React context cannot cross island roots or Astro slots. State that several islands share
(boot status, life engine, presence, motion) lives in module-level stores, not providers.
A provider and its consumers that must share context have to be one island.
