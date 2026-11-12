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

