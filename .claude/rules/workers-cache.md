---
description: How apps/web pages are cached (SSR + Workers Cache, purge on CMS publish) — which Cache-Control each page class gets, how purge reaches the cache, and what a cacheable page must never read
paths:
  - "apps/web/src/pages/**/*.{astro,ts}"
  - "apps/web/src/utils/cache-control/**/*.ts"
  - "apps/web/worker/**/*.ts"
  - "apps/web/astro.config.ts"
  - "apps/web/public/_headers"
  - "apps/web/wrangler.toml"
---

# Workers Cache (apps/web)

apps/web is Astro (`@astrojs/cloudflare`) with **no ISR and no prerender**: `output: 'server'`
in `astro.config.ts` makes every page and endpoint SSR, and the rendered response is cached by
**Workers Cache** in front of the Worker, keyed by URL + Worker version. There is no incremental
cache, tag cache, or revalidation queue.

- A HIT never runs the Worker. A MISS runs SSR, and the response is stored per its `Cache-Control`.
- A **deploy** starts with an empty cache (Worker version is part of the key).
- A **CMS publish** empties it: cms Payload hook → `env.WEB.purge()` (JS RPC over the `WEB`
  Service Binding, no `entrypoint`) → web's **default** entrypoint
  (`apps/web/worker/entrypoint`) → `ctx.cache.purge({ purgeEverything: true })`.

## Page class → policy

`PAGE_CACHE_POLICIES` (`apps/web/src/utils/cache-control`) is applied by path in the worker's
cache-control middleware (`apps/web/worker/middleware/cache-control`, first-match plugins):

| Class | Paths | Policy | Freshness |
| --- | --- | --- | --- |
| `uncacheable` (deny) | `/{blog,news,works,gallery,log}/preview*`, `/next/*`, `/admin*`, any other `/api/*` (api plugin, after media), and **any request whose CMS read failed** | `no-store` — always, any status / method / cookie | never stored |
| `timeSensitive` (page) | `/`, `/log`, `/log.md`, `/log/rss.xml`, `/.well-known/security.txt` | `public, max-age=0, s-maxage=3600` | 1h at the edge + purge |
| `cms` (page, catch-all) | every other page, feed, `.md`, llms, sitemap, robots, OG image, `/contact` | `public, max-age=0, s-maxage=31536000` | purge / deploy only |
| keep | `/_astro/*` (content-hashed, `immutable` via `public/_headers`), `/_next/image` (the worker image transformer sets its own policy), `/_image` | upstream | — |
| fill | `/api/media/file/*` media | only when upstream sent none | — |

"page" policies are stamped only on a cookie-less `GET`/`HEAD` `200`. Everything else is forced to
`no-store` by the Astro handler (`worker/handlers/astro`): a 404 / 500 / redirect (any status `>= 300`
except `304`), and any non-`GET`/`HEAD` response (a form-mode Astro Action `POST` renders that visitor's
result as a page). A `Set-Cookie` response is never given a shareable policy.
Path tests that guard privacy or freshness (deny / private / time-sensitive) also match the
percent-decoded pathname, so `/%61dmin` is treated like `/admin`.

Static assets never reach the Worker: Workers Static Assets serves `dist/client` with the
`public/_headers` rules (`/_astro/*` → `public, max-age=31536000, immutable`, ETag dropped so the
edge can compress).

## CMS failures are never cached

The worker mounts the Astro adapter's handler through `worker/handlers/astro`, which wraps this
request's `CMS` binding (`worker/lib/cms-health`) and runs the render inside an AsyncLocalStorage
request context (`src/lib/request-context`). A `fetch` that throws or returns `>= 500` marks the request
degraded (404 / 403 are normal outcomes). Cacheable pages are read to the end before the
decision — Astro streams the body, so CMS reads in nested components resolve after the adapter
returns the `Response` — and the cache-control middleware then forces `no-store`. A render that
throws mid-stream is replaced with the `500` page. A page that renders a CMS error fallback with status 200 is
therefore never stored at the edge. Any new CMS access must go through `env.CMS` from
`getRequestContext()` (the wrapped binding; `getCMSClient()` reads it), never
`import { env } from 'cloudflare:workers'` or another captured / global copy.

## Rules

- **HTML splits edge and browser: `s-maxage` for Workers Cache, `max-age=0` for the browser.**
  A purge only empties the edge; without `max-age=0` a browser would keep serving its own
  copy of the page after a publish. `s-maxage` disables `stale-while-revalidate` (RFC 9111),
  which is fine — page freshness is purge-driven. Non-HTML policies (media, `/_next/image`)
  keep `max-age` + `stale-while-revalidate`.
- **Never use `must-revalidate` or `proxy-revalidate`.** They add nothing to a purge-driven cache
  and would turn every stale edge hit into a blocking origin round-trip.
- **New page** → nothing to opt into: `output: 'server'` already renders it per request. Never add
  `export const prerender = true` or `getStaticPaths` (a prerendered page would skip the Worker, so
  cms-health, the cache policy and purge would not apply to it).
- **New page that renders external (non-CMS) data or the current time** (`dayjs()` now,
  `fetchExternalPosts`) → add its path to `TIME_SENSITIVE_PATHS`
  (`worker/middleware/cache-control/plugins/time-sensitive`). A purge never reaches that data, so
  under the `cms` policy it would stay frozen for a year.
- **New draft / per-user route** → add its root to the `uncacheable` plugin. Draft preview routes are
  also listed in `PREVIEW_ROOTS` (path-policy), which `uncacheable` reuses.
- **Pagination and filtering are path-keyed, never query-keyed.** Lists paginate at
  `/blog/page/[num]`, not `?page=N`. Do not read `Astro.url.searchParams` on a cacheable page: the policy is
  chosen by path, and query variants multiply cache entries that one purge must cover.
- **Never read runtime env / request data in a cacheable page body** unless the value is
  deploy-constant. A `[vars]` value (e.g. `TURNSTILE_SITE_KEY` on `/contact`) is fine: the cache is
  per Worker version. `Astro.cookies`, `Astro.request.headers`, a nonce, or a per-request secret in the HTML would
  be replayed to every visitor — such a page belongs in `uncacheable`.
- **A new CMS collection or global feeding pages** → give it a purge hook in apps/cms
  (`createPublishedPurgeHooks()` for drafts, `purgeOnChange` otherwise). Purge is all-or-nothing,
  so no per-path wiring is needed.

## Local development

`ctx.cache` is `undefined` under `wrangler dev` and `astro dev` even with `[cache] enabled`, so
`purge()` is a no-op there and nothing is cached. Locally you see only the `Cache-Control` the
middleware would stamp, never a HIT. Verify HIT / MISS / purge on staging (`cf-cache-status`).
