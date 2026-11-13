# web-astro spike (Task 1) — 2026-11-13

Versions installed: astro 7.4.11, @astrojs/cloudflare 14.4.7, @astrojs/react 7.1.8,
@cloudflare/vite-plugin 1.69.1, wrangler 4.161.0 (the adapter's vite plugin needs `wrangler@^4.160`).

Verified under **`astro dev`** (port 4321) and **`astro build` + `wrangler dev -c dist/server/wrangler.json`**
(port 8788). All four checks pass. Verdict: **design holds, no BLOCKER.**

## Source read (installed adapter, not release notes)

- `@astrojs/cloudflare/dist/utils/handler.js` exports `handle(request, env, context)` and is exposed as
  `@astrojs/cloudflare/handler`. It imports `virtual:astro-cloudflare:config`, so only Astro's Vite build can bundle it
  (the workers vitest pool keeps `worker/worker.test-entry.ts`).
- `dist/wrangler.js` `cloudflareConfigCustomizer`: `main: config.main ?? "@astrojs/cloudflare/entrypoints/server"` —
  a user `main` (`./worker/worker.ts`) is respected.
- `handle()` uses `env` only for ASSETS / SESSION / error-page fetch. `createLocals(ctx)` gives page code
  `Astro.locals.cfContext`; `Astro.locals.runtime.env` throws and points users to
  `import { env } from 'cloudflare:workers'` — **the raw global env**. The env passed to `handle()` never reaches
  page code, so the only wrapped path is our ALS request context.
- `handle()` calls `context.waitUntil.bind(context)` → a real ExecutionContext is required at runtime
  (only the fake fetch in tests tolerates `undefined`).
- `dist/utils/response.js` `applyCloudflareResponseHeaders` adds `Cloudflare-CDN-Cache-Control: no-store` **only when
  `cache.provider` is the Cloudflare provider** (we don't configure one). Verified: no `Cloudflare-CDN-Cache-Control`
  and no `Cache-Control` on an SSR 200, so `isShareable` / page policy work unchanged.
- The adapter auto-enables a `SESSION` KV binding unless `session: false` (index.js `session !== false`) →
  `astro.config.ts` sets `session: false`; generated `dist/server/wrangler.json` has `kv_namespaces: []`.
- Astro-internal routes found by grepping `astro/dist`: `/_actions/[...path]` (actions/consts.js),
  `/_server-islands/[name]` (core/server-islands/endpoint.js), `/_image` (image endpoint),
  `/_astro/status` (dev-only vite plugin). Client output lives at `/_astro/*`.

## Check 1 — custom `main` mounts Astro inside Hono; static assets resolve — PASS

`worker/worker.ts` = `createWebEntrypoint(handle as MountedFetch)`; the Hono middlewares ran on Astro pages in both
modes (cache-control headers stamped by our middleware). Build output:

- `dist/server/wrangler.json`: `name napochaan-website`, `main entry.mjs`, `assets.directory ../client`,
  migrations v1/v2/v3 byte-identical, `CURSOR_ROOM` DO, `CMS` service, `IMAGES` binding, `nodejs_compat`.
- `public/_headers` is copied to `dist/client/_headers`.
- `GET /_astro/ClientRouter…js` → 200 `Cache-Control: public, max-age=31536000, immutable` (from `_headers`).
- `GET /og-default.png` (public/*) → 200 `image/png` in both dev and build.
- Note: wrangler warns `[[rules]]` is ignored under Vite → removed from `wrangler.toml` (OG fonts must be imported via
  Vite in the OG task).

## Check 2 — page code reaches the wrapped CMS binding — PASS (with a caveat)

`handlers/astro` runs `astroFetch` **and** `settle` inside `runWithRequestContext({ env: withTrackedCMS(...), ctx, request })`.
Probe page renders (a) a child `.astro` that awaits 30 ms then reads `getRequestContext()` and compares
`env.CMS !== rawEnv.CMS` (raw = `cloudflare:workers`), (b) a sync React SSR component reading the context,
(c) an async React component that awaits 20 ms then calls `getCMSClient()`.

```
/spike/als        (cacheable → settled)   astro-nested:…/spike/als:wrapped=true  react-sync:…  react-async:200:…   Cache-Control: public, max-age=0, s-maxage=31536000
/next/spike-als   (uncacheable → NOT settled, body pulled after run() returns)  same output, wrapped=true, Cache-Control: no-store
```

Context survives awaits in nested components and through streaming even on the unsettled route.

End-to-end degraded path (CMS stub switched to 500):

```
/healthz-astro  cms-status 500 → Cache-Control: no-store
/spike/als      react-async:500 (CMS read inside a streamed React component) → Cache-Control: no-store
stub back to ok: /healthz-astro → 200 stub-naporitan, Cache-Control: public, max-age=0, s-maxage=31536000
```

**Caveat (structural):** `import { env } from 'cloudflare:workers'` gives any page the raw `CMS` binding, untracked.
It cannot be closed by the adapter; it must be a rule ("CMS only via `getCMSClient()` / `getRequestContext()`"),
ideally enforced by lint (e.g. oxlint `no-restricted-imports` for `cloudflare:workers` under `src/`) in a later task.

## Check 3 — React without `client:*` ships no JS; async React components — PASS / YES

- `<ContextProbe />` and `<AsyncProbe />` without directives: HTML contains no `<astro-island>` and no `<script>`
  in the build output (dev only adds the Vite client / dev toolbar).
- **Async React component (`const X = async () => …`) renders under `@astrojs/react`: YES** — output
  `react-async:200:…`, including a CMS read through the request context. Tasks 4–7 do not have to hoist reads into
  frontmatter for that reason (they may still choose to).

## Check 4 — `transition:persist` keeps the React root across ClientRouter navigation — PASS

Pages A/B both render `<Counter client:load transition:persist="counter" />` with `<ClientRouter />`. Playwright:
increment twice on A, click link to B.

```
astro dev:  {"mount1":"fzdys6watbq","mount2":"fzdys6watbq","count1":"2","count2":"2","marker":"same-document"}
build:      {"mount1":"pns48ltuwhi","mount2":"pns48ltuwhi","count1":"2","count2":"2","marker":"same-document"}
```

Same mount id (useState initializer not re-run) and state kept; `window.__marker` survives → soft navigation.

## Worker path policy derived from this spike

| Path | Policy |
| --- | --- |
| `/_astro/*` | keep (immutable via `public/_headers`; replaces the `/_next/static` rule) |
| `/_next/image`, `/_image` | keep (own policy) |
| `/_actions/*`, `/_server-islands/*` | uncacheable (`no-store`, decoded match too) |

## Local CMS for the end-to-end

The real cms worker needs `dev:worker` (OpenNext build + D1 data); not attempted. A throwaway stub worker named
`napochaan-cms` exposing a `CMS` WorkerEntrypoint (`/profile` JSON, toggle to 500) was used instead.
Under `astro dev` the cross-process dev registry did **not** connect (`Worker "napochaan-cms" not found` → 503) even
though the stub was registered — likely a miniflare version skew between wrangler 4.161 (miniflare 5.20261110.2-beta)
and the vite plugin (5.20261110.0-beta). It works with `wrangler dev -c dist/server/wrangler.json -c <stub>/wrangler.toml`
(same process). The 503 under `astro dev` still exercised the degraded path (no-store). Revisit with the real cms.

## Throwaway spike sources (not committed)

### `src/components/spike/async-probe.tsx`

```tsx
import { getCMSClient } from '@lib/cms/client';
import { getRequestContext } from '@lib/request-context';

// Async React component (RSC style) — does @astrojs/react render it?
export const AsyncProbe = async ({ label }: { label: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 20));
  const res = await getCMSClient().profile.$get();
  return (
    <p data-probe={label}>
      react-async:{res.status}:{getRequestContext().request.url}
    </p>
  );
};
```

### `src/components/spike/context-probe.tsx`

```tsx
import { getRequestContext } from '@lib/request-context';

// Sync React SSR component (no client directive): reads the request context during render.
export const ContextProbe = ({ label }: { label: string }) => {
  const url = getRequestContext().request.url;
  return <p data-probe={label}>react-sync:{url}</p>;
};
```

### `src/components/spike/counter.tsx`

```tsx
import { useState } from 'react';

export const Counter = () => {
  const [mountID] = useState(() => Math.random().toString(36).slice(2));
  const [count, setCount] = useState(0);
  return (
    <div>
      <span id="mount">{mountID}</span>
      <span id="count">{count}</span>
      <button id="inc" type="button" onClick={() => setCount((n) => n + 1)}>
        inc
      </button>
    </div>
  );
};
```

### `src/components/spike/nested.astro`

```astro
---
import { env as rawEnv } from 'cloudflare:workers';
import { getRequestContext } from '@lib/request-context';
await new Promise((resolve) => setTimeout(resolve, 30));
const { env, request } = getRequestContext();
---
<p data-probe="astro-nested">astro-nested:{request.url}:wrapped={String(env.CMS !== rawEnv.CMS)}</p>
```

### `src/pages/spike/als.astro`

```astro
---
import Nested from '../../components/spike/nested.astro';
import { ContextProbe } from '../../components/spike/context-probe';
import { AsyncProbe } from '../../components/spike/async-probe';
---
<html><body>
<Nested />
<ContextProbe label="react-sync" />
<AsyncProbe label="react-async" />
</body></html>
```

### `src/pages/spike/cms-debug.astro`

```astro
---
import { getRequestContext } from '@lib/request-context';
const res = await getRequestContext().env.CMS?.fetch('https://cms.internal/profile');
const text = await res?.text();
---
<pre>{res?.status} {text}</pre>
```

### `src/pages/spike/persist-a.astro`

```astro
---
import { ClientRouter } from 'astro:transitions';
import { Counter } from '../../components/spike/counter';
---
<html><head><ClientRouter /></head><body>
<h1 id="page">A</h1>
<Counter client:load transition:persist="counter" />
<a id="go" href="/spike/persist-b">to B</a>
</body></html>
```

### `src/pages/spike/persist-b.astro`

```astro
---
import { ClientRouter } from 'astro:transitions';
import { Counter } from '../../components/spike/counter';
---
<html><head><ClientRouter /></head><body>
<h1 id="page">B</h1>
<Counter client:load transition:persist="counter" />
<a id="go" href="/spike/persist-a">to A</a>
</body></html>
```

### `src/pages/next/spike-als.astro`

```astro
---
import Nested from '../../components/spike/nested.astro';
import { ContextProbe } from '../../components/spike/context-probe';
import { AsyncProbe } from '../../components/spike/async-probe';
---
<html><body>
<Nested />
<ContextProbe label="react-sync" />
<AsyncProbe label="react-async" />
</body></html>
```

### `src/pages/next/spike-toggle.astro`

```astro
---
import { env } from 'cloudflare:workers';
const mode = Astro.url.searchParams.get('mode') ?? 'ok';
const res = await env.CMS?.fetch(`https://cms.internal/__mode/${mode}`);
---
<p>{await res?.text()}</p>
```


# Task 2.5 — React context across islands

Each Astro island is its own React root (SSR and client), so a provider in `.astro` or in another island
never reaches it. Every context the Next tree relied on, and its fate:

| Context | Provider (Next) | Consumers | Spans islands? | Decision |
| --- | --- | --- | --- | --- |
| `LifeEngineContext` (`game-of-life/provider`) | `SiteShell` → `LifeEngineProvider` | `GameOfLife` (backdrop island), `SysBar` gen/alive (header island) | yes | (b) module store: the context default is now the exported `sharedLifeEngine`; the site mounts no provider. Colophon demos keep `LifeEngineProvider` for an isolated engine. |
| `BootStatusContext` (`boot-status`) | layout → `BootStatusProvider` | `ScrambleText`, `EchoText`, `TypewriterText`, `BootQuestion` (many islands) | yes | (b) module store: the existing module-level `defaultStore` (observes `<html>`); islands mount no provider. |
| `MotionContext` (`use-prefers-reduced-motion`) | `SiteShell` → `MotionProvider` | `usePrefersReducedMotion` (band, life, scramble, echo, typewriter, boot question, anchored heading), `useMotion` toggle (SysBar) | yes | Value already derives from module stores (persistent-store + matchMedia). Uncontrolled `MotionProvider` is mounted in every island via `AppProviders`, so the SysBar toggle (real, not the no-provider no-op) reaches every root. |
| `PresenceContext` (`cursor-presence`) | `CursorPresence` | `SysBar` (`watching N`, cursors toggle) | yes | (b) new `cursor-presence/presence-store.ts`: count published by the cursor island, `enabled` in persistent-store. `presence-context.ts` removed. |
| `SurfaceRefContext` (`cursor-presence`) | `CursorPresence` | `CursorSurface` | stage wraps `<slot />`, so it is Astro markup | (a) kept for one-root use (colophon); on the site `resolveSurface` falls back to `[data-cursor-surface]` and re-resolves on each pathname change (body is swapped). |
| `PlacementContext` (`cursor-presence`) | `CursorPresence` | `CursorLayer` | no | (a) unchanged. |
| `ResizerContext` (`canvas-resize`) | none (default) | `GameOfLife`, `CursorLayer` | no | (a) unchanged. |
| `PathnameContext` (`lib/navigation`) | — (Task 2) | `SysBar`, `FooterNav`, `CursorPresence` | per island | (c) `AppProviders` / `withAppProviders` feed `Astro.url.pathname` into every island. |
| react-aria `RouterProvider` | `ThemeProvider` → `ClientRouter` | every `Link` / `MenuItem href` | per island | (c) `AppProviders` wraps `RouterProvider navigate={useRouter().push}` (Astro `navigate`). |
| `ThemeProvider` | layout `<body>` | — (adds `s.root` class + global.css) | — | not an island concern: the layout puts the class on `<body>` and imports global.css. |

Server side: these module singletons are shared by every request in the isolate, so they are only mutated
in client effects; their server snapshots are constants (engine placeholder, boot `{ready:false}`, count 0).

Tests (each mounts two separate React roots via two `render()` calls): `game-of-life/provider/cross-island`,
`boot-status/cross-island`, `cursor-presence/presence-store`, `motion-provider/cross-island`, plus
`app-providers` and `cursor-presence/resolve-surface`.

# Task 3 — persisted shell verification (manual, chrome-devtools MCP)

Setup: `astro build` + `wrangler dev -c dist/server/wrangler.json --port 8788` (no CMS needed: the layout reads
none), temporary pages `src/pages/tmp-persist/{a,b,boom}.astro` using `site-layout.astro` (deleted before commit).
Navigation was driven by clicking in-page links and `history.back()` inside one document (never `navigate_page`
with a URL, which would be a full load). An init script wrapped `WebSocket` to count constructions and set
`window.__marker` to detect full reloads.

| Step | path | h1 | same document | same backdrop `<canvas>` | WebSockets (readyState) | `html.boot` | fetches |
| --- | --- | --- | --- | --- | --- | --- | --- |
| initial load | /tmp-persist/a | page a | — | — | [1] | false | (document) |
| click plain `<a>` | /tmp-persist/b | page b | yes | yes | [1] | false | `/tmp-persist/b` ×1 |
| click SysBar react-aria `Link` "works" (404 route) | /works | 404 | yes | yes | [1] | false | `/works` ×1 (no double navigation) |
| `history.back()` | /tmp-persist/b | page b | yes | yes | [1] | false | `/tmp-persist/b` ×1, transferSize 8063 (network, not reused) |

- Network panel: exactly one `document` request (the initial load); every navigation is one `fetch` of the page.
  Back navigation re-fetches (pages send `max-age=0`), so no cached document is reused.
- Single WebSocket (`/api/cursors`, OPEN) across all navigations; SysBar `watching 1`.
- Boot overlay not replayed: after each swap `<html>` keeps `font-variables wf-… wf-active` (no `boot`,
  no `wf-loading`) and the inline style (`--motion-play`, `--scroll-range`, …); the overlay root stays
  `opacity 0 / visibility hidden`. This needed `@utils/root-state-carry` — Astro's `swapRootAttributes` copies the
  incoming SSR `<html>` attributes (`wf-loading boot`) and the Typekit / motion scripts do not run again.
- Inline head scripts: the carry script's install counter stayed at 1 across navigations.
- Typekit fonts are registered through the FontFace API (`document.fonts`: digibop, config-mono-vf), not head
  nodes, so `swapHeadElements` does not drop them; the carry script's head-node copy is a no-op safety net.
- SysBar active nav state follows the page (`works` active on /works).
- `prefers-reduced-motion`: the chrome-devtools `emulate` tool failed (CDP `Network.emulateNetworkConditionsByRule`
  error), so this was checked with Playwright `emulateMedia({ reducedMotion })` against the same server:
  no-preference → `::view-transition-*` root fade animations run; reduce → none (layout CSS rule).
- Status codes (curl): unknown path → **404** (404.astro, no `Cache-Control: public`); a page throwing in
  frontmatter → **500** (500.astro, no public cache header); normal page → 200 `public, max-age=0, s-maxage=31536000`.
- Hydration: the first prod run showed React #418 in the SysBar island (SSR `alive 0`, client `alive 651`):
  the backdrop island seeds the shared life engine before the SysBar island hydrates. Fixed by giving
  `useLifeState` a constant placeholder server snapshot (test added). Honest timeline: two more loads after the
  first rebuild still logged #418 and showed the sys-bar header regenerated; that wrangler start had not been
  confirmed to bind 8788, so a stale bundle is the likely cause (not proven). On a fresh build with wrangler
  confirmed listening on 8788 (workerd pid in `ss -ltnp`), 10 fresh Playwright loads: 0 console errors,
  0 island subtrees regenerated (MutationObserver on removed element nodes inside `astro-island`).

## Second session (after review)

- Inline scripts run once: the unguarded Typekit loader inserted `use.typekit.net/vmz7pfu.js` exactly once
  (MutationObserver count 1, one resource entry) across three soft navigations (a→b, b→a, back). (The carry
  script's own counter is not evidence: it returns early on its window flag.)
- Scroll on navigation (pages ~3000px tall):
  - push navigation: `scrollY` is 0 at `astro:after-swap` and still 0 after 1.2s, both when clicked at rest and
    when clicked 200ms after scrolling to an off-grid offset (TypographyBand grid-snap tween in flight);
  - `history.back()` restores the previous offset (2111 → 2111);
  - first run exposed a bug: the persisted TypographyBand's in-flight snap tween dragged the new page back to the
    old offset (2111) after the router's jump to top. Fixed: the band cancels the snap on `astro:before-swap`
    (test `typography-band/snap-swap.test.tsx`).
  - note: `html { scroll-behavior: smooth }` (global-css) makes script-driven `scrollIntoView`/`scrollTo`
    without `behavior` smooth; the router itself uses `behavior: 'instant'`.
- Screenshot: overlay lifted, TypographyBand frame, Game-of-Life grid, SysBar (`gen`, `alive`, `watching 1`,
  toggles) render as on the Next site.
- CursorPresence now re-resolves the stage on every `astro:after-swap` (not only on pathname change), so
  same-path swaps (refresh / query-only navigation) also re-attach (test `cursor-presence/surface-swap.test.tsx`).

## Fix round 1 (review against live Next head)

- Navigation no longer cross-fades at all: `<html transition:animate="none">` (Playwright: 0 `::view-transition-*`
  animations with and without reduced motion; previously 5 without).
- Error responses: a body that throws after streaming started now yields the 500.astro page with status 500 and
  `Cache-Control: no-store` (was a plain-text Hono 500 with no Cache-Control); 404 now sends `no-store` (was none).
