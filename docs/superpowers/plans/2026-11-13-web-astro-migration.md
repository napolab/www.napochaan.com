# web: Next.js → Astro Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `apps/web` (Next.js 16 + OpenNext) with an Astro SSR app on Cloudflare Workers that serves every existing URL with identical content and cache headers.

**Architecture:** Build `apps/web-astro` alongside `apps/web`, reuse the React components as Astro islands (`@astrojs/react`), keep the existing Hono Worker (`worker/`) as the outermost layer and mount Astro's Cloudflare handler where OpenNext's was. Page transitions use `<ClientRouter />` with `transition:persist` on the shell. The final task deletes `apps/web` and renames `apps/web-astro` → `apps/web`.

**Tech Stack:** Astro 7.x, `@astrojs/cloudflare` 14.x, `@astrojs/react` 7.x, React 19, react-aria-components, Panda CSS, Hono, vitest (browser mode + workers pool), oxlint/oxfmt, tsgo, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-13-web-astro-migration-design.md`

## Global Constraints

- Every rule in `CLAUDE.md` and `.claude/rules/*` applies (arrow functions, no `let`, no barrel, no `!`, no `forEach`, acronym casing, early return, getter pattern, template literals / parseInt).
- Before touching a library API you have not verified, research it (context7 or web) against the **installed** version. Astro 7 / adapter 14 APIs differ from older blog posts.
- TDD with vitest. `pnpm --filter web-astro lint && pnpm --filter web-astro typecheck && pnpm --filter web-astro test` must be green at the end of every task.
- URLs, `Cache-Control` per `.claude/rules/workers-cache.md`, canonical / OG / robots meta must not change.
- Every page is SSR (`export const prerender = false` is the default via `output: 'server'`). No prerender, no query-keyed pagination.
- Any CMS access goes through `getCMSClient()` which reads the per-request env (Task 1) — never `import { env } from 'cloudflare:workers'` (that would bypass `cms-health`).
- Links: react-aria-components `Link` under a `RouterProvider` whose `navigate` is Astro's `navigate`.
- Images: `src/components/image` + `formatBlurURL`.
- Do not modify `tsconfig.json` `paths` beyond copying the existing aliases (`@components`, `@lib`, `@utils`, `@themes`, `@hooks`, …) verbatim.
- Do not change `apps/cms` except where a task explicitly says so.
- Commit at the end of each task with Conventional Commits; end messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push until Task 12.

## Review Focus

1. **Navigating between pages must not reconnect the cursor-presence WebSocket, restart the ambient backdrop, or replay the boot overlay.** → Task 3 test `persists shell islands across navigation`.
2. **A CMS read that fails (throws / ≥500) during an Astro render must make the response `no-store`**, including reads that happen late in a streamed render. → Task 1 test `marks degraded when CMS fails inside Astro render`.
3. **`.md` twins with dots / unknown slugs:** `/blog/a.b.md` must resolve slug `a.b`; `/blog/missing.md` and `/blog/missing` must return 404 (not 200) and must not be cached under the `cms` policy. → Task 5 tests.
4. **Preview routes without a valid draft cookie return 404 and are `no-store`; with the cookie inside the cms-origin iframe (cross-site) they render the draft.** → Task 9 tests.
5. **After a CMS publish + purge, a long-open tab navigating with ClientRouter (incl. back/forward) shows fresh HTML** — no client-side HTML cache. → Task 3 test `does not reuse cached documents on back navigation` (assert ClientRouter fetch is issued; prefetch disabled or `prefetchAll: false`).

---

## File Structure (apps/web-astro)

```
apps/web-astro/
  astro.config.ts            # output:'server', cloudflare adapter, react, redirects (/logs→/log), vite svgr + linkedom browser shim
  wrangler.toml              # copied from apps/web, main → ./worker/worker.ts, assets dir → ./dist/client (per adapter)
  panda.config.ts, postcss.config.cjs, vitest.config.ts, tsconfig.json, package.json (name "web-astro")
  worker/                    # copied from apps/web/worker; handlers/next → handlers/astro
  src/
    lib/request-context/     # NEW: AsyncLocalStorage store for {env, ctx, request}
    lib/navigation/          # NEW: usePathname / useRouter over astro:transitions
    lib/draft-mode/          # NEW: signed draft cookie (replaces next/headers draftMode)
    layouts/SiteLayout.astro # NEW: <html>, head scripts, Seo, ClientRouter, persisted SiteShell
    components/seo/          # NEW: Seo.astro + build-metadata (pure fn, ported from generateMetadata)
    components/, lib/, utils/, themes/, hooks/, assets/, adapters/   # copied from apps/web/src, Next imports removed
    pages/                   # NEW: one file per existing route (see tasks)
    actions/index.ts         # NEW: Astro Action for contact
```

---

### Task 1: Scaffold + Worker + request context, one page end-to-end

**Files:**
- Create: `apps/web-astro/{package.json,astro.config.ts,tsconfig.json,wrangler.toml,panda.config.ts,postcss.config.cjs,vitest.config.ts,.oxlintrc.json,.oxfmtrc.json}` (derive from `apps/web` equivalents)
- Create: `apps/web-astro/worker/**` (copy `apps/web/worker/**`), replace `handlers/next` with `handlers/astro/index.ts`
- Create: `apps/web-astro/src/lib/request-context/index.ts` (+ test)
- Create: `apps/web-astro/src/lib/cms/client/index.ts` (port; reads request context)
- Create: `apps/web-astro/src/pages/healthz-astro.astro` (temporary, deleted in Task 4)
- Modify: `pnpm-workspace.yaml` if needed, root `package.json` (no script changes yet)

**Interfaces:**
- Produces:
  - `type RequestContext = { env: Cloudflare.Env; ctx: ExecutionContext | undefined; request: Request }`
  - `runWithRequestContext = <T>(context: RequestContext, fn: () => T): T`
  - `getRequestContext = (): RequestContext` — throws `Error('request context is not available outside a request')` when unset
  - `getCMSClient = (): CMSClient` (sync now; same `hc<CMSAppType>` construction as `apps/web/src/lib/cms/client`)
  - `createAstroHandler = (astroFetch: MountedFetch) => (c: Context<AstroEnv>) => Promise<Response>` in `worker/handlers/astro` — same contract as `createNextHandler` (wrap `CMS` via `withTrackedCMS`, run inside `runWithRequestContext`, `settle` cacheable pages, set `cmsDegraded`)
- Consumes: `withTrackedCMS`, `createCMSHealth`, `resolveCacheControl` (existing worker modules)

- [ ] **Step 1 (spike — stop and report if any check fails, the design depends on it):** Read the **installed** `node_modules/@astrojs/cloudflare/dist/{utils/handler,hono,entrypoints/server}.js` source (not release notes) and verify, under both `astro dev` and `astro build` + `wrangler dev`:
  1. A custom `main` (`worker/worker.ts`) can mount Astro's fetch handler inside the Hono app, and static assets (`/_astro/*`, `public/*`) still resolve.
  2. Page code reaches the **wrapped** `CMS` binding (ALS from `runWithRequestContext`, or whatever the adapter offers per request) — no path where Astro page code sees the raw binding.
  3. `@astrojs/react` SSR of a React component **without** a `client:*` directive renders with no JS shipped (RSC-equivalent), and whether an **async** React component (`const X = async () => …`) renders under `@astrojs/react` (record yes/no; if no, Tasks 4–7 must hoist those CMS reads into `.astro` frontmatter and pass serializable props).
  4. `transition:persist` on a `client:load` island keeps the same React root across a ClientRouter navigation.
  Record the findings in `reports/2026-11-13-web-astro-spike.md` and the commit body.
- Worker path policy (in this task, not Task 11): `/_astro/*` → keep/immutable (replacing the `/_next/static` rule; `/_next/image` stays), `/_actions/*` → uncacheable, plus any other Astro-internal route found in step 1. Update `worker/middleware/cache-control/plugins/next-internal` and `path-policy` accordingly with tests.
- `wrangler.toml` migrations: keep tags v1 (DOQueueHandler created), v2 (CursorRoom), v3 (DOQueueHandler deleted) unchanged; only `CursorRoom` is exported. No new migration tag.
- [ ] **Step 2: Failing tests**
  - `src/lib/request-context/request-context.test.ts`: `getRequestContext()` inside `runWithRequestContext(ctx, …)` returns `ctx`; outside throws the exact message; nested async (`await Promise.resolve()`) still sees `ctx`.
  - `worker/handlers/astro/astro.test.ts`: port `worker/handlers/next/next.test.ts` cases to `createAstroHandler`, plus `marks degraded when CMS fails inside Astro render` (fake astroFetch that calls `getCMSClient()` via request context → binding returns 500 → `c.get('cmsDegraded') === true`).
- [ ] **Step 3:** Run `pnpm --filter web-astro test` → FAIL (modules missing).
- [ ] **Step 4:** Implement request-context, cms client, `handlers/astro`, `worker/worker.ts` mounting the Astro handler, keep `CursorRoom` export and the existing `[[migrations]]` history byte-for-byte.
- [ ] **Step 5:** Run tests → PASS. `pnpm --filter web-astro build` succeeds; `wrangler dev` (local cms running) serves `/healthz-astro` with a CMS read rendered, and the response carries the `cms` page Cache-Control.
- [ ] **Step 6:** lint + typecheck green, commit `feat(web-astro): scaffold Astro app behind the Hono worker`.

### Task 2: Port shared source (components / lib / utils / themes / hooks) off Next APIs

**Files:**
- Copy: `apps/web/src/{components,lib,utils,themes,hooks,assets,adapters,shims,scripts}` → `apps/web-astro/src/` (with their tests)
- Create: `src/lib/navigation/index.ts` (+ test)
- Modify: `src/components/image/index.tsx` (no `next/image`)
- Modify: `src/themes/fonts.ts` (no `next/font`), keep `src/themes/font-vars.test.ts` passing (update it to read the new source)
- Modify: every file importing `next/*`, `@opennextjs/cloudflare`, `server-only`
- Create: `src/__mocks__/*` replacements; delete `src/__mocks__/next/*`

**Interfaces:**
- Produces:
  - `usePathname = (): string` — current `location.pathname`, updates on `astro:page-load`; SSR value comes from a `PathnameProvider` (`<PathnameProvider pathname={Astro.url.pathname}>`) so the first render matches.
  - `useRouter = (): { push: (href: string) => void; replace: (href: string) => void; refresh: () => void }` — `navigate(href)`, `navigate(href, { history: 'replace' })`, `navigate(location.href, { history: 'replace' })`.
  - `Image` keeps its props shape minus Next-only props; renders `<img>` with `srcset` built from the existing worker images path (`/_next/image?url=&w=&q=`; keep the path — it is already in cache policy and `formatBlurURL`). Widths = `[640, 750, 828, 1080, 1200, 1920, 2048]`, quality default 75.
  - Fonts: self-host via `@fontsource` (M PLUS 1 400/500/700 latin, Zen Kaku Gothic New 500 with unicode-range subsets, no preload) exposing the same CSS variables `--font-mplus1`, `--font-mplus1-en`, `TITLE_JP_VAR`.
  - `next/dynamic` → `React.lazy` + `Suspense`.
  - Server-only modules: replace `server-only` import with nothing (Astro never bundles `.astro` frontmatter imports to the client); ensure linkedom stays out of the client bundle via vite `resolve.alias` for the browser build only.
- [ ] **Step 1: Failing tests:** `src/lib/navigation/navigation.test.tsx` (`usePathname` returns provider value on first render and the new path after dispatching `astro:page-load` with a changed `history.pushState`; `useRouter().push('/blog')` calls mocked `navigate` with `'/blog'`), `src/components/image/image.test.tsx` (`srcset` contains `/_next/image?url=…&w=640&q=75 640w` … `2048w`; blur placeholder style present until `load`).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; replace imports throughout; `grep -rE "from 'next|@opennextjs|server-only'" src` returns nothing.
- [ ] **Step 4:** Run full test suite → all ported tests PASS (vitest config: drop `next/*` aliases, keep `@lib/cms/client` mock alias).
- [ ] **Step 5:** lint + typecheck, commit `refactor(web-astro): port shared modules off Next APIs`.

### Task 2.5: React context across islands

Each Astro island is its own React root, so context providers that wrap the whole tree in `apps/web/src/app/(site)/layout.tsx` (ThemeProvider, BootStatusProvider, motion provider, RouterProvider) and the contexts in `src/components/{game-of-life/provider,cursor-presence/*-context,boot-status,canvas-resize}`, `src/hooks/use-prefers-reduced-motion` do **not** reach other islands.

- [ ] Enumerate each context, its provider location and its consumers (write the table into `reports/2026-11-13-web-astro-spike.md`).
- [ ] Per context decide: (a) consumers live inside one island → keep the provider inside that island; (b) consumers span islands → replace with a module-level store (`useSyncExternalStore`) so every root shares state; (c) RouterProvider → a tiny `withRouter` wrapper applied in every island that renders a `Link`.
- [ ] Tests: for each (b) store, a test mounting two separate React roots and asserting they observe the same update.
- [ ] lint/typecheck, commit `refactor(web-astro): share cross-island state via module stores`.

### Task 3: Site layout, SEO, persisted shell, ClientRouter, error pages

**Files:**
- Create: `src/layouts/site-layout.astro`, `src/components/seo/{seo.astro,build-metadata.ts,build-metadata.test.ts}`
- Create: `src/components/app-providers/index.tsx` (RouterProvider + ThemeProvider + BootStatusProvider + PathnameProvider)
- Create: `src/pages/404.astro`, `src/pages/500.astro`
- Test: `src/layouts/site-layout.test.ts` (Astro Container API), `e2e`-style browser test `src/layouts/persist.browser.test.ts`

**Interfaces:**
- Produces:
  - `buildMetadata = (input: MetadataInput, origin: string) => ResolvedMetadata` — port of every `generateMetadata` / `metadata` export (title template `%s — napochaan`, default description `napochaan の個人サイト。`, `robots noindex,nofollow` unless `isProductionHost(origin)`, OG/Twitter fields, canonical).
  - `site-layout.astro` props: `{ metadata: MetadataInput; bodyClass?: string }`; renders `<html lang="ja" class="… wf-loading boot">`, typekit + motion boot inline scripts with `is:inline` **and `data-astro-rerun` absent** so they run once, `<ClientRouter />`. Persist goes on the **sibling islands** only (ambient backdrop, cursor presence, loading/boot overlay, site nav/header if stateful) — never on an element wrapping `<slot />`, otherwise `main` would never swap. The page content `<main>` is swapped on every navigation.
  - Theme color `oklch(0.490 0.287 266)`, viewport `width=device-width, initial-scale=1, viewport-fit=cover`.
- [ ] **Step 1: Failing tests:** `build-metadata.test.ts` (non-prod origin → robots noindex; title template; canonical); `site-layout.test.ts` (rendered HTML has one `<h1>`-free shell, the two inline scripts once, `wf-loading boot` class); unit tests for the pieces (e.g. boot overlay script is a no-op when `boot` class already removed). Verify `persists shell islands across navigation` and `does not reuse cached documents on back navigation` manually with chrome-devtools MCP against `wrangler dev` (same backdrop canvas node & single WebSocket in the network panel across `/` → `/blog` → back; each navigation issues a document fetch); record the result in the spike report.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Scroll on transition jumps to top (no smooth scroll) — keep current behavior. Disable View Transition animation under `prefers-reduced-motion`. 404/500 reuse `error-screen` component; 404 status preserved.
- [ ] **Step 4:** Run → PASS; lint/typecheck; commit `feat(web-astro): site layout with persisted shell and ClientRouter`.

### Task 4: Home, about, colophon

**Files:** `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/about.md.ts`, `src/pages/colophon.astro`; move `apps/web/src/app/(site)/{(home),about,colophon,_components,_lib}` sections/components into `src/features/{home,about,colophon,shared}/`; delete `healthz-astro.astro`.

**Interfaces:** Consumes `site-layout.astro`, `buildMetadata`, CMS fetchers from `@lib/cms/*`.

- [ ] **Step 1:** Port each page's tests (`page.test.tsx` etc.) to render the feature components; add Container-API tests asserting each page's `<title>` and that `/about.md` returns `text/markdown; charset=utf-8` with the same body `buildAboutMarkdown` produces.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (colophon demos keep `e.preventDefault` no-action links). **Step 4:** Run → PASS.
- [ ] **Step 5:** lint/typecheck, commit `feat(web-astro): home, about, colophon pages`.

### Task 5: Blog (index, pagination, detail, .md, RSS, OG, error)

**Files:** `src/pages/blog/index.astro`, `src/pages/blog/page/[num].astro`, `src/pages/blog/[slug].astro`, `src/pages/blog/[slug].md.ts`, `src/pages/blog.md.ts`, `src/pages/blog/rss.xml.ts`, `src/pages/blog/[slug]/opengraph-image.ts`; features in `src/features/blog/`.

**Interfaces:**
- Produces `renderOgImage = (card: OgCardData, assets: OgAssets) => Promise<Response>` in `src/utils/og/render-og-image.ts` (satori + resvg-wasm or `workers-og` — pick after verifying it runs in workerd; 1200×630 PNG, same `OgCard` JSX). Used by Tasks 6.
- Produces `notFoundResponse` pattern: pages call `return Astro.rewrite('/404')` (status 404) — verify it yields 404 status; otherwise `new Response(null, { status: 404 })` + render. Used by Tasks 5–7.
- `parsePageParam` reused; `/blog/page/1` → `Astro.redirect('/blog', 308)` (matches `permanentRedirect`).
- [ ] **Step 1: Failing tests:** `/blog/a.b.md` resolves slug `a.b`; unknown slug → 404 for both `/blog/x` and `/blog/x.md`; `/blog/page/1` → 308 `/blog`; `/blog/page/abc` → 404; RSS content-type `application/rss+xml; charset=utf-8`; OG returns `image/png` 1200×630 (check PNG IHDR bytes).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement; OG image og-image meta tag URL unchanged (`/blog/[slug]/opengraph-image` path — check current emitted URL in Next output and match it exactly, including any hash suffix behavior; if Next appended a query/hash, reproduce it). **Step 4:** PASS.
- [ ] **Step 5:** lint/typecheck, commit `feat(web-astro): blog routes`.

### Task 6: News + works (same shape as blog)

**Files:** `src/pages/news/**`, `src/pages/news.md.ts`, `src/pages/works/**`, `src/pages/works.md.ts`; features in `src/features/{news,works}/`.

- [ ] **Step 1:** Port tests + the Task 5 test set for each collection (dotted `.md` slug, 404s, `page/1` redirect, RSS, OG). External news items keep their behavior (`is-external-news`).
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** lint/typecheck, commit `feat(web-astro): news and works routes`.

### Task 7: Gallery + log

**Files:** `src/pages/gallery.astro`, `src/pages/gallery/rss.xml.ts`, `src/pages/log.astro`, `src/pages/log.md.ts`, `src/pages/log/rss.xml.ts`; features in `src/features/{gallery,log}/`.

- [ ] **Step 1:** Port tests; assert `/log` and `/log.md` get the `timeSensitive` policy through the worker (`public, max-age=0, s-maxage=3600`).
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** lint/typecheck, commit `feat(web-astro): gallery and log routes`.

### Task 8: Contact (Astro Action + Turnstile)

**Files:** `src/pages/contact.astro`, `src/actions/index.ts`, `src/features/contact/**`.

**Interfaces:** `server.submitContact` Astro Action, input = existing `src/lib/contact/schema.ts` zod schema; returns the same state shape as `apps/web/src/app/(site)/contact/_actions/state.ts`. Form island calls it via `actions.submitContact`. `TURNSTILE_SITE_KEY` read from request context env.

- [ ] **Step 1: Failing tests:** action rejects invalid input with field errors; fails when Turnstile verify fails; success calls `sendEmail` + `notifyDiscord` mocks once; `/contact` GET is cacheable (`cms` policy) and the action POST is `no-store`/not cached.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** lint/typecheck, commit `feat(web-astro): contact form via Astro Actions`.

### Task 9: Preview + draft mode + misc endpoints

**Files:** `src/lib/draft-mode/index.ts` (+test); `src/pages/next/preview.ts`, `src/pages/next/exit-preview.ts`; `src/pages/{blog,news,works}/preview/[id].astro`, `src/pages/{gallery,log}/preview.astro`; `src/pages/{llms.txt,llms-full.txt,sitemap.xml,robots.txt}.ts`, `src/pages/.well-known/security.txt.ts`, `src/pages/api/media/file/[filename].ts`; static `icon.png`, `apple-icon.png`, `opengraph-image.png`, `twitter-image.png` into `public/` with the same URLs Next emitted (check Next output for hashed names and match the `<link>`/meta URLs).

**Interfaces:**
- `DRAFT_COOKIE_NAME = 'napochaan_draft'`
- `createDraftCookieValue = (secret: string) => Promise<string>` — HMAC-SHA256(secret, `'draft-mode'`) hex via WebCrypto
- `isDraftEnabled = (cookieHeader: string | null, secret: string) => Promise<boolean>` — constant-time compare (`matchesSecret`)
- Cookie attributes: `HttpOnly; Secure; SameSite=None; Partitioned; Path=/` (iframe on cms origin is cross-site). `exit-preview` clears it.
- Keep `/next/preview` and `/next/exit-preview` paths (cms Live Preview points at them) and `isAllowedPreviewPath`.
- [ ] **Step 1: Failing tests:** wrong secret → 403; disallowed path → 400; valid → 307 to path with `Set-Cookie` having the attributes above; preview page without cookie → 404, with cookie → renders draft; all preview responses `no-store` via worker; sitemap/robots/llms/security.txt bodies equal the existing builders' output.
- [ ] **Step 2–4:** FAIL → implement → PASS. Live Preview island uses `@payloadcms/live-preview-react` with `CMS_ORIGIN`.
- [ ] **Step 5:** lint/typecheck, commit `feat(web-astro): preview, draft mode and feed endpoints`.

### Task 10: Parity check against the Next app

**Files:** `apps/web-astro/scripts/parity-check.mjs`, `apps/web-astro/scripts/parity-urls.mjs` (URL list = every route above + 2 real slugs per collection from local CMS + 404 probes).

**Interfaces:** `node scripts/parity-check.mjs <baseA> <baseB>` prints a table and exits 1 on any mismatch of: status, `content-type`, `cache-control`, `<title>`, `<link rel=canonical>`, `og:image`, `meta robots`, and normalized main text for `.md`/RSS/llms bodies.

- [ ] **Step 1:** Run both locally against the same local cms: `apps/web` via `pnpm --filter web preview`, `apps/web-astro` via its preview; run parity check.
- [ ] **Step 2:** Fix every mismatch in the owning feature (with a regression test), rerun until exit 0. Also run Lighthouse (chrome-devtools MCP) on `/`, `/blog/<slug>` for both and record that accessibility ≥ old and performance not worse.
- [ ] **Step 3:** Commit `test(web-astro): parity check against Next app`, including the final parity output in `reports/2026-11-13-web-astro-parity.md`.

### Task 11: Cutover — replace apps/web

**Files:** delete `apps/web`; `git mv apps/web-astro apps/web`; package name `web`; root `package.json`, `.github/workflows/{ci,deploy}.yml`, `.github/actions/*`, `.husky/*`, `CLAUDE.md`, `.claude/rules/{coding-rules,workers-cache,images,payload-cms,cross-module-sync-test}.md`, `.claude/skills/staging-deploy-seed/SKILL.md`, `README.md`, `apps/web/scripts/warm-cache.mjs`.

- [ ] **Step 1:** Rename; scripts: `dev: astro dev`, `build: astro build`, `deploy:*: astro build && wrangler deploy --env <env>`, keep `warm:cache`, `cf:types`, `test`, `lint`, `fmt`, `typecheck`.
- [ ] **Step 2:** Docs/rules: CLAUDE.md setup rules "next.js, opennext, ISR" → "Astro (`@astrojs/cloudflare`) for web, Next.js + Payload for cms"; `next/image` rule → `src/components/image`; workers-cache.md references to OpenNext/`force-dynamic`/`/_next/static` updated to Astro equivalents (`/_astro/*` immutable); cross-module table row for `TITLE_JP_VAR` updated. Worker names and routes in wrangler unchanged so cms `WEB` binding still resolves.
- [ ] **Step 3:** From repo root: `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` → all green. `grep -rn "opennext\|next/" apps/web` → no hits outside comments explaining history.
- [ ] **Step 4:** Commit `refactor(web)!: replace Next.js web app with Astro` as a single separable commit (so it can be reverted alone). Do not deploy to staging from the branch; merging to main auto-deploys staging and production stays manual — say so in the PR.

### Task 12: PR

- [ ] Push `feat/web-astro`, open PR to `main` (body: summary, decisions, parity report link, deploy notes: merge auto-deploys staging; production is manual dispatch; verify on stg before dispatching). End body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- [ ] Watch CI; fix failures until green.
