# OG image thumbnail fix — fetch Payload media via WORKER_SELF_REFERENCE

## Problem

On staging/production, blog & works `opengraph-image.tsx` pass a same-origin
absolute URL (`https://stg.napochaan.com/api/media/file/<file>.png`) into
`resolveOgCardData({ imageUrl })`. `next/og`'s `ImageResponse` renders
`<img src>` and fetches it with the **global `fetch()`**.

A Worker fetching its own public hostname does **not** loop back into itself —
the subrequest goes to the edge, where the `[assets]` layer serves static files
from `.open-next/assets`. The dynamic Payload media route (`/api/media/file/...`,
streamed from R2) is **not** a static asset, so it 404s. Result: OG card shows
the Game-of-Life fallback field instead of the thumbnail.

Fonts/wordmark work because `loadOgAssets` reads them through the **ASSETS**
binding (they really are static). Media must instead re-enter the worker through
the **WORKER_SELF_REFERENCE** service binding.

## Precedent (do not change — this is the model)

`worker/handlers/images/fetchers/payload-media-fetcher.ts` already does this for
the `/_next/image` transformer:

```ts
if (!ctx.url.pathname.startsWith('/api/media/file/') || ctx.url.origin !== ctx.origin) {
  return errAsync(undefined); // external / not media → other fetcher
}
const response = ctx.env.WORKER_SELF_REFERENCE?.fetch(ctx.fetchUrl, ctx.fetchOptions);
```

Same-origin `/api/media/file/` → service binding; otherwise external fetch.

## Fix — new util `src/utils/og/load-og-image/`

`ImageResponse` can't be told to use a binding (it uses global fetch), so we
pre-fetch the bytes ourselves and inline a `data:` URL — exactly how the wordmark
is already inlined in `loadOgAssets`.

### `src/utils/og/load-og-image/index.ts`

```ts
import { getCloudflareContext } from '@opennextjs/cloudflare';

import { absoluteMediaUrl } from '../og-image-url';

// Resolves a Payload media src to a value Satori can render in <img src>.
//
// Same-origin /api/media/file/* is served by the worker's dynamic Payload route
// (R2), not the static ASSETS layer. Satori fetches <img src> with global
// fetch(); a worker fetching its own public hostname hits the edge/ASSETS layer
// and 404s the dynamic route. So we re-enter the worker through the
// WORKER_SELF_REFERENCE service binding (mirrors worker/handlers/images
// payloadMediaFetcher) and inline the bytes as a data: URL so Satori never
// fetches over the network.
//
// External images (different origin) pass through unchanged — Satori fetches
// them directly. Dev: next dev serves /api/media/file at the request origin and
// no self-ref worker is running, so return the absolute URL for Satori to fetch.
const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');

  return btoa(binary);
};

export const loadOgImage = async (src: string | undefined, origin: string): Promise<string | undefined> => {
  const absolute = absoluteMediaUrl(src, origin);
  if (absolute === undefined) return undefined;

  const isPayloadMedia = absolute.startsWith(origin) && new URL(absolute).pathname.startsWith('/api/media/file/');
  if (!isPayloadMedia) return absolute;

  // next dev serves the media route at the request origin; Satori can fetch it.
  if (process.env.NODE_ENV === 'development') return absolute;

  const ref = getCloudflareContext().env.WORKER_SELF_REFERENCE;
  if (ref === undefined) return absolute; // no binding → best-effort direct fetch

  const response = await ref.fetch(absolute);
  if (!response.ok) return undefined;

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') ?? 'image/png';

  return `data:${contentType};base64,${toBase64(buffer)}`;
};
```

### `src/utils/og/load-og-image/load-og-image.test.ts` (TDD — write first)

Node test (`.ts`). Mock `@opennextjs/cloudflare` with a mutable env holder so the
`WORKER_SELF_REFERENCE` binding can be present/absent per case. Cover:

1. absent / empty `src` → `undefined`, no binding fetch.
2. external absolute URL (different origin) → returned unchanged, no binding fetch.
3. same-origin relative `/api/media/file/x.png`, `NODE_ENV=production`, binding
   resolves ok (`content-type: image/png`, bytes) → returns `data:image/png;base64,...`
   and `WORKER_SELF_REFERENCE.fetch` called with the absolute URL.
