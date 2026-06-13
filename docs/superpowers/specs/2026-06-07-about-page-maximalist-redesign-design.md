# /about — maximalist redesign

- date: 2026-06-07
- branch: feat/works-detail
- supersedes: the first /about implementation (terminal-session, committed-as-staged)

## Context

The first /about build rendered the real napochaan.com profile as a stack of five near-identical mono "terminal panes" (`$ whoami` / `$ cat bio.md` / `$ ls love/` / `$ ls skill/` / `$ contact --list`). Review found it under-expresses the site's established graphic-design maximalism: the Hero already owns a rich vocabulary — `EchoText` (large glitch display type), `SystemAnnotation` (coordinate / code marginalia like `5470009`, `▸ not found`, `35.6595 / 139.7006`), accent + danger squares, numbered section headings (`SectionHeading no="00"`), grid composition — and /about used none of it. The page read as a flat "dev terminal" with no focal point and uniform weight.

This redesign keeps the real content but rebuilds the page on the Hero vocabulary: **Approach A — masthead + asymmetric numbered grid**. The terminal motif is demoted from the section container to a small mono label on each numbered heading (terminal-as-accent).

## Decisions (approved)

- **masthead name**: `naporitan` via `EchoText` (the person; differentiates from the home Hero's `napochaan`).
- **skill presentation**: a **category matrix** (lang / frontend / backend / mobile / xr / data / infra), not a flat cloud.
- **contact**: button-style external links with a `↗` affordance (Hero `Button` vocabulary).
- **terminal survival**: `$ whoami` / `$ cat bio.md` / `$ ls love/` / `$ ls skill/` persist only as the mono `more` label on each `SectionHeading`, not as full panes.

## Layout

```
 [accent: A-0420]                                   [danger: ▸ whoami]
 // programmer · DJ · VJ · graphic — since 2020          (kicker)
 ███  n a p o r i t a n  ███   ← EchoText (large glitch display, = h1)
 ReactとTypeScriptのオタクだったりオタクじゃなかったりします。  ← lead
 [muted: 35.6595 / 139.7006]  ■blue ■red
═══════════════════════════════════════════════════════════
 01 whoami   $ whoami        02 bio   $ cat bio.md
  name naporitan              ┌──────────────────────────┐
  now  プログラマー           │ プログラマー。専門は…     │  ← RichText
  team StudioGnu              │ …StudioGnu に所属し…      │   (featured statement)
  aka  @naporin24690          └──────────────────────────┘
  (narrow ~4col)                (wide ~8col)   ← desktop asymmetric 2-col
───────────────────────────────────────────────────────────
 03 love   $ ls love/
  [ボカロ][DJ][VRChat][ニーゴ][valorant][東方][TypeScript][Cloudflare Workers]
───────────────────────────────────────────────────────────
 04 skill  $ ls skill/                          ← category matrix
  lang     [TypeScript][Python][Ruby][Swift][C#][Rust][Haskell]
  frontend [React][CSS][Panda CSS][Next.js][Remix]
  backend  [Hono][NestJS][GraphQL][Flask][FastAPI][Rails]
  mobile   [ReactNative][Expo]
  xr       [UdonSharp][Unity][WebAssembly]
  data     [pandas][NumPy][scikit-learn][Yjs][Drizzle][Prisma]
  infra    [vercel][firebase][Cloudflare]
───────────────────────────────────────────────────────────
 05 contact
  [ X @naporin24690 ↗ ]   [ github napolab ↗ ]
```

## Components

- **New** `about/_components/about-masthead/` — `EchoText` name + kicker + lead + three `SystemAnnotation`s (accent code, danger `▸ whoami`, muted coords) + blue/red squares. Renders the page's single `<h1>`.
- **New** `about/_components/skill-matrix/` — category matrix. Prop `{ groups: readonly { category: string; items: readonly string[] }[] }`. Renders a `<dl>`: each `<dt>` = category label (mono), each `<dd>` = a row of outline code-chips. No heading element (avoids h2→h3 skip; the section heading is the `04 skill` `SectionHeading`).
- **Reuse / restyle** `whoami/` (mono `<dl>`), `tag-cloud/` (outline code-chips — used for `love` and reused inside `skill-matrix`), `contact-list/` (restyled to button-style `↗` external links).
- **Shared reuse** `@components/echo-text`, `@components/system-annotation`, `@components/section-heading`, `@components/rich-text`.
- **Removed** `about/_components/terminal-block/` — replaced by `SectionHeading` (numbered) per section, with the `$…` command passed as the mono `more` label.

## Data — `about/profile.ts`

- Keep `name`, `aka`, `now`, `team`, `tagline`, `bio` (rich-text), `love` (flat), `contacts`.
- Replace flat `skill` with `skillGroups: readonly { category: string; items: readonly string[] }[]`. Grouping (interpretation, adjustable — all 32 covered):
  - `lang`: TypeScript, Python, Ruby, Swift, C#, Rust, Haskell
  - `frontend`: React, CSS, Panda CSS, Next.js, Remix
  - `backend`: Hono, NestJS, GraphQL, Flask, FastAPI, Rails
  - `mobile`: ReactNative, Expo
  - `xr`: UdonSharp, Unity, WebAssembly
  - `data`: pandas, NumPy, scikit-learn, Yjs, Drizzle, Prisma
  - `infra`: vercel, firebase, Cloudflare
- masthead annotation strings (`A-0420`, `▸ whoami`, `35.6595 / 139.7006`) live as presentational constants in `about-masthead`, not in profile.

## Responsive

- `about/styles.css.ts` (page): `@media` — desktop lays `01 whoami` / `02 bio` as an asymmetric 2-column grid (`grid-template-columns: [narrow] [wide]`); `03/04/05` are full width. Mobile stacks all sections.
- Components use `@container` for internal adaptation (skill-matrix category rows, tag-cloud wrap).

## Accessibility

- The `EchoText` masthead name is the page's single `<h1>`.
- Each numbered section uses `SectionHeading` as an `<h2>` (`no="01"…"05"`).
- `skill-matrix` uses `<dl>`/`<dt>`/`<dd>` (no heading element) so there is no h2→h3 skip.
- Contact links are external `<a target="_blank" rel="noopener noreferrer">`.
- Outline code-chips keep the legible black-on-paper + hairline treatment from the earlier fix; electric blue is reserved for hover.

## Testing (TDD)

- `about-masthead`: renders an `<h1>` whose accessible name is `naporitan`; renders the kicker and lead text.
- `skill-matrix`: renders each category label and each skill chip (e.g. `Hono`, `lang`).
- `tag-cloud`, `contact-list`, `whoami`: keep/adjust existing tests for the restyle (text + structure assertions unaffected).
- No page-level unit test (consistent with `works/[id]/page.tsx`).

## Build order

1. `profile.ts`: add `skillGroups`.
2. `about-masthead` (TDD).
3. `skill-matrix` (TDD).
4. `contact-list` restyle (button-style `↗`).
5. `whoami` / `tag-cloud` restyle as needed.
6. `page.tsx`: compose masthead + five numbered `SectionHeading` sections; drop `terminal-block`.
7. `styles.css.ts`: asymmetric grid + media queries.
8. Delete `terminal-block/`.
9. `pnpm lint && pnpm typecheck` + targeted vitest; difit review.

## Out of scope

- Real portrait/avatar (Approach B's avatar block is not used).
- Home `about` teaser changes (revisited in the home step).
- Payload CMS integration (profile stays sample/real-seed until the global is built).
