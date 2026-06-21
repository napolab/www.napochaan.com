# Software Release Download-Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a software-release repository: blog "I made this" articles embed a download block that expands into a Turnstile-gated download UI; binaries are served only via a short-lived HMAC-signed URL minted by a Server Action.

**Architecture:** Two Payload collections — `software` (slug/name/summary/terms) and an upload-backed `software-release` (binary/version/releasedAt/changelog → `software`). A `software-download` lexical block (holding only a `software` relationship) renders, via a JSX-converter factory fed by a server-side loader, into an inline trigger + a react-aria Dialog (terms scroll + agree checkbox + Turnstile). On confirm a Server Action verifies the token and returns `/api/software/download?releaseId&exp&sig`; a GET Route Handler re-checks the HMAC + expiry and streams bytes from the R2 binding. The release collection's `read` access is admin-only, so the public never gets a direct file URL; the site renders release metadata server-side with `overrideAccess`.

**Tech Stack:** Payload CMS (D1 + `@payloadcms/storage-r2` binding mode), Next.js App Router (RSC + Server Actions) on OpenNext/Cloudflare Workers, `@payloadcms/richtext-lexical`, react-aria-components, Panda CSS, `@marsidev/react-turnstile`, Web Crypto HMAC, vitest (node + browser).

## Global Constraints

- Arrow functions only (`const fn = () => {}`); class methods use shorthand. (`function-style.md`)
- No `let`, no IIFE, no `forEach`, no non-null `!`, no `any`. Immutable/pure. (`functional-programming.md`)
- No `Boolean()`/`String()`/`Number()`/`Number.parseInt`; use `=== / !==`, template literals, global `parseInt(x,10)`/`parseFloat`. No `.filter(Boolean)`. (`primitive-coercion.md`)
- Function INPUT types use `T` / `T?` only — never `T | null`. Coerce `null → undefined` at the caller boundary. (`function-arg-types.md`)
- Dates via `import { dayjs } from '@utils/dayjs'` + `.tz('Asia/Tokyo')`. Never raw `Date` for formatting. (`dayjs-timezone.md`)
- Acronyms stay all-caps mid-identifier: `URL`, `HMAC`, `ID` → `signDownloadURL`, not `signDownloadUrl`. First word of camelCase lowercases: `urlParser`. Files stay kebab-case. (`acronym-casing.md`)
- No barrel `index.ts` (re-export-only). Import direct from source. (`no-barrel.md`)
- Components: kebab-case dir, `index.tsx` + `styles.css.ts` + `<name>.test.tsx`; namespace style import `import * as styles from './styles.css'`; root style class named `root`; data-attribute styling, no conditional className; Panda tokens only. (`components.md`, `naming.md`, `data-attribute-styling.md`)
- TDD: Red → Green → Refactor for everything under `src/utils/`, `src/components/`, `src/lib/`, colocated `_components/`. Test files colocated. `*.test.tsx` = browser mode (DOM), `*.test.ts` = node. (`tdd.md`, `vitest-test-extension-env-routing` memory)
- Server Components by default; `'use client'` only for interactivity, smallest scope, wrapped `ErrorBoundary > Suspense`. No `useEffect` for data/state sync. Handlers are `async useCallback`, never `.then/.catch`/IIFE. (`react.md`, `coding-rules.md`)
- Links via react-aria-components `Link` (RouterProvider present). Images via `@components/image` + `formatBlurURL`, never `next/image`. (`ui rules`, `images.md`)
- WCAG 2.1 AA color tokens. UI realization order: HTML+CSS → react-aria-components → propose change → custom. (`ui rules`)
- Every new `src/components/*` UI must be registered in colophon (`_demos/index.tsx` + `content.ts`); demo link/href uses `e.preventDefault` noaction. (`components.md`)
- After every implementation step that touches code: `pnpm lint && pnpm typecheck` must pass. Use `pnpm typecheck` (tsgo), never `tsc`. Single test file: `pnpm vitest run <path>`. (`coding-rules.md`)
- Do NOT commit without explicit user approval (CLAUDE.md). Each task's "Commit" step PREPARES the commit; if running unattended via subagents, stage + commit is allowed on the feature branch `feat/software-release-download` (already created). Husky runs lint+typecheck on commit.
- Payload auto-generated files (`payload-types.ts`, `admin/importMap.js`, `migrations/*`) are not hand-edited and may fail linters — expected. (`payload-cms.md`)
- New collection checklist (both collections): define → register in `payload.config.ts` → seoPlugin (public only) → livePreview (public only) → migration create+run → regenerate importmap → regenerate types. (`payload-cms.md`)

## Fixed Values (referenced by multiple tasks)

- HMAC key: `env.PAYLOAD_SECRET` (already a runtime secret; no new secret introduced).
- Signed-URL TTL: `DOWNLOAD_URL_TTL_MS = 60_000` (60s).
- R2 object key for a release: `releases/${filename}` (storage-r2 `prefix: 'releases'`).
- Turnstile: client widget `@marsidev/react-turnstile` with `env.TURNSTILE_SITE_KEY`; server `verifyTurnstile(token, env, remoteIp?)` from `@lib/contact/verify-turnstile` (reused as-is, env has `TURNSTILE_SECRET_KEY`).
- Download endpoint path: `/api/software/download`.
- Detail route: `/software/{slug}`; live-preview route: `/software/preview/{id}`.

## Interface Catalog (names/types shared across tasks — copy verbatim)

```ts
// src/lib/software/download-token/index.ts
export type DownloadTokenInput = { releaseId: string; exp: number };
export const signDownloadToken = (input: DownloadTokenInput, secret: string): Promise<string>; // hex HMAC-SHA256 of `${releaseId}|${exp}`
export const verifyDownloadToken = (input: DownloadTokenInput, sig: string, secret: string): Promise<boolean>; // constant-time compare

// src/lib/payload/software/index.ts  (domain types + loaders)
export type SoftwareRelease = { id: string; version: string; releasedAt: string; changelog?: string; filename: string };
export type SoftwareDownload = { id: string; name: string; summary: string; terms: SerializedEditorState; latest: SoftwareRelease; history: readonly SoftwareRelease[] };
export const findSoftwareDownloadsByIds = (ids: readonly string[]): Promise<ReadonlyMap<string, SoftwareDownload>>; // keyed by software id; entries with zero releases are omitted
export const findSoftwareBySlug = (slug: string): Promise<SoftwareDownload | undefined>;
export const findSoftwareDraftById = (id: string): Promise<SoftwareDownload | undefined>;

// src/lib/software/collect-software-ids/index.ts
export const collectSoftwareIds = (body?: SerializedEditorState) => readonly string[]; // software ids referenced by software-download blocks in a lexical tree

// src/lib/software/split-releases/index.ts  (pure)
export const splitReleases = (releases: readonly SoftwareRelease[]) => { latest: SoftwareRelease; history: readonly SoftwareRelease[] } | undefined; // newest by releasedAt is latest

// src/app/(site)/_actions/issue-download-url/index.ts  ('use server')
export type IssueDownloadResult = { url: string } | { error: string };
export const issueDownloadURL = (releaseId: string, token: string): Promise<IssueDownloadResult>;

// src/components/software-download-gate/index.tsx  ('use client')
export type SoftwareDownloadGateProps = { software: SoftwareDownload };
export const SoftwareDownloadGate = (props: SoftwareDownloadGateProps) => JSX;

// src/components/rich-text  — RichText gains an optional prop
type RichTextProps = { data: SerializedEditorState; className?: string; softwareDownloads?: ReadonlyMap<string, SoftwareDownload> };
```

---

# Phase 1 — Data model

### Task 1: `software` collection

**Files:**

- Create: `src/collections/software.ts`
- Modify: `src/payload.config.ts` (import + `collections` array)
- Modify: `src/utils/cache-tags/index.ts` (add `software` tag)

**Interfaces:**

- Produces: collection slug `'software'`; `CACHE_TAGS.software = 'software'`.

- [ ] **Step 1: Add the cache tag**

In `src/utils/cache-tags/index.ts`, add to the `CACHE_TAGS` object:

```ts
  software: 'software',
```

- [ ] **Step 2: Create the collection**

`src/collections/software.ts`:

```ts
import { CACHE_TAGS } from '@utils/cache-tags';

import { slugField } from './fields/slug';
import { createPublishedTagAndPathRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Software products. Embedded in blog bodies via the `software-download` block and
// surfaced at `/software/{slug}`. A product is the stable identity; its binaries
// live in the `software-release` collection. Busting CACHE_TAGS.software purges the
// loader reads; revalidatePath of the detail page covers the path-keyed ISR HTML.
// Blog detail pages that embed a software block are revalidated separately (see the
// software-release hook / Task 15).
const revalidateSoftware = createPublishedTagAndPathRevalidateHooks([CACHE_TAGS.software], [], (slug) => `/software/${slug}`);

export const Software = {
  slug: 'software',
  labels: { singular: 'ソフトウェア', plural: 'ソフトウェア' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateSoftware.afterChange],
    afterDelete: [revalidateSoftware.afterDelete],
  },
  fields: [
    slugField(),
    { name: 'name', label: '名称', type: 'text', required: true },
    {
      name: 'summary',
      label: '概要',
      type: 'textarea',
      required: true,
      admin: { description: '一覧やダウンロードブロックの見出し下、詳細ページ、OG に表示される短い説明。' },
    },
    {
      name: 'terms',
      label: '利用規約',
      type: 'richText',
      required: true,
      admin: { description: 'ダウンロード時のダイアログ内にスクロール表示される利用規約。' },
    },
  ],
} satisfies CollectionConfig;
```