4. same-origin media, production, binding `!ok` (404) → `undefined`.
5. same-origin media, `NODE_ENV=development` → returns the absolute URL, binding NOT called.
6. same-origin media, production, binding `undefined` → returns the absolute URL.

Mirror mocking style from `src/utils/og/load-og-assets/load-og-assets.test.ts`
(`vi.stubEnv('NODE_ENV', ...)`, `vi.clearAllMocks()` / `vi.unstubAllEnvs()` in afterEach).

## Wiring

Both routes are already `async`. Replace the synchronous `absoluteMediaUrl(...)`
imageUrl with an awaited `loadOgImage(...)`.

### `src/app/(site)/blog/[id]/opengraph-image.tsx`

- import: drop `absoluteMediaUrl` (keep `requestOrigin`), add `loadOgImage` from `@utils/og/load-og-image`.
- before `resolveOgCardData`: `const imageUrl = await loadOgImage(post?.thumbnail?.src, origin);`
- pass `imageUrl` into `resolveOgCardData({ ..., imageUrl })`.

### `src/app/(site)/works/[id]/opengraph-image.tsx`

- same change with `work?.thumbnail?.src`.

### `src/app/(site)/news/[id]/opengraph-image.tsx`

- no change (news has no image source; already always GoL).

## Verify

- `pnpm lint && pnpm typecheck`
- `pnpm vitest run src/utils/og/load-og-image` (new tests green)
- Do NOT deploy. Leave staging redeploy to the user.

---

## Refactor — registered-runner plugin shape (mirror `worker/handlers/images/`)

The first cut above worked but used an inline if/else chain. Restructure into the
same plugin architecture as the images handler: a registry of runners tried in
order, first match wins. `loadOgImage`'s public signature/behavior is unchanged —
the existing `load-og-image.test.ts` stays green as the integration test.

Map to the worker (`worker/handlers/images/`):

| images handler                       | load-og-image                               |
| ------------------------------------ | ------------------------------------------- |
| `fetchers/types.ts` (`ImageFetcher`) | `types.ts` (`OgImageRunner`)                |
| `helpers.ts` (`isInternalAsset`)     | `helpers.ts` (`isPayloadMedia`, `toBase64`) |
| `fetchers/*-fetcher.ts`              | `runners/*-runner.ts`                       |
| `fetchers/combined-fetcher.ts`       | `runners/combined-runner.ts`                |
| handler `index.ts` builds ctx        | `index.ts` `loadOgImage` builds ctx         |

Uses `neverthrow` (`okAsync` / `errAsync` / `ResultAsync.fromPromise`) exactly as
the fetchers do. Runner result value type is `string | undefined` (resolved
`<img src>`, or undefined → GoL).

### `types.ts`

```ts
import type { ResultAsync } from 'neverthrow';

export type OgImageContext = {
  absolute: string;    // absolute media URL (absent src handled before the loop)
  origin: string;      // request origin, for same-origin detection
  isDev: boolean;      // NODE_ENV === 'development'
  env: Cloudflare.Env; // for WORKER_SELF_REFERENCE
};

export type OgImageRunner = {
  run: (ctx: OgImageContext) => ResultAsync<string | undefined, void>;
};
```

### `helpers.ts`

```ts
export const isPayloadMedia = (absolute: string, origin: string): boolean =>
  absolute.startsWith(origin) && new URL(absolute).pathname.startsWith('/api/media/file/');

export const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');

  return btoa(binary);
};
```

### `runners/external-runner.ts`

```ts
import { errAsync, okAsync } from 'neverthrow';

import { isPayloadMedia } from '../helpers';

import type { OgImageRunner } from '../types';

// Non-payload-media (cross-origin or non-media same-origin) → Satori fetches the
// URL directly; pass it through unchanged.
export const externalRunner: OgImageRunner = {
  run: (ctx) => (isPayloadMedia(ctx.absolute, ctx.origin) ? errAsync(undefined) : okAsync(ctx.absolute)),
};
```

### `runners/dev-runner.ts`

