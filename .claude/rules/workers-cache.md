---
description: How apps/web pages are cached (SSR + Workers Cache, purge on CMS publish) — which Cache-Control each page class gets, how purge reaches the cache, and what a cacheable page must never read
paths:
  - "apps/web/src/app/**/page.tsx"
  - "apps/web/src/app/**/route.ts"
  - "apps/web/src/app/**/opengraph-image.tsx"
  - "apps/web/src/utils/cache-control/**/*.ts"
  - "apps/web/worker/**/*.ts"
  - "apps/web/open-next.config.ts"
  - "apps/web/wrangler.toml"
---

# Workers Cache (apps/web)

apps/web has **no ISR**: no OpenNext incremental cache / tag cache / queue, no `revalidate`,
no `unstable_cache`, no `revalidateTag` / `revalidatePath`. Every page is SSR
(`export const dynamic = 'force-dynamic'`) and the rendered response is cached by
**Workers Cache** in front of the Worker, keyed by URL + Worker version.

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
| `uncacheable` (deny) | `/{blog,news,works,gallery,log}/preview*`, `/next/*`, `/admin*`, and **any request whose CMS read failed** | `no-store` — always, any status / method / cookie | never stored |
| `timeSensitive` (page) | `/`, `/log`, `/log.md`, `/log/rss.xml`, `/.well-known/security.txt` | `public, max-age=0, s-maxage=3600` | 1h at the edge + purge |
| `cms` (page, catch-all) | every other page, feed, `.md`, llms, sitemap, robots, OG image, `/contact` | `public, max-age=0, s-maxage=31536000` | purge / deploy only |
| keep | `/_next/*` (`/_next/image` sets its own policy, `/_next/static` is immutable) | upstream | — |
| fill | `/api/media/file/*` media, other `/api/*` `private, no-store` | only when upstream sent none | — |

"page" policies **replace** Next's force-dynamic `private, no-cache, no-store, …` header, but only on a
cookie-less `GET`/`HEAD` `200` — a Server Action `POST`, a 404, or a `Set-Cookie` response keeps Next's header.
Path tests that guard privacy or freshness (deny / private / time-sensitive) also match the
percent-decoded pathname, because Next resolves `/%61dmin` to `/admin`.

## CMS failures are never cached

The worker mounts OpenNext through `worker/handlers/next`, which wraps this request's `CMS`
binding (`worker/lib/cms-health`). A `fetch` that throws or returns `>= 500` marks the request
degraded (404 / 403 are normal outcomes). Cacheable pages are read to the end before the
decision — streaming SSR resolves Suspense'd CMS reads after the shell — and the cache-control
middleware then forces `no-store`. A page that renders a CMS error fallback with status 200 is
therefore never stored at the edge. Any new CMS access must go through `env.CMS` from
`getCloudflareContext()` (the wrapped binding), never a captured or global copy.

## Rules

- **HTML splits edge and browser: `s-maxage` for Workers Cache, `max-age=0` for the browser.**
  A purge only empties the edge; without `max-age=0` a browser would keep serving its own
  copy of the page after a publish. `s-maxage` disables `stale-while-revalidate` (RFC 9111),
  which is fine — page freshness is purge-driven. Non-HTML policies (media, `/_next/image`)
  keep `max-age` + `stale-while-revalidate`.
- **Never use `must-revalidate` or `proxy-revalidate`.** They add nothing to a purge-driven cache
  and would turn every stale edge hit into a blocking origin round-trip.
- **New page** → add `export const dynamic = 'force-dynamic'` (OpenNext has no incremental cache to
  serve a prerender from). Verify the build table prints `ƒ (Dynamic)`. Do not add `generateStaticParams`.
- **New page that renders external (non-CMS) data or the current time** (`dayjs()` now,
  `fetchExternalPosts`) → add its path to `TIME_SENSITIVE_PATHS`
  (`worker/middleware/cache-control/plugins/time-sensitive`). A purge never reaches that data, so
  under the `cms` policy it would stay frozen for a year.
- **New draft / per-user route** → add its root to the `uncacheable` plugin. Draft preview routes are
  also listed in `PREVIEW_ROOTS` (path-policy), which `uncacheable` reuses.
- **Pagination and filtering are path-keyed, never query-keyed.** Lists paginate at
  `/blog/page/[num]`, not `?page=N`. Do not read `searchParams` on a cacheable page: the policy is
  chosen by path, and query variants multiply cache entries that one purge must cover.
- **Never read runtime env / request data in a cacheable page body** unless the value is
  deploy-constant. A `[vars]` value (e.g. `TURNSTILE_SITE_KEY` on `/contact`) is fine: the cache is
  per Worker version. `cookies()`, `headers()`, a nonce, or a per-request secret in the HTML would
  be replayed to every visitor — such a page belongs in `uncacheable`.
- **A new CMS collection or global feeding pages** → give it a purge hook in apps/cms
  (`createPublishedPurgeHooks()` for drafts, `purgeOnChange` otherwise). Purge is all-or-nothing,
  so no per-path wiring is needed.

## Local development

`ctx.cache` is `undefined` under `wrangler dev` and `next dev` even with `[cache] enabled`, so
`purge()` is a no-op there and nothing is cached. `next dev` shows only the `Cache-Control` the
middleware would stamp, never a HIT. Verify HIT / MISS / purge on staging (`cf-cache-status`).