- [ ] **Step 3: Register in payload.config.ts**

Add the import alongside the other collection imports:

```ts
import { Software } from './collections/software';
```

Add `Software` to the `collections` array:

```ts
collections: [Users, Media, News, Works, Blog, Gallery, Logs, Software],
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (no usage of generated `software` type yet).

- [ ] **Step 5: Commit**

```bash
git add src/collections/software.ts src/payload.config.ts src/utils/cache-tags/index.ts
git commit -m "feat: add software collection"
```

---

### Task 2: `software-release` collection + R2 storage wiring

**Files:**

- Create: `src/collections/software-release.ts`
- Modify: `src/payload.config.ts` (import, `collections`, `r2Storage.collections`)

**Interfaces:**

- Produces: collection slug `'software-release'`; upload-backed; R2 prefix `releases`; admin-only `read`.

- [ ] **Step 1: Create the collection**

`src/collections/software-release.ts`:

```ts
import { CACHE_TAGS } from '@utils/cache-tags';

import { createTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// One binary = one version of a `software` product. Upload-backed (bytes in R2 under
// the `releases/` prefix). `read` is admin-only on purpose: the public never reads a
// release directly — the site renders release metadata server-side with
// overrideAccess, and bytes are served only through the signed /api/software/download
// route. This also makes Payload's built-in file route return 403 for the public, so
// there is no public direct download link.
const revalidateRelease = createTagRevalidateHooks([CACHE_TAGS.software]);

export const SoftwareRelease = {
  slug: 'software-release',
  labels: { singular: 'リリース', plural: 'リリース' },
  defaultSort: '-releasedAt',
  upload: {
    // Distribution archives. octet-stream is the catch-all for unknown binaries.
    mimeTypes: ['application/zip', 'application/gzip', 'application/x-gtar', 'application/octet-stream', 'application/x-apple-diskimage'],
  },
  admin: {
    useAsTitle: 'version',
    defaultColumns: ['version', 'software', 'releasedAt'],
  },
  access: {
    read: ({ req: { user } }) => user !== null,
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  hooks: {
    afterChange: [revalidateRelease.afterChange],
    afterDelete: [revalidateRelease.afterDelete],
  },
  fields: [
    {
      name: 'software',
      label: 'ソフトウェア',
      type: 'relationship',
      relationTo: 'software',
      required: true,
      admin: { position: 'sidebar' },
    },
    { name: 'version', label: 'バージョン', type: 'text', required: true, admin: { description: '例: 1.1.0' } },
    {
      name: 'releasedAt',
      label: 'リリース日',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    {
      name: 'changelog',
      label: '変更点',
      type: 'textarea',
      admin: { description: '任意。GitHub Release のように、この版で何が変わったかを書く。' },
    },
  ],
} satisfies CollectionConfig;
```

- [ ] **Step 2: Register collection + storage**

In `src/payload.config.ts` add the import:

```ts
import { SoftwareRelease } from './collections/software-release';
```

Add to the `collections` array (after `Software`):

```ts
collections: [Users, Media, News, Works, Blog, Gallery, Logs, Software, SoftwareRelease],
```

Wire R2 storage for the new collection — update the `r2Storage` plugin call:

```ts
    r2Storage({
      bucket: r2,
      collections: {
        media: true,
        'software-release': { prefix: 'releases' },
      },
    }),
```

- [ ] **Step 3: Verify the prefix is honored (binding mode)**

Run: `pnpm typecheck`
Expected: PASS.

Then confirm `prefix` is a supported per-collection option in the installed adapter:

Run: `grep -rn "prefix" node_modules/@payloadcms/storage-r2/dist/ | head`
Expected: matches showing `prefix` is read when building the object key.
If NO match (prefix unsupported in binding mode): drop `{ prefix: 'releases' }` back to `true`, and change `Fixed Values` + Task 9 to key = `filename` (Payload guarantees per-collection filename uniqueness; cross-collection collision risk is accepted). Record which path was taken in the commit message.

- [ ] **Step 4: Commit**

```bash
git add src/collections/software-release.ts src/payload.config.ts
git commit -m "feat: add software-release upload collection with R2 storage"
```

---

### Task 3: `software-download` rich-text block

**Files:**

- Create: `src/blocks/software-download/index.ts`
- Modify: `src/payload.config.ts` (editor `BlocksFeature`)

**Interfaces:**

- Produces: block slug `'software-download'` with one field `software` (relationship → software, required).

- [ ] **Step 1: Create the block**

`src/blocks/software-download/index.ts`:

```ts
import type { Block } from 'payload';

// A rich-text block embedding a software product's download gate. Holds only a
// reference to the product; the converter resolves the product's terms and release
// history (supplied by the page loader) at render time and shows the latest version
// as the primary download plus a disclosure of past versions. Converter lives in
// src/components/rich-text/converters/software-download.
export const SoftwareDownload = {
  slug: 'software-download',
  labels: { singular: 'ダウンロード', plural: 'ダウンロード' },
  fields: [
    {
      name: 'software',
      label: 'ソフトウェア',
      type: 'relationship',
      relationTo: 'software',
      required: true,
    },
  ],
} satisfies Block;
```

- [ ] **Step 2: Register in the lexical editor**

In `src/payload.config.ts` add the import next to `ImageRow`:

```ts
import { SoftwareDownload } from './blocks/software-download';
```

Update the editor `BlocksFeature`:

```ts
  editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, BlocksFeature({ blocks: [ImageRow, SoftwareDownload] })] }),
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/software-download/index.ts src/payload.config.ts
git commit -m "feat: add software-download rich-text block"
```

---

### Task 4: SEO + Live Preview + preview route for `software`

**Files:**

- Modify: `src/payload.config.ts` (seoPlugin `collections`, livePreview `collections` + a `draftPreviewRoute`)
- Create: `src/app/(site)/software/preview/[id]/page.tsx`

**Interfaces:**

- Consumes: `findSoftwareDraftById` (Task 7) — implement this task AFTER Task 7, or stub the page to `notFound()` and revisit. To keep order linear, this task assumes Task 7 is done; if executing strictly in order, move this task after Task 7.
- Produces: `/software/preview/{id}` live-preview route.

> NOTE: This task depends on `findSoftwareDraftById` from Task 7 and the detail components from Task 13. Execute it AFTER Task 13. It is listed here to keep the Payload-checklist items grouped, but its checkbox should be completed last in Phase-1 follow-up.

- [ ] **Step 1: Add software to seoPlugin**

In `src/payload.config.ts`:

```ts
      collections: ['news', 'works', 'blog', 'gallery', 'software'],
```

- [ ] **Step 2: Add software to livePreview**

Add a `draftPreviewRoute` entry in the `createPreviewURLFactory([...])` list:

```ts
        draftPreviewRoute({
          slug: 'software',
          previewSecret: cfEnv.PREVIEW_SECRET ?? '',
          buildPath: (data) => `/software/preview/${data.id}`,
        }),
```

And add `'software'` to `livePreview.collections`:

```ts
      collections: ['news', 'works', 'blog', 'gallery', 'logs', 'software'],
```

- [ ] **Step 3: Create the preview page (mirror blog preview)**

Read `src/app/(site)/blog/preview/[id]/page.tsx` first and mirror its secret-gating exactly, swapping the loader to `findSoftwareDraftById` and rendering the same `SoftwareDetail` component used by `/software/[slug]` (Task 13). Full code is produced in Task 13's detail component; this page is the thin draft wrapper.

- [ ] **Step 4: Typecheck + commit** (after Task 13)

```bash
pnpm typecheck
git add src/payload.config.ts "src/app/(site)/software/preview/[id]/page.tsx"
git commit -m "feat: software SEO + live preview route"
```

---

### Task 5: Migration + regenerate types/importmap

**Files:**

- Create: `migrations/<timestamp>_software_release.ts` (auto-generated)
- Modify: `src/payload-types.ts` (auto-generated)
- Modify: `src/app/(payload)/admin/importMap.js` (auto-generated)

**Interfaces:**

- Produces: `software` + `software-release` tables; generated TS types `Software`, `SoftwareRelease`.

- [ ] **Step 1: Create the migration**

Run: `pnpm payload migrate:create software_release`
Expected: a new file under `migrations/`. (PAYLOAD_SECRET resolves from `.dev.vars` via wrangler proxy — no prefix needed; see `payload-cms.md`.)

- [ ] **Step 2: Apply locally**

Run: `pnpm payload migrate`
Expected: applies cleanly.

- [ ] **Step 3: Regenerate types + importmap**

Run: `pnpm payload generate:types && pnpm payload generate:importmap`
Expected: `src/payload-types.ts` now exports `Software` and `SoftwareRelease`; importMap updated.

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add migrations src/payload-types.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat: migrate software + software-release tables"
```

---

# Phase 2 — Signing + download endpoint (server)