```ts
import { errAsync, okAsync } from 'neverthrow';

import { isPayloadMedia } from '../helpers';

import type { OgImageRunner } from '../types';

// Dev: next dev serves /api/media/file at the request origin and no self-ref
// worker runs, so Satori can fetch the absolute URL directly.
export const devRunner: OgImageRunner = {
  run: (ctx) => {
    if (!isPayloadMedia(ctx.absolute, ctx.origin) || !ctx.isDev) return errAsync(undefined);

    return okAsync(ctx.absolute);
  },
};
```

### `runners/service-binding-runner.ts`

```ts
import { errAsync, okAsync, ResultAsync } from 'neverthrow';

import { isPayloadMedia, toBase64 } from '../helpers';

import type { OgImageRunner } from '../types';

// Same-origin Payload media in the worker runtime. Satori's global fetch() can't
// reach the worker's own dynamic media route (a worker fetching its public
// hostname hits the edge/ASSETS layer and 404s), so re-enter the worker via the
// WORKER_SELF_REFERENCE service binding and inline the bytes as a data: URL.
const toDataUrl = async (response: Response): Promise<string | undefined> => {
  if (!response.ok) return undefined;

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') ?? 'image/png';

  return `data:${contentType};base64,${toBase64(buffer)}`;
};

export const serviceBindingRunner: OgImageRunner = {
  run: (ctx) => {
    if (!isPayloadMedia(ctx.absolute, ctx.origin) || ctx.isDev) return errAsync(undefined);

    const ref = ctx.env.WORKER_SELF_REFERENCE;
    if (ref === undefined) return okAsync(ctx.absolute); // no binding → best-effort direct fetch

    return ResultAsync.fromPromise(ref.fetch(ctx.absolute).then(toDataUrl), () => undefined);
  },
};
```

### `runners/combined-runner.ts`

```ts
import { devRunner } from './dev-runner';
import { externalRunner } from './external-runner';
import { serviceBindingRunner } from './service-binding-runner';

import type { OgImageContext, OgImageRunner } from '../types';

// Registry, tried in order; first match wins (mirrors worker fetchImage).
const runners: OgImageRunner[] = [externalRunner, devRunner, serviceBindingRunner];

export const resolveOgImage = async (ctx: OgImageContext): Promise<string | undefined> => {
  for (const runner of runners) {
    const result = await runner.run(ctx);
    if (result.isOk()) return result.value;
  }

  return undefined;
};
```

### `index.ts`

```ts
import { getCloudflareContext } from '@opennextjs/cloudflare';

import { absoluteMediaUrl } from '../og-image-url';

import { resolveOgImage } from './runners/combined-runner';

import type { OgImageContext } from './types';

// Resolves a Payload media src to a value next/og's Satori can render in <img src>.
// Runs a registry of runners (external / dev / service-binding); first match wins —
// same plugin shape as worker/handlers/images. See the runners for why same-origin
// media must re-enter the worker via WORKER_SELF_REFERENCE.
export const loadOgImage = async (src: string | undefined, origin: string): Promise<string | undefined> => {
  const absolute = absoluteMediaUrl(src, origin);
  if (absolute === undefined) return undefined;

  const ctx: OgImageContext = {
    absolute,
    origin,
    isDev: process.env.NODE_ENV === 'development',
    env: getCloudflareContext().env,
  };

  return resolveOgImage(ctx);
};
```

### Tests after refactor

- KEEP `load-og-image.test.ts` (public-entry integration, the 6 cases) — must stay green.
- ADD `runners/combined-runner.test.ts` mirroring `worker/handlers/images/fetchers/combined-fetcher.test.ts`:
  build an `OgImageContext` directly and assert which runner wins —
  (a) non-media → external passthrough,
  (b) media + dev → absolute,
  (c) media + prod + binding ok → `data:` URL,
  (d) media + prod + binding undefined → absolute,
  (e) media + prod + binding 404 → undefined.
- ADD `helpers.test.ts` for `isPayloadMedia` (same-origin media true; cross-origin / non-media false) and `toBase64`.

No pure re-export barrels (`combined-runner.ts` composes the registry array = real
logic; `index.ts` holds `loadOgImage` = real logic). No `runners/index.ts`.
