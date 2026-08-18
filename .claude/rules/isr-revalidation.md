---
description: Ensure cached pages are purged via revalidatePath alongside any revalidateTag — the path-keyed cache is unreachable by revalidateTag alone, and CMS pages have no time-based self-heal
paths:
  - "src/app/(site)/**/page.tsx"
  - "src/app/(site)/layout.tsx"
  - "src/collections/**/*.ts"
  - "src/utils/cache/**/*.ts"
  - "src/utils/payload/**/*.ts"
---

# Caching & Revalidation Strategy

CMS-sourced pages are **purge-driven, not time-driven**: they carry NO `export const revalidate` and are cached indefinitely until a Payload hook busts them. The rendered HTML lives in a **path-keyed** cache that `revalidateTag` does **not** reach — `revalidateTag` only purges `unstable_cache` entries (the data layer). So when a collection's data flows into a cached page, its `afterChange` / `afterDelete` hooks must call **both**:

- `revalidateTag(<tag>)` — for the `unstable_cache` reads tagged with it
- `revalidatePath(<path>)` — for every cached page that renders the data

Because there is no time window anymore, **a missing path in a hook means the page is stale forever**, not "stale up to 1 h". Hook path coverage is load-bearing.

## Detail pages: purge the `[slug]` pattern, not the single slug

`revalidatePath('/blog/[slug]', 'page')` busts EVERY rendered page of that route (Next tags each page with `_N_T_<pattern>/page`). The hook helpers (`src/collections/hooks/revalidate`) do this automatically for any path containing `[`. This is required — not an optimization — because detail pages render cross-document derivations (prev/next navigation from the full list), so publishing one doc must bust all sibling detail pages.

## Pages that MUST keep `export const revalidate`

| Page | Why purge-only is impossible |
| --- | --- |
| `(home)/page.tsx` | log teaser renders external RSS posts (no CMS hook) + `upcoming` flips with current time |
| `log/page.tsx` | same: external RSS + time-based `upcoming` |
| `*/opengraph-image.tsx` | `revalidatePath` does not reach metadata image routes |

If a new page renders external (non-CMS) data or time-dependent output (`dayjs()` now), it needs a time-based `revalidate`. Otherwise leave it off.

## Current hook wiring (src/collections, src/globals)

- `blog` → tag `blog`, paths `/`, `/blog`, `/blog/page/[num]`, `/blog/[slug]`
- `news` → tag `news`, paths `/`, `/news`, `/news/page/[num]`, `/news/[slug]`
- `works` → tag `works`, paths `/`, `/works`, `/works/page/[num]`, `/log`, `/works/[slug]`
- `gallery` → tag `gallery`, paths `/`, `/gallery`
- `logs` → tag `logs`, paths `/`, `/log`
- `legal-documents` → tag `legal-documents`, path `/legal/[slug]`
- `media` → tags `news`/`works`/`gallery`/`blog`, all their list + `page/[num]` + `[slug]` pattern paths
- `profile` (global) → tag `profile`, path `/about`

Route handlers (`rss.xml`, `llms.txt`, `*.md`, `sitemap`) are `force-dynamic` — no path purge needed; their data freshness comes from the tag purge alone.

## Pagination must be path-keyed, never query-keyed

List pages paginate via `/blog/page/[num]` routes, NOT `?page=N`. Reading `searchParams` opts the whole route into dynamic rendering (SSR on every request — no static cache at all). If you add pagination or filtering to a page, model it as a path segment and add the pattern to the owning hook's path list.

## When editing a `page.tsx`

1. List every collection / global queried (directly, via `unstable_cache`, or a helper)
2. For each one, verify its hook busts **both** the tag and **this page's path** (list page → literal path, detail page → `[slug]` pattern)
3. New CMS collection feeding pages? → wire `createPublishedTagAndPathRevalidateHooks` and extend `scripts/bust-isr-cache.mjs`'s tag list
4. External data or `dayjs()`-now rendering? → the page keeps a time-based `revalidate`

## Deploy note

`next build` prerenders CMS pages EMPTY (payload bindings are inert at build). `scripts/bust-isr-cache.mjs` — run at the tail of `deploy:staging` / `deploy:production` — is the ONLY mechanism that flushes that empty snapshot now that there is no hourly self-heal. Keep its tag list in sync with the wiring table above.

## Never read runtime `env` from a prerendered page

`getCloudflareContext().env` resolves on whatever machine renders the page. During
`next build` that is the CI runner, where `.github/actions/setup` seeds `.dev.vars`
from `.dev.vars.example`. A statically prerendered page therefore bakes those
placeholder values into its HTML and keeps serving them for `s-maxage=31536000` —
with no revalidate window and no `bust-isr-cache.mjs` entry, forever.

This shipped: `/contact` served `turnstileSiteKey: "dev-placeholder"` in production,
Turnstile answered `400` on the bogus key, its widget fell back to the error card
(the stray "Troubleshoot" link), and the submit button stayed permanently disabled.

Any page whose **render** reads `env` — or any other deploy/request-time value — must
opt out of static prerendering:

```ts
// The page reads TURNSTILE_SITE_KEY from the Cloudflare env at render time.
export const dynamic = 'force-dynamic';
```

A genuine dynamic API works too, and is why `/oauth/authorize` was never affected: it
awaits `searchParams`, so Next never prerenders it. Route handlers and Server Actions
always run per request and are safe.

Verify with the build output — the route must print `ƒ (Dynamic)`, and must be absent
from `.next/prerender-manifest.json`.

## Anti-patterns

```ts
// Bad — only purges the data cache; the page HTML never refreshes (no time window exists)
afterChange: [() => revalidateTag(CACHE_TAGS.blog)]

// Bad — per-slug purge leaves sibling detail pages (prev/next nav) stale forever
revalidatePath(`/blog/${doc.slug}`);

// Good — pattern purge busts all detail pages + list + home
createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.blog], ['/', '/blog', '/blog/[slug]'])
```