### Task 6: HMAC download-token signing utility (TDD)

**Files:**

- Create: `src/lib/software/download-token/index.ts`
- Test: `src/lib/software/download-token/download-token.test.ts`

**Interfaces:**

- Produces: `signDownloadToken(input, secret): Promise<string>`, `verifyDownloadToken(input, sig, secret): Promise<boolean>` (see Interface Catalog).

- [ ] **Step 1: Write the failing test**

`src/lib/software/download-token/download-token.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { signDownloadToken, verifyDownloadToken } from './index';

const SECRET = 'test-secret';

describe('download-token', () => {
  it('verifies a token it signed', async () => {
    const input = { releaseId: '42', exp: 1_900_000_000_000 };
    const sig = await signDownloadToken(input, SECRET);
    expect(await verifyDownloadToken(input, sig, SECRET)).toBe(true);
  });

  it('rejects a tampered releaseId', async () => {
    const sig = await signDownloadToken({ releaseId: '42', exp: 1_900_000_000_000 }, SECRET);
    expect(await verifyDownloadToken({ releaseId: '43', exp: 1_900_000_000_000 }, sig, SECRET)).toBe(false);
  });

  it('rejects a tampered exp', async () => {
    const sig = await signDownloadToken({ releaseId: '42', exp: 1_900_000_000_000 }, SECRET);
    expect(await verifyDownloadToken({ releaseId: '42', exp: 1_900_000_000_001 }, sig, SECRET)).toBe(false);
  });

  it('rejects a different secret', async () => {
    const input = { releaseId: '42', exp: 1_900_000_000_000 };
    const sig = await signDownloadToken(input, SECRET);
    expect(await verifyDownloadToken(input, sig, 'other-secret')).toBe(false);
  });

  it('rejects a malformed signature without throwing', async () => {
    const input = { releaseId: '42', exp: 1_900_000_000_000 };
    expect(await verifyDownloadToken(input, 'zzzz', SECRET)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/software/download-token/download-token.test.ts`
Expected: FAIL ("does not provide an export named 'signDownloadToken'").

- [ ] **Step 3: Write the implementation**

`src/lib/software/download-token/index.ts`:

```ts
import type { DownloadTokenInput } from './types';

export type { DownloadTokenInput } from './types';

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return bytes.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
};

const importKey = (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

const payloadOf = (input: DownloadTokenInput): string => `${input.releaseId}|${input.exp}`;

// Hex HMAC-SHA256 of `${releaseId}|${exp}` keyed by the shared secret (PAYLOAD_SECRET).
export const signDownloadToken = async (input: DownloadTokenInput, secret: string): Promise<string> => {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadOf(input)));
  return toHex(signature);
};

// Constant-time comparison: recompute the expected signature and compare byte-equal
// length-first. Returns false (never throws) on any malformed candidate.
export const verifyDownloadToken = async (input: DownloadTokenInput, sig: string, secret: string): Promise<boolean> => {
  const expected = await signDownloadToken(input, secret);
  if (expected.length !== sig.length) return false;
  const mismatch = Array.from(expected).reduce((acc, char, index) => acc | (char.charCodeAt(0) ^ sig.charCodeAt(index)), 0);
  return mismatch === 0;
};
```

`src/lib/software/download-token/types.ts`:

```ts
export type DownloadTokenInput = { releaseId: string; exp: number };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/software/download-token/download-token.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/software/download-token
git commit -m "feat: HMAC download-token sign/verify"
```

---

### Task 7: Software loaders + domain mappers (TDD where pure)

**Files:**

- Create: `src/lib/payload/software/index.ts` (loaders; uses `getPayloadClient`, `unstable_cache`)
- Create: `src/lib/payload/software/to-software-download.ts` (pure mapper)
- Test: `src/lib/payload/software/to-software-download.test.ts`
- Create: `src/lib/software/split-releases/index.ts` (pure)
- Test: `src/lib/software/split-releases/split-releases.test.ts`

**Interfaces:**

- Consumes: `getPayloadClient` from `src/lib/payload/client`; `splitReleases`.
- Produces: `SoftwareRelease`, `SoftwareDownload` types; `findSoftwareDownloadsByIds`, `findSoftwareBySlug`, `findSoftwareDraftById`; `splitReleases` (see Interface Catalog).

- [ ] **Step 1: Write the failing test for `splitReleases`**

`src/lib/software/split-releases/split-releases.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { splitReleases } from './index';

import type { SoftwareRelease } from '@lib/payload/software';

const rel = (id: string, releasedAt: string, version: string): SoftwareRelease => ({ id, version, releasedAt, filename: `${id}.zip` });

describe('splitReleases', () => {
  it('returns undefined for an empty list', () => {
    expect(splitReleases([])).toBeUndefined();
  });

  it('picks the newest releasedAt as latest, rest as history (newest-first)', () => {
    const result = splitReleases([rel('1', '2026-01-01', '1.0.0'), rel('3', '2026-03-01', '1.2.0'), rel('2', '2026-02-01', '1.1.0')]);
    expect(result?.latest.id).toBe('3');
    expect(result?.history.map((r) => r.id)).toEqual(['2', '1']);
  });

  it('single release has empty history', () => {
    const result = splitReleases([rel('1', '2026-01-01', '1.0.0')]);
    expect(result?.latest.id).toBe('1');
    expect(result?.history).toEqual([]);
  });
});
```

- [ ] **Step 2: Run + verify fail**

Run: `pnpm vitest run src/lib/software/split-releases/split-releases.test.ts`
Expected: FAIL (no export `splitReleases`).

- [ ] **Step 3: Implement `splitReleases`**

`src/lib/software/split-releases/index.ts`:

```ts
import { dayjs } from '@utils/dayjs';

import type { SoftwareRelease } from '@lib/payload/software';

// Newest release (by releasedAt) is the primary download; the remainder is history,
// newest-first. Returns undefined when there are no releases (block renders nothing).
export const splitReleases = (releases: readonly SoftwareRelease[]): { latest: SoftwareRelease; history: readonly SoftwareRelease[] } | undefined => {
  const sorted = [...releases].sort((a, b) => dayjs(b.releasedAt).tz('Asia/Tokyo').valueOf() - dayjs(a.releasedAt).tz('Asia/Tokyo').valueOf());
  const [latest, ...history] = sorted;
  if (latest === undefined) return undefined;
  return { latest, history };
};
```

- [ ] **Step 4: Run + verify pass**

Run: `pnpm vitest run src/lib/software/split-releases/split-releases.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the mapper**

`src/lib/payload/software/to-software-download.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { toSoftwareRelease } from './to-software-download';

describe('toSoftwareRelease', () => {
  it('maps a populated release doc, coercing nullish changelog to undefined', () => {
    const result = toSoftwareRelease({ id: 7, version: '1.1.0', releasedAt: '2026-02-01T00:00:00.000Z', changelog: null, filename: 'app-1.1.0.zip' });
    expect(result).toEqual({ id: '7', version: '1.1.0', releasedAt: '2026-02-01T00:00:00.000Z', changelog: undefined, filename: 'app-1.1.0.zip' });
  });

  it('keeps a non-empty changelog', () => {
    const result = toSoftwareRelease({ id: 8, version: '1.2.0', releasedAt: '2026-03-01T00:00:00.000Z', changelog: 'fix bug', filename: 'app-1.2.0.zip' });
    expect(result.changelog).toBe('fix bug');
  });
});
```

- [ ] **Step 6: Run + verify fail**

Run: `pnpm vitest run src/lib/payload/software/to-software-download.test.ts`
Expected: FAIL.

- [ ] **Step 7: Implement the mappers**

`src/lib/payload/software/to-software-download.ts`:

```ts
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

import type { SoftwareDownload, SoftwareRelease } from './index';

// Wire shapes from Payload local API (NULLs allowed). Coerced to the domain types,
// which use `T?` only (function-arg-types.md).
type ReleaseDoc = { id: number | string; version: string; releasedAt: string; changelog?: string | null; filename?: string | null };
type SoftwareDoc = { id: number | string; name: string; summary: string; terms: SerializedEditorState };

export const toSoftwareRelease = (doc: ReleaseDoc): SoftwareRelease => ({
  id: `${doc.id}`,
  version: doc.version,
  releasedAt: doc.releasedAt,
  changelog: doc.changelog === null || doc.changelog === undefined || doc.changelog === '' ? undefined : doc.changelog,
  filename: doc.filename ?? '',
});

export const toSoftwareDownload = (doc: SoftwareDoc, latest: SoftwareRelease, history: readonly SoftwareRelease[]): SoftwareDownload => ({
  id: `${doc.id}`,
  name: doc.name,
  summary: doc.summary,
  terms: doc.terms,
  latest,
  history,
});
```

- [ ] **Step 8: Run + verify pass**

Run: `pnpm vitest run src/lib/payload/software/to-software-download.test.ts`
Expected: PASS.

- [ ] **Step 9: Implement the loaders (no unit test — thin payload glue, covered by integration)**

`src/lib/payload/software/index.ts`:

```ts
import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { splitReleases } from '@lib/software/split-releases';

import { toSoftwareDownload, toSoftwareRelease } from './to-software-download';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type SoftwareRelease = { id: string; version: string; releasedAt: string; changelog?: string; filename: string };
export type SoftwareDownload = {
  id: string;
  name: string;
  summary: string;
  terms: SerializedEditorState;
  latest: SoftwareRelease;
  history: readonly SoftwareRelease[];
};

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

const publishedWhere = { _status: { equals: 'published' } } as const;

// Build one SoftwareDownload from a software doc by querying its releases. Software
// docs with zero releases are skipped by the caller (latest === undefined). Releases
// are read with overrideAccess (admin-only collection) — the public never queries them.
const buildDownload = async (softwareId: string): Promise<SoftwareDownload | undefined> => {
  const payload = await getPayloadClient();
  const software = await payload.findByID({ collection: 'software', id: softwareId, overrideAccess: true });
  const releasesResult = await payload.find({
    collection: 'software-release',
    where: { software: { equals: softwareId } },
    overrideAccess: true,
    limit: 0,
  });
  const releases = releasesResult.docs.map(toSoftwareRelease);
  const split = splitReleases(releases);
  if (split === undefined) return undefined;
  return toSoftwareDownload(software, split.latest, split.history);
};

const fetchDownloadsByIds = unstable_cache(
  async (ids: readonly string[]): Promise<readonly [string, SoftwareDownload][]> => {
    const entries = await Promise.all(ids.map(async (id) => [id, await buildDownload(id)] as const));
    return entries.filter((entry): entry is [string, SoftwareDownload] => entry[1] !== undefined).map(([id, download]) => [id, download]);
  },
  ['software-downloads-by-ids'],
  { tags: [CACHE_TAGS.software] },
);

// Map of software id -> SoftwareDownload, omitting software with zero releases.
export const findSoftwareDownloadsByIds = async (ids: readonly string[]): Promise<ReadonlyMap<string, SoftwareDownload>> => {
  if (isBuildPhase() || ids.length === 0) return new Map();
  return new Map(await fetchDownloadsByIds(ids));
};

const fetchBySlug = unstable_cache(
  async (slug: string): Promise<SoftwareDownload | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({ collection: 'software', where: { and: [{ slug: { equals: slug } }, publishedWhere] }, limit: 1 });
    const [doc] = result.docs;
    if (doc === undefined) return undefined;
    return buildDownload(`${doc.id}`);
  },
  ['software-by-slug'],
  { tags: [CACHE_TAGS.software] },
);

export const findSoftwareBySlug = async (slug: string): Promise<SoftwareDownload | undefined> => {
  if (isBuildPhase()) return undefined;
  return fetchBySlug(slug);
};

// Uncached draft path for the secret-gated live-preview route only.
export const findSoftwareDraftById = async (id: string): Promise<SoftwareDownload | undefined> => {
  if (isBuildPhase()) return undefined;
  const payload = await getPayloadClient();
  const result = await payload.find({ collection: 'software', where: { id: { equals: id } }, draft: true, overrideAccess: true, limit: 1 });
  const [doc] = result.docs;
  if (doc === undefined) return undefined;
  return buildDownload(`${doc.id}`);
};
```

- [ ] **Step 10: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add src/lib/payload/software src/lib/software/split-releases
git commit -m "feat: software loaders + release split"
```

---

### Task 8: `collectSoftwareIds` — walk lexical body for block references (TDD)

**Files:**

- Create: `src/lib/software/collect-software-ids/index.ts`
- Test: `src/lib/software/collect-software-ids/collect-software-ids.test.ts`

**Interfaces:**

- Produces: `collectSoftwareIds(body?: SerializedEditorState): readonly string[]` — deduped software ids referenced by `software-download` blocks, regardless of whether the relationship is a populated object or a raw id.

- [ ] **Step 1: Write the failing test**

`src/lib/software/collect-software-ids/collect-software-ids.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { collectSoftwareIds } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const body = (children: unknown[]): SerializedEditorState =>
  ({ root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 } }) as unknown as SerializedEditorState;

const block = (software: unknown) => ({ type: 'block', fields: { blockType: 'software-download', software }, version: 1 });

describe('collectSoftwareIds', () => {
  it('returns [] for undefined body', () => {
    expect(collectSoftwareIds(undefined)).toEqual([]);
  });

  it('extracts ids from populated relationship objects', () => {
    expect(collectSoftwareIds(body([block({ id: 5 })]))).toEqual(['5']);
  });

  it('extracts ids from raw numeric/string references', () => {
    expect(collectSoftwareIds(body([block(7), block('8')]))).toEqual(['7', '8']);
  });

  it('dedupes and ignores non-software blocks', () => {
    expect(collectSoftwareIds(body([block(5), block(5), { type: 'block', fields: { blockType: 'image-row' }, version: 1 }]))).toEqual(['5']);
  });
});
```

- [ ] **Step 2: Run + verify fail**

Run: `pnpm vitest run src/lib/software/collect-software-ids/collect-software-ids.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/lib/software/collect-software-ids/index.ts`:

```ts
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// A software-download block's `software` field is either a populated object ({ id })
// or a raw id (number | string), depending on populate depth. Normalize to a string id.
const referenceId = (software: unknown): string | undefined => {
  if (typeof software === 'number' || typeof software === 'string') return `${software}`;
  if (isObject(software) && (typeof software.id === 'number' || typeof software.id === 'string')) return `${software.id}`;
  return undefined;
};

const idFromNode = (node: unknown): string | undefined => {
  if (!isObject(node) || node.type !== 'block' || !isObject(node.fields)) return undefined;
  if (node.fields.blockType !== 'software-download') return undefined;
  return referenceId(node.fields.software);
};

const childrenOf = (node: unknown): readonly unknown[] => (isObject(node) && Array.isArray(node.children) ? node.children : []);

// Depth-first walk collecting software ids from software-download blocks. Deduped,
// first-seen order preserved.
const walk = (node: unknown, seen: Set<string>): void => {
  const id = idFromNode(node);
  if (id !== undefined) seen.add(id);
  for (const child of childrenOf(node)) walk(child, seen);
};

export const collectSoftwareIds = (body?: SerializedEditorState): readonly string[] => {
  if (body === undefined) return [];
  const seen = new Set<string>();
  walk((body as unknown as { root: unknown }).root, seen);
  return [...seen];
};
```

- [ ] **Step 4: Run + verify pass**

Run: `pnpm vitest run src/lib/software/collect-software-ids/collect-software-ids.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/software/collect-software-ids
git commit -m "feat: collect software-download block references from lexical body"
```

---

### Task 9: Server Action `issueDownloadURL` (TDD)

**Files:**

- Create: `src/app/(site)/_actions/issue-download-url/index.ts` (`'use server'`)
- Create: `src/app/(site)/_actions/issue-download-url/build-download-url.ts` (pure URL builder)
- Test: `src/app/(site)/_actions/issue-download-url/build-download-url.test.ts`

**Interfaces:**

- Consumes: `signDownloadToken` (Task 6), `verifyTurnstile` (`@lib/contact/verify-turnstile`), `getCloudflareContext`.
- Produces: `issueDownloadURL(releaseId, token): Promise<{ url: string } | { error: string }>`; `buildDownloadURL({ releaseId, exp, sig }): string`.

- [ ] **Step 1: Write the failing test for the pure builder**

`src/app/(site)/_actions/issue-download-url/build-download-url.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { buildDownloadURL } from './build-download-url';

describe('buildDownloadURL', () => {
  it('encodes the release id, exp, and sig into the download path', () => {
    expect(buildDownloadURL({ releaseId: '42', exp: 1_900_000_000_000, sig: 'abc' })).toBe('/api/software/download?releaseId=42&exp=1900000000000&sig=abc');
  });
});
```

- [ ] **Step 2: Run + verify fail**

Run: `pnpm vitest run "src/app/(site)/_actions/issue-download-url/build-download-url.test.ts"`
Expected: FAIL.

- [ ] **Step 3: Implement the builder**

`src/app/(site)/_actions/issue-download-url/build-download-url.ts`:

```ts
type BuildDownloadURLInput = { releaseId: string; exp: number; sig: string };

// Build the gated download path. Use URLSearchParams so values are encoded once and
// the param order is stable (review feedback: build URLs structurally, not by hand).
export const buildDownloadURL = ({ releaseId, exp, sig }: BuildDownloadURLInput): string => {
  const params = new URLSearchParams({ releaseId, exp: `${exp}`, sig });
  return `/api/software/download?${params.toString()}`;
};
```

- [ ] **Step 4: Run + verify pass**

Run: `pnpm vitest run "src/app/(site)/_actions/issue-download-url/build-download-url.test.ts"`
Expected: PASS.

- [ ] **Step 5: Implement the action**

`src/app/(site)/_actions/issue-download-url/index.ts`:

```ts
'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { headers } from 'next/headers';

import { verifyTurnstile } from '@lib/contact/verify-turnstile';
import { signDownloadToken } from '@lib/software/download-token';

import { buildDownloadURL } from './build-download-url';

export type IssueDownloadResult = { url: string } | { error: string };

// Short-lived signed URL TTL. Long enough to start a navigation, short enough that a
// leaked URL is useless within seconds.
const DOWNLOAD_URL_TTL_MS = 60_000;

const resolveRemoteIp = async (): Promise<string | undefined> => {
  const headerList = await headers();
  return headerList.get('CF-Connecting-IP') ?? undefined;
};

// Verify the Turnstile token, then mint a signed, expiring URL pointing at the GET
// route. Returns an error string (never throws to the client) when verification fails.
export const issueDownloadURL = async (releaseId: string, token: string): Promise<IssueDownloadResult> => {
  const { env } = await getCloudflareContext({ async: true });
  const verified = await verifyTurnstile(token, env, await resolveRemoteIp());
  if (!verified) return { error: '認証を確認できませんでした。もう一度お試しください。' };

  const exp = Date.now() + DOWNLOAD_URL_TTL_MS;
  const sig = await signDownloadToken({ releaseId, exp }, env.PAYLOAD_SECRET);
  return { url: buildDownloadURL({ releaseId, exp, sig }) };
};
```

- [ ] **Step 6: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(site)/_actions/issue-download-url"
git commit -m "feat: issue-download-url server action"
```

---

### Task 10: GET Route Handler `/api/software/download` (TDD)

**Files:**

- Create: `src/app/api/software/download/route.ts`
- Create: `src/app/api/software/download/resolve-download.ts` (pure-ish: validates params + signature + expiry, returns a discriminated result)
- Test: `src/app/api/software/download/resolve-download.test.ts`

**Interfaces:**

- Consumes: `verifyDownloadToken` (Task 6).
- Produces: `resolveDownloadRequest(params, secret, now): Promise<{ ok: true; releaseId: string } | { ok: false }>`; the route streams from `env.R2`.

- [ ] **Step 1: Write the failing test for the resolver**

`src/app/api/software/download/resolve-download.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { signDownloadToken } from '@lib/software/download-token';

import { resolveDownloadRequest } from './resolve-download';

const SECRET = 'test-secret';
const NOW = 1_900_000_000_000;

const params = (entries: Record<string, string>): URLSearchParams => new URLSearchParams(entries);

describe('resolveDownloadRequest', () => {
  it('accepts a valid, unexpired, correctly-signed request', async () => {
    const exp = NOW + 10_000;
    const sig = await signDownloadToken({ releaseId: '42', exp }, SECRET);
    const result = await resolveDownloadRequest(params({ releaseId: '42', exp: `${exp}`, sig }), SECRET, NOW);
    expect(result).toEqual({ ok: true, releaseId: '42' });
  });

  it('rejects an expired request', async () => {
    const exp = NOW - 1;
    const sig = await signDownloadToken({ releaseId: '42', exp }, SECRET);
    expect(await resolveDownloadRequest(params({ releaseId: '42', exp: `${exp}`, sig }), SECRET, NOW)).toEqual({ ok: false });
  });

  it('rejects a bad signature', async () => {
    const exp = NOW + 10_000;
    expect(await resolveDownloadRequest(params({ releaseId: '42', exp: `${exp}`, sig: 'deadbeef' }), SECRET, NOW)).toEqual({ ok: false });
  });

  it('rejects missing params', async () => {
    expect(await resolveDownloadRequest(params({ releaseId: '42' }), SECRET, NOW)).toEqual({ ok: false });
  });
});
```

- [ ] **Step 2: Run + verify fail**

Run: `pnpm vitest run "src/app/api/software/download/resolve-download.test.ts"`
Expected: FAIL.

- [ ] **Step 3: Implement the resolver**

`src/app/api/software/download/resolve-download.ts`:

```ts
import { verifyDownloadToken } from '@lib/software/download-token';

export type ResolvedDownload = { ok: true; releaseId: string } | { ok: false };

// Validate the signed-URL params: all present, signature matches, not expired.
// `now` is injected for testability. Never throws — any malformed input -> { ok: false }.
export const resolveDownloadRequest = async (params: URLSearchParams, secret: string, now: number): Promise<ResolvedDownload> => {
  const releaseId = params.get('releaseId');
  const expRaw = params.get('exp');
  const sig = params.get('sig');
  if (releaseId === null || expRaw === null || sig === null) return { ok: false };

  const exp = parseInt(expRaw, 10);
  if (Number.isNaN(exp) || exp <= now) return { ok: false };

  const valid = await verifyDownloadToken({ releaseId, exp }, sig, secret);
  return valid ? { ok: true, releaseId } : { ok: false };
};
```

- [ ] **Step 4: Run + verify pass**

Run: `pnpm vitest run "src/app/api/software/download/resolve-download.test.ts"`
Expected: PASS (4 tests).

- [ ] **Step 5: Implement the route handler**

`src/app/api/software/download/route.ts`:

```ts
import { getCloudflareContext } from '@opennextjs/cloudflare';

import { getPayloadClient } from '@lib/payload/client';

import { resolveDownloadRequest } from './resolve-download';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const forbidden = (): Response => new Response('Forbidden', { status: 403 });

// R2 object key for a release file. Matches the storage-r2 `prefix: 'releases'` option
// (see payload.config.ts). If the prefix path was dropped in Task 2 Step 3, change this
// to `filename`.
const objectKey = (filename: string): string => `releases/${filename}`;

export const GET = async (request: NextRequest): Promise<Response> => {
  const { env } = await getCloudflareContext({ async: true });
  const resolved = await resolveDownloadRequest(request.nextUrl.searchParams, env.PAYLOAD_SECRET, Date.now());
  if (!resolved.ok) return forbidden();

  const payload = await getPayloadClient();
  const release = await payload.findByID({ collection: 'software-release', id: resolved.releaseId, overrideAccess: true }).catch(() => undefined);
  const filename = typeof release?.filename === 'string' ? release.filename : undefined;
  if (filename === undefined) return forbidden();

  const object = await env.R2.get(objectKey(filename));
  if (object === null) return forbidden();

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
};
```

- [ ] **Step 6: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/software/download
git commit -m "feat: gated software download route handler"
```

---

# Phase 3 — Rendering + UI

### Task 11: `SoftwareDownloadGate` client component (TDD, browser)

**Files:**

- Create: `src/components/software-download-gate/index.tsx` (`'use client'`)
- Create: `src/components/software-download-gate/styles.css.ts`
- Test: `src/components/software-download-gate/software-download-gate.test.tsx`

**Interfaces:**

- Consumes: `SoftwareDownload`/`SoftwareRelease` (Task 7), `issueDownloadURL` (Task 9), `@components/button`, `@components/rich-text` (terms), `@marsidev/react-turnstile`, react-aria-components (`DialogTrigger`, `Modal`, `Dialog`, `Checkbox`, `Disclosure`, `Heading`).
- Produces: `SoftwareDownloadGate({ software })`.

Behavior contract:

- Inline: heading (`software.name`), `summary`, a "最新 v{latest.version}" badge, a primary "ダウンロード" button, and a `Disclosure` "過去のバージョン" listing each history release as `v{version} · {releasedAt}` + a per-release "ダウンロード" button (only when `history.length > 0`).
- Clicking any download button opens a `Modal`+`Dialog` for that release id: terms (scroll region rendered via `RichText`), an agree `Checkbox`, the Turnstile widget, and a "ダウンロード" confirm button disabled until `agreed === true && token !== undefined`.
- Confirm handler (async `useCallback`): `const result = await issueDownloadURL(activeReleaseId, token); if ('url' in result) { window.location.href = result.url; } else { setError(result.error); }`.
- Turnstile token + agreement reset when the dialog closes/reopens — model with a `Disclosure`/Modal `isOpen` state and a keyed remount of the Turnstile widget (mirror contact's `key={attempt}` pattern; increment a local `attempt` on each open).
- Styling: data-attribute driven; tokens only; visible focus ring via global rule.

- [ ] **Step 1: Confirm react-aria component names + props**

Run: `grep -rn "export" node_modules/react-aria-components/dist/types.d.ts | grep -iE "Disclosure|Modal|Dialog|Checkbox" | head`
Expected: confirms `Disclosure`, `Modal`, `Dialog`, `DialogTrigger`, `Checkbox`, `Heading` exports. If `Disclosure` is absent in the installed version, use a `Button` + `useState` toggle for the history section (note which in the commit).

- [ ] **Step 2: Write the failing test**

`src/components/software-download-gate/software-download-gate.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SoftwareDownloadGate } from './index';

import type { SoftwareDownload } from '@lib/payload/software';

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (t: string) => void }) => (
    <button type="button" onClick={() => onSuccess('tok')}>
      solve-turnstile
    </button>
  ),
}));

const issueMock = vi.fn();
vi.mock('../../app/(site)/_actions/issue-download-url', () => ({ issueDownloadURL: (...args: unknown[]) => issueMock(...args) }));

const terms = { root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 } } as never;
const software: SoftwareDownload = {
  id: '1',
  name: 'napochaan-tool',
  summary: 'a tool',
  terms,
  latest: { id: '10', version: '1.1.0', releasedAt: '2026-02-01T00:00:00.000Z', filename: 'tool-1.1.0.zip' },
  history: [{ id: '9', version: '1.0.0', releasedAt: '2026-01-01T00:00:00.000Z', filename: 'tool-1.0.0.zip' }],
};

describe('SoftwareDownloadGate', () => {
  it('shows the product name and the latest version', () => {
    render(<SoftwareDownloadGate software={software} />);
    expect(screen.getByRole('heading', { name: /napochaan-tool/ })).toBeInTheDocument();
    expect(screen.getByText(/1\.1\.0/)).toBeInTheDocument();
  });

  it('keeps the dialog confirm disabled until agreed AND token present, then navigates to the issued url', async () => {
    issueMock.mockResolvedValue({ url: '/api/software/download?releaseId=10&exp=1&sig=x' });
    const user = userEvent.setup();
    // jsdom/browser: stub assignment target
    const hrefSetter = vi.fn();
    vi.stubGlobal('location', { set href(v: string) { hrefSetter(v); } });

    render(<SoftwareDownloadGate software={software} />);
    await user.click(screen.getAllByRole('button', { name: 'ダウンロード' })[0]);

    const confirm = screen.getByRole('button', { name: 'ダウンロード', hidden: false });
    expect(confirm).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'solve-turnstile' }));
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(issueMock).toHaveBeenCalledWith('10', 'tok');
    expect(hrefSetter).toHaveBeenCalledWith('/api/software/download?releaseId=10&exp=1&sig=x');
  });
});
```

> The test relies on the dialog being open; the exact role queries may need adjusting to the chosen react-aria structure. Treat the BEHAVIOR (disabled→enabled→navigate, `issueDownloadURL('10','tok')`) as the contract; adjust selectors to match the rendered DOM during Green.

- [ ] **Step 3: Run + verify fail**

Run: `pnpm vitest run src/components/software-download-gate/software-download-gate.test.tsx`
Expected: FAIL (no component).

- [ ] **Step 4: Implement the component + styles**

Build with react-aria-components. Key structure (fill styles with Panda tokens; this is the reference skeleton):

```tsx
'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useCallback, useState } from 'react';
import { Button as AriaButton, Checkbox, Dialog, DialogTrigger, Disclosure, DisclosurePanel, Heading, Modal } from 'react-aria-components';

import { Button } from '@components/button';
import { RichText } from '@components/rich-text';
import { dayjs } from '@utils/dayjs';

import { issueDownloadURL } from '../../app/(site)/_actions/issue-download-url';
import * as styles from './styles.css';

import type { SoftwareDownload, SoftwareRelease } from '@lib/payload/software';

const TURNSTILE_OPTIONS = { theme: 'auto', size: 'flexible' } as const;

type GateDialogProps = { release: SoftwareRelease; terms: SoftwareDownload['terms']; siteKey: string };

const GateDialog = ({ release, terms, siteKey }: GateDialogProps) => {
  const [agreed, setAgreed] = useState(false);
  const [token, setToken] = useState<string>();
  const [error, setError] = useState<string>();
  const clearToken = useCallback(() => setToken(undefined), []);

  const handleConfirm = useCallback(async () => {
    if (token === undefined) return;
    const result = await issueDownloadURL(release.id, token);
    if ('url' in result) {
      window.location.href = result.url;
      return;
    }
    setError(result.error);
  }, [release.id, token]);

  return (
    <Dialog className={styles.dialog}>
      <Heading slot="title" className={styles.dialogTitle}>利用規約への同意</Heading>
      <div className={styles.terms}><RichText data={terms} /></div>
      {error === undefined ? null : <p role="alert" className={styles.error}>{error}</p>}
      <Checkbox isSelected={agreed} onChange={setAgreed} className={styles.agree}>利用規約に同意する</Checkbox>
      <Turnstile siteKey={siteKey} onSuccess={setToken} onError={clearToken} onExpire={clearToken} options={TURNSTILE_OPTIONS} />
      <Button onPress={handleConfirm} isDisabled={!agreed || token === undefined}>ダウンロード</Button>
    </Dialog>
  );
};

export type SoftwareDownloadGateProps = { software: SoftwareDownload; turnstileSiteKey: string };

// One row's download trigger: opens the gate dialog for a specific release.
const DownloadButton = ({ release, terms, siteKey }: { release: SoftwareRelease; terms: SoftwareDownload['terms']; siteKey: string }) => (
  <DialogTrigger>
    <Button>ダウンロード</Button>
    <Modal className={styles.modal}><GateDialog release={release} terms={terms} siteKey={siteKey} /></Modal>
  </DialogTrigger>
);

export const SoftwareDownloadGate = ({ software, turnstileSiteKey }: SoftwareDownloadGateProps) => {
  return (
    <section className={styles.root} aria-label={`${software.name} のダウンロード`}>
      <Heading level={3} className={styles.name}>{software.name}</Heading>
      <p className={styles.summary}>{software.summary}</p>
      <div className={styles.latestRow}>
        <span className={styles.badge} data-latest>最新 v{software.latest.version}</span>
        <DownloadButton release={software.latest} terms={software.terms} siteKey={turnstileSiteKey} />
      </div>
      {software.history.length === 0 ? null : (
        <Disclosure className={styles.history}>
          <Heading><AriaButton slot="trigger" className={styles.historyTrigger}>過去のバージョン</AriaButton></Heading>
          <DisclosurePanel>
            <ul className={styles.historyList}>
              {software.history.map((release) => (
                <li key={release.id} className={styles.historyItem}>
                  <span>v{release.version} · {dayjs(release.releasedAt).tz('Asia/Tokyo').format('YYYY.MM.DD')}</span>
                  {release.changelog === undefined ? null : <p className={styles.changelog}>{release.changelog}</p>}
                  <DownloadButton release={release} terms={software.terms} siteKey={turnstileSiteKey} />
                </li>
              ))}
            </ul>
          </DisclosurePanel>
        </Disclosure>
      )}
    </section>
  );
};
```

> The Interface Catalog lists `SoftwareDownloadGateProps = { software }`; this implementation adds `turnstileSiteKey` because the site key is a server env value passed from the page/converter. Update the catalog reference in your head: `SoftwareDownloadGateProps = { software: SoftwareDownload; turnstileSiteKey: string }`. The converter (Task 12) supplies it.

Create `styles.css.ts` with Panda `css({...})` blocks for each class (`root`, `name`, `summary`, `latestRow`, `badge`, `dialog`, `dialogTitle`, `terms`, `agree`, `error`, `modal`, `history`, `historyTrigger`, `historyList`, `historyItem`, `changelog`), tokens only, WCAG AA contrast.

- [ ] **Step 5: Run + verify pass (adjust selectors to real DOM)**

Run: `pnpm vitest run src/components/software-download-gate/software-download-gate.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add src/components/software-download-gate
git commit -m "feat: software download gate (dialog + terms + turnstile)"
```

---

### Task 12: `software-download` converter + RichText converter factory

**Files:**

- Create: `src/components/rich-text/converters/software-download/index.tsx`
- Create: `src/components/rich-text/converters/software-download/styles.css.ts`
- Modify: `src/components/rich-text/converters/index.tsx` (turn into a factory accepting `softwareDownloads`)
- Modify: `src/components/rich-text/index.tsx` (accept optional `softwareDownloads` + `turnstileSiteKey` props, build converters via factory)
- Test: `src/components/rich-text/converters/software-download/software-download.test.tsx`

**Interfaces:**

- Consumes: `SoftwareDownload` map (Task 7), `SoftwareDownloadGate` (Task 11), `collectSoftwareIds` consumers (pages).
- Produces: `createJsxConverters({ softwareDownloads, turnstileSiteKey })`; `softwareDownloadBlockConverters` factory.

- [ ] **Step 1: Make converters a factory**

Rewrite `src/components/rich-text/converters/index.tsx` so the export is a factory closing over a `softwareDownloads` map + `turnstileSiteKey`:

```tsx
import { codeConverter } from './code';
import { headingConverter } from './heading';
import { hrConverter } from './hr';
import { imageRowBlockConverters } from './image-row';
import { linkConverter } from './link';
import { listConverter } from './list';
import { paragraphConverter } from './paragraph';
import { quoteConverter } from './quote';
import { createSoftwareDownloadBlockConverters } from './software-download';
import { tableConverter } from './table';
import { textConverter } from './text';
import { uploadConverter } from './upload';

import type { SoftwareDownload } from '@lib/payload/software';
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from './types';

export type ConverterContext = { softwareDownloads: ReadonlyMap<string, SoftwareDownload>; turnstileSiteKey: string };

export const createJsxConverters = (context: ConverterContext): JSXConvertersFunction<NodeTypes> => ({ defaultConverters }) => ({
  ...defaultConverters,
  ...paragraphConverter,
  ...headingConverter,
  ...textConverter,
  ...linkConverter,
  ...listConverter,
  ...quoteConverter,
  ...codeConverter,
  ...tableConverter,
  ...uploadConverter,
  ...hrConverter,
  blocks: { ...imageRowBlockConverters, ...createSoftwareDownloadBlockConverters(context) },
});
```

- [ ] **Step 2: Update RichText to use the factory**

`src/components/rich-text/index.tsx`:

```tsx
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react';

import { clsx } from '@utils/clsx';

import { createJsxConverters } from './converters';
import * as styles from './styles.css';

import type { SoftwareDownload } from '@lib/payload/software';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type Props = {
  readonly data: SerializedEditorState;
  readonly className?: string;
  readonly softwareDownloads?: ReadonlyMap<string, SoftwareDownload>;
  readonly turnstileSiteKey?: string;
};

const EMPTY: ReadonlyMap<string, SoftwareDownload> = new Map();

export const RichText = ({ data, className, softwareDownloads = EMPTY, turnstileSiteKey = '' }: Props) => {
  const converters = createJsxConverters({ softwareDownloads, turnstileSiteKey });
  return <PayloadRichText data={data} converters={converters} className={clsx(styles.root, className)} />;
};
```

> Note: `RichText` is rendered inside the client `GateDialog` (terms) with no map — `EMPTY` makes that a no-op for blocks, and terms never contain a software-download block. Recursion is impossible.

- [ ] **Step 3: Write the failing converter test**

`src/components/rich-text/converters/software-download/software-download.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createSoftwareDownloadBlockConverters } from './index';

import type { SoftwareDownload } from '@lib/payload/software';

vi.mock('@components/software-download-gate', () => ({
  SoftwareDownloadGate: ({ software }: { software: SoftwareDownload }) => <div>gate:{software.name}</div>,
}));

const terms = { root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 } } as never;
const download: SoftwareDownload = { id: '5', name: 'tool', summary: 's', terms, latest: { id: '1', version: '1.0.0', releasedAt: '2026-01-01', filename: 'a.zip' }, history: [] };

const renderBlock = (map: ReadonlyMap<string, SoftwareDownload>, software: unknown) => {
  const converters = createSoftwareDownloadBlockConverters({ softwareDownloads: map, turnstileSiteKey: 'site' });
  const node = { fields: { blockType: 'software-download', software } } as never;
  return render(<>{converters['software-download']({ node } as never)}</>);
};

describe('software-download converter', () => {
  it('renders the gate when the software id is in the map', () => {
    renderBlock(new Map([['5', download]]), { id: 5 });
    expect(screen.getByText('gate:tool')).toBeInTheDocument();
  });

  it('renders nothing when the software has no releases (absent from map)', () => {
    const { container } = renderBlock(new Map(), { id: 5 });
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 4: Run + verify fail**

Run: `pnpm vitest run src/components/rich-text/converters/software-download/software-download.test.tsx`
Expected: FAIL.

- [ ] **Step 5: Implement the converter**

`src/components/rich-text/converters/software-download/index.tsx`:

```tsx
import { SoftwareDownloadGate } from '@components/software-download-gate';

import type { ConverterContext } from '../index';
import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const referenceId = (software: unknown): string | undefined => {
  if (typeof software === 'number' || typeof software === 'string') return `${software}`;
  if (isObject(software) && (typeof software.id === 'number' || typeof software.id === 'string')) return `${software.id}`;
  return undefined;
};

// Renders the `software-download` block: looks the referenced product up in the
// loader-supplied map and shows its gate. Products with zero releases are absent from
// the map (and render nothing) — matching the "no release, no gate" rule.
export const createSoftwareDownloadBlockConverters = ({ softwareDownloads, turnstileSiteKey }: ConverterContext): NonNullable<JSXConverters<NodeTypes>['blocks']> => ({
  'software-download': ({ node }) => {
    const id = referenceId(node.fields.software);
    if (id === undefined) return null;
    const download = softwareDownloads.get(id);
    if (download === undefined) return null;
    return <SoftwareDownloadGate software={download} turnstileSiteKey={turnstileSiteKey} />;
  },
});
```

- [ ] **Step 6: Run + verify pass**

Run: `pnpm vitest run src/components/rich-text/converters/software-download/software-download.test.tsx`
Expected: PASS.

- [ ] **Step 7: Verify existing RichText tests still pass (factory refactor)**

Run: `pnpm vitest run src/components/rich-text`
Expected: PASS (existing tests unaffected by the optional-prop change).

- [ ] **Step 8: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add src/components/rich-text
git commit -m "feat: software-download converter + RichText converter factory"
```

---

### Task 13: Wire blog detail + create `/software/{slug}` detail page

**Files:**

- Modify: `src/app/(site)/blog/[slug]/page.tsx` (collect ids → load map → pass to `RichText`)
- Create: `src/app/(site)/software/[slug]/page.tsx`
- Create: `src/app/(site)/software/[slug]/_components/software-detail/index.tsx`
- Create: `src/app/(site)/software/[slug]/_components/software-detail/styles.css.ts`

**Interfaces:**

- Consumes: `collectSoftwareIds` (Task 8), `findSoftwareDownloadsByIds` / `findSoftwareBySlug` (Task 7), `RichText` (Task 12), `SoftwareDownloadGate` (Task 11), `env.TURNSTILE_SITE_KEY`.
- Produces: `/software/{slug}` page + reusable `SoftwareDetail` used by the preview route (Task 4).

- [ ] **Step 1: Thread software downloads into the blog detail page**

In `src/app/(site)/blog/[slug]/page.tsx`, inside `BlogDetailPage` after loading `post`, resolve the map and the site key, then pass both to `RichText`:

```tsx
import { getCloudflareContext } from '@opennextjs/cloudflare';

import { collectSoftwareIds } from '@lib/software/collect-software-ids';
import { findSoftwareDownloadsByIds } from '@lib/payload/software';
```

```tsx
  const softwareIds = collectSoftwareIds(post.body);
  const softwareDownloads = await findSoftwareDownloadsByIds(softwareIds);
  const { env } = await getCloudflareContext({ async: true });
```

```tsx
              <RichText data={post.body} softwareDownloads={softwareDownloads} turnstileSiteKey={env.TURNSTILE_SITE_KEY} />
```

- [ ] **Step 2: Create the SoftwareDetail component**

`src/app/(site)/software/[slug]/_components/software-detail/index.tsx` — renders the product page using the SAME gate. It receives a `SoftwareDownload` + site key:

```tsx
import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { SoftwareDownloadGate } from '@components/software-download-gate';

import * as s from './styles.css';

import type { SoftwareDownload } from '@lib/payload/software';

type Props = { software: SoftwareDownload; turnstileSiteKey: string };

const buildCrumbs = (name: string) => [{ href: '/', label: 'home' }, { label: name }];

export const SoftwareDetail = ({ software, turnstileSiteKey }: Props) => (
  <>
    <PageHeader title={software.name} breadcrumbs={buildCrumbs(software.name)} kicker="// software" titleTracking="tight" />
    <main className={s.root}>
      <section aria-label="概要">
        <h2 className={s.srOnly}>概要</h2>
        <p className={s.summary}>{software.summary}</p>
      </section>
      <SoftwareDownloadGate software={software} turnstileSiteKey={turnstileSiteKey} />
      <section aria-label="利用規約">
        <h2 className={s.termsHeading}>利用規約</h2>
        <RichText data={software.terms} />
      </section>
    </main>
  </>
);
```

`styles.css.ts`: `root`, `summary`, `termsHeading`, `srOnly` (use Panda `srOnly` pattern), tokens only.

- [ ] **Step 3: Create the route page**

`src/app/(site)/software/[slug]/page.tsx`:

```tsx
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { notFound } from 'next/navigation';

import { SoftwareDetail } from './_components/software-detail';

import { findSoftwareBySlug } from '@lib/payload/software';
import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';

import type { Metadata } from 'next';

export const revalidate = 3600;

type Params = Promise<{ slug: string }>;
type Props = { params: Params };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const software = await findSoftwareBySlug(slug);
  if (software === undefined) return { title: 'software', description: 'ソフトウェア' };
  return resolveDetailMetadata({
    docTitle: software.name,
    path: `/software/${slug}`,
    seo: undefined,
    body: software.terms,
    descriptionCandidates: [software.summary],
    genericDescription: 'ソフトウェア',
    defaultImage: '/og-default.png',
  });
};

const SoftwareDetailPage = async ({ params }: Props) => {
  const { slug } = await params;
  const software = await findSoftwareBySlug(slug);
  if (software === undefined) notFound();
  const { env } = await getCloudflareContext({ async: true });
  return <SoftwareDetail software={software} turnstileSiteKey={env.TURNSTILE_SITE_KEY} />;
};

export default SoftwareDetailPage;
```

> Read `src/app/(site)/blog/[slug]/page.tsx` for the `resolveDetailMetadata` arg shape; if `seo` is required and non-optional, pass the post-equivalent or extend the helper to accept `undefined` (it already coerces — verify). Adjust to the real signature.

- [ ] **Step 4: Verify the pages compile + render**

Run: `pnpm typecheck`
Expected: PASS.
Run: `pnpm vitest run src/app/\(site\)/blog` (if blog page has tests) — Expected: PASS.

- [ ] **Step 5: Complete Task 4 now** (SEO/livePreview/preview route) — its `SoftwareDetail` dependency exists.

Create `src/app/(site)/software/preview/[id]/page.tsx` mirroring `src/app/(site)/blog/preview/[id]/page.tsx`, using `findSoftwareDraftById` + `<SoftwareDetail software={...} turnstileSiteKey={env.TURNSTILE_SITE_KEY} />`. Apply Task 4 Steps 1–2 (payload.config seo + livePreview) now.

- [ ] **Step 6: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add "src/app/(site)/software" "src/app/(site)/blog/[slug]/page.tsx" src/payload.config.ts
git commit -m "feat: software detail + preview pages, blog block wiring"
```

---

### Task 14: Revalidation — blog reverse-bust on release change

**Files:**

- Modify: `src/collections/software-release.ts` (afterChange/afterDelete also revalidate blog paths embedding the software)
- Create: `src/lib/payload/software/find-embedding-blog-slugs.ts`
- Test: `src/lib/payload/software/find-embedding-blog-slugs.test.ts` (pure extraction part)

**Interfaces:**

- Consumes: `collectSoftwareIds` (Task 8).
- Produces: hook that busts `/software/{slug}` (already via Task 1) AND every `/blog/{slug}` whose body embeds the changed release's software.

- [ ] **Step 1: Write the failing test for the pure matcher**

`src/lib/payload/software/find-embedding-blog-slugs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { blogSlugsEmbeddingSoftware } from './find-embedding-blog-slugs';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const body = (softwareId: number): SerializedEditorState =>
  ({ root: { type: 'root', children: [{ type: 'block', fields: { blockType: 'software-download', software: softwareId }, version: 1 }], direction: null, format: '', indent: 0, version: 1 } }) as unknown as SerializedEditorState;

describe('blogSlugsEmbeddingSoftware', () => {
  it('returns slugs of posts whose body embeds the software id', () => {
    const posts = [{ slug: 'a', body: body(5) }, { slug: 'b', body: body(9) }, { slug: 'c', body: undefined }];
    expect(blogSlugsEmbeddingSoftware(posts, '5')).toEqual(['a']);
  });
});
```

- [ ] **Step 2: Run + verify fail**

Run: `pnpm vitest run src/lib/payload/software/find-embedding-blog-slugs.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the matcher + loader**

`src/lib/payload/software/find-embedding-blog-slugs.ts`:

```ts
import { collectSoftwareIds } from '@lib/software/collect-software-ids';

import { getPayloadClient } from '../client';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type BlogBody = { slug: string; body?: SerializedEditorState };

// Pure: which posts embed a given software id via a software-download block.
export const blogSlugsEmbeddingSoftware = (posts: readonly BlogBody[], softwareId: string): readonly string[] =>
  posts.filter((post) => collectSoftwareIds(post.body).includes(softwareId)).map((post) => post.slug);

// Loader: all blog slugs (published) whose body embeds the software id. Used by the
// release revalidate hook to bust the path-keyed ISR HTML of embedding articles.
export const findBlogSlugsEmbeddingSoftware = async (softwareId: string): Promise<readonly string[]> => {
  const payload = await getPayloadClient();
  const result = await payload.find({ collection: 'blog', where: { _status: { equals: 'published' } }, overrideAccess: true, limit: 0, depth: 0 });
  const posts = result.docs.map((doc) => ({ slug: `${doc.slug}`, body: doc.body as SerializedEditorState | undefined }));
  return blogSlugsEmbeddingSoftware(posts, softwareId);
};
```

- [ ] **Step 4: Run + verify pass**

Run: `pnpm vitest run src/lib/payload/software/find-embedding-blog-slugs.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the release hook to bust embedding blog paths**

Replace the release collection's hook with a custom one that, after busting the software tag, revalidates each embedding blog path. In `src/collections/software-release.ts`:

```ts
import { revalidatePath, revalidateTag } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';
import { findBlogSlugsEmbeddingSoftware } from '@lib/payload/software/find-embedding-blog-slugs';

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';
```

```ts
// Bust the software data tag, then the ISR HTML of every blog post embedding this
// release's software (the block renders the latest version, so a new release changes
// already-published articles). Swallow throws outside a request context (CLI seed).
const revalidateReleaseAndEmbedders = async (softwareRef: unknown): Promise<void> => {
  const softwareId = typeof softwareRef === 'object' && softwareRef !== null && 'id' in softwareRef ? `${(softwareRef as { id: unknown }).id}` : `${softwareRef}`;
  try {
    revalidateTag(CACHE_TAGS.software);
    const slugs = await findBlogSlugsEmbeddingSoftware(softwareId);
    for (const slug of slugs) revalidatePath(`/blog/${slug}`);
  } catch {
    // Outside a Next request context (CLI migrate/seed). Surfaces on next build.
  }
};

const afterChange: CollectionAfterChangeHook = async ({ doc }) => {
  await revalidateReleaseAndEmbedders(doc.software);
  return doc;
};
const afterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await revalidateReleaseAndEmbedders(doc.software);
  return doc;
};
```

Use these in the collection's `hooks` instead of `createTagRevalidateHooks`.

- [ ] **Step 6: Lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add src/collections/software-release.ts src/lib/payload/software/find-embedding-blog-slugs.ts src/lib/payload/software/find-embedding-blog-slugs.test.ts
git commit -m "feat: revalidate embedding blog posts on release change"
```

---

### Task 15: Colophon registration for the download gate

**Files:**

- Modify: `src/app/(site)/colophon/_demos/index.tsx` (add a `software-download-gate` demo)
- Modify: `src/app/(site)/colophon/content.ts` (add `components.items` entry)

**Interfaces:**

- Consumes: `SoftwareDownloadGate` (Task 11). Demo data is sample-only; the gate's download buttons in the demo must be inert.

- [ ] **Step 1: Read the colophon demo pattern**

Read `src/app/(site)/colophon/_demos/index.tsx` and `content.ts` to match the keyed structure (the key type is derived from content — a name without a demo, or a demo without a content entry, is a compile error).

- [ ] **Step 2: Add the content entry**

In `content.ts`, add to `components.items`:

```ts
  { name: 'SoftwareDownloadGate', why: 'ソフトウェア配布物のダウンロードゲート。利用規約への同意と Turnstile を経て署名付き URL を発行する。' },
```

- [ ] **Step 3: Add the demo**

In `_demos/index.tsx`, add a `SoftwareDownloadGate` demo keyed by the same name, with sample `SoftwareDownload` data (a latest + one history entry, minimal `terms`), and `turnstileSiteKey=""`. Per colophon rule, the demo's interactive download should not actually submit — wrap so the dialog opens but the confirm is a noaction (the demo passes an empty site key; document that the demo is presentational). If the gate's confirm could fire a server action in the demo, guard the demo copy with an `e.preventDefault` wrapper as the colophon rule requires for links.

- [ ] **Step 4: Typecheck (key-derivation compile check) + lint**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS (proves the name/demo/content triangle is consistent).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/colophon"
git commit -m "feat: register software download gate in colophon"
```

---

### Task 16: Full-suite verification

- [ ] **Step 1: Run the whole test suite**

Run: `pnpm vitest run`
Expected: all pass (new tests + existing unaffected).

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Manual smoke (user-run, optional)**

With `pnpm dev` running (user starts it — do not pkill workerd), in the admin: create a `software` (published) + two `software-release` docs, embed the block in a blog post, open `/blog/{slug}` and `/software/{slug}`, agree + solve Turnstile, confirm the download streams and a direct `/api/software/download?...` with a tampered `sig` returns 403.

---

## Self-Review

**Spec coverage (spec §→task):**

- §3.1 software collection → Task 1 ✓
- §3.2 software-release upload + admin-only read + R2 → Task 2 ✓
- §3.3 shared-reference model → Tasks 3, 8, 12 ✓
- §4 software-download block → Task 3 ✓
- §5 render data supply (approach A: loader → map → converter factory) → Tasks 7, 8, 12, 13 ✓
- §6 Server Action + signed URL + GET route → Tasks 6, 9, 10 ✓
- §6.1 public file URL blocked (admin-only read), PAYLOAD_SECRET key, R2 binding, verifyTurnstile reuse → Tasks 2, 9, 10 ✓
- §7 ISR revalidation incl. blog reverse-bust → Tasks 1, 14 ✓
- §8 react-aria Dialog UI (terms scroll + agree + Turnstile, disabled until ready) → Task 11 ✓
- §9 colophon registration → Task 15 ✓
- §10 payload checklist (register/seo/livePreview/migration/importmap/types) → Tasks 1,2,4,5 ✓
- §11 tests (signing, action, route, converter, split, gate) → Tasks 6,7,8,9,10,11,12 ✓
- §12 scope-out (no list page, no pin, plain changelog) → respected ✓

**Placeholder scan:** No "TBD/TODO". Two tasks contain explicit "verify against installed version and adjust" branches (Task 2 prefix, Task 11 react-aria export names, Task 13 metadata signature) — these are concrete fallbacks with commands, not placeholders.

**Type consistency:**

- `signDownloadToken`/`verifyDownloadToken` signatures identical across Tasks 6, 9, 10 ✓
- `SoftwareDownload`/`SoftwareRelease` shape identical across Tasks 7, 11, 12, 13 ✓
- `issueDownloadURL(releaseId, token)` returns `{ url } | { error }` — Task 9 def matches Task 11 consumer ✓
- `SoftwareDownloadGateProps` corrected to include `turnstileSiteKey` (noted in Task 11 + catalog) — consumers (Tasks 12, 13) pass it ✓
- `collectSoftwareIds` reused by Tasks 8, 14 ✓

**Naming (acronym rule):** `signDownloadToken`, `verifyDownloadToken`, `buildDownloadURL`, `issueDownloadURL`, `resolveDownloadRequest`, `collectSoftwareIds`, `findSoftwareDownloadsByIds` — `URL`/`ID` all-caps mid-identifier, `Ids` pluralized lowercase-s ✓
