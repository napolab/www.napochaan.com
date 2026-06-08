# CMS Collections + Per-Page RSS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `sample-*` data sources for `/works`, `/blog`, `/gallery`, `/log`, and `/about` with Payload CMS (four collections + one global), and add RSS feeds to every dynamic page.

**Architecture:** Each collection mirrors the proven `news` vertical slice — a `CollectionConfig` (Japanese labels, draft+autosave, published-only public access, revalidate hooks), an `unstable_cache`-wrapped query helper with a build-phase guard, and a pure `to-X-item` mapper (colocated test) that coerces Payload NULLs to `undefined` at the boundary. Pages swap their `sample-*` import for a `findXList()` call. RSS routes reuse `utils/rss/create-rss-document`. Sample content is preserved by seeding it through `payload.create()` inside migrations.

**Tech Stack:** Payload CMS 3.84 + D1 (sqlite) + R2 storage, Next.js 15 App Router (RSC + ISR), `@payloadcms/richtext-lexical`, `dayjs` (Asia/Tokyo), vitest browser mode, oxlint + oxfmt, tsgo typecheck.

**Worktree:** `.worktrees/cms-collections` on branch `feat/cms-collections` (already created from `main`; repo has no remote). Run all commands from the worktree root.

---

## Conventions for every task

- Run from the worktree root: `cd .worktrees/cms-collections` (or open that directory).
- Tests: vitest browser mode. Run a single file with `pnpm vitest run <path>`.
- After each code change that is not test-only, the closing check is `pnpm lint && pnpm typecheck`.
- Payload CLI needs `PAYLOAD_SECRET` in `.dev.vars` (already present) — never prefix the command with the secret.
- Auto-generated files (`src/payload-types.ts`, `src/app/(payload)/admin/importMap.js`, `migrations/*.ts`) are exempt from lint/style rules. Do not hand-fix their formatting.
- Domain types live with the page (`app/(site)/<page>/_lib/...`); mappers + helpers live under `src/lib/payload/<slug>/`. This matches `news`.
- Commit message convention ends with the Co-Authored-By trailer used in this repo. Do NOT push (no remote). Do NOT commit unless a step says so; the user controls cadence — but this plan front-loads commits per task per project TDD rules. If the user prefers to withhold commits, skip the commit steps.

---

## File Structure

**Phase 1 — shared infra (modify):**
- `src/utils/cache-tags/index.ts` — add `works`/`blog`/`gallery`/`logs`/`profile` tags.
- `src/utils/rss/types.ts` — add optional `enclosure` to `ItemData`.
- `src/utils/rss/create-rss-document/index.ts` — emit `<enclosure>` line.
- `src/utils/rss/create-rss-document/create-rss-document.test.ts` — enclosure coverage.

**Phase 2 — works:**
- Create `src/collections/works.ts`
- Create `src/lib/payload/works/to-work-item/index.ts` + `.test.ts`
- Create `src/lib/payload/works/index.ts`
- Modify `src/payload.config.ts` (register), regenerate types/importmap
- Modify `src/app/(site)/works/page.tsx`, `src/app/(site)/works/[id]/page.tsx`
- Create migration(s) under `migrations/`

**Phase 3 — blog:** same shape under `src/lib/payload/blog/`, `src/collections/blog.ts`, wire `blog/page.tsx` + `blog/[id]/page.tsx`.

**Phase 4 — gallery:** `src/collections/gallery.ts`, `src/lib/payload/gallery/`, wire `gallery/page.tsx`.

**Phase 5 — logs + timeline:** `src/collections/logs.ts`, `src/lib/payload/logs/`, extend `src/app/(site)/log/_lib/build-log-timeline/index.ts` (+ test), wire `log/page.tsx`.

**Phase 6 — about global:** `src/globals/profile.ts`, `src/lib/payload/profile/`, wire `about/page.tsx`.

**Phase 7 — RSS routes:** `src/app/(site)/{blog,works,log,gallery}/rss.xml/route.ts` (+ `to-item-data` where needed) and `<head>` alternate links.

**Phase 8 — seed migrations + final regen:** hand-written seed migrations using `payload.create()`; final `generate:types` + `generate:importmap`.

---

## Phase 1 — Shared infrastructure

### Task 1.1: Add cache tags for the new collections

**Files:**
- Modify: `src/utils/cache-tags/index.ts`

- [ ] **Step 1: Extend the CACHE_TAGS map**

Replace the object body so it reads:

```ts
export const CACHE_TAGS = {
  news: 'news',
  works: 'works',
  blog: 'blog',
  gallery: 'gallery',
  logs: 'logs',
  profile: 'profile',
} as const;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (no consumers broken — only additions).

- [ ] **Step 3: Commit**

```bash
git add src/utils/cache-tags/index.ts
git commit -m "feat(cache): add cache tags for works/blog/gallery/logs/profile"
```

### Task 1.2: Support `<enclosure>` in the RSS document builder (TDD)

**Files:**
- Modify: `src/utils/rss/types.ts`
- Modify: `src/utils/rss/create-rss-document/index.ts`
- Test: `src/utils/rss/create-rss-document/create-rss-document.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `create-rss-document.test.ts`:

```ts
it('emits an <enclosure> element when an item has one', () => {
  const xml = createRssDocument({
    channel: { title: 'g', link: 'https://x.test/gallery', description: 'd' },
    items: [
      {
        title: 'flyer',
        link: 'https://x.test/gallery',
        enclosure: { url: 'https://x.test/img.jpg', type: 'image/jpeg', length: 0 },
      },
    ],
  });

  expect(xml).toContain('<enclosure url="https://x.test/img.jpg" length="0" type="image/jpeg"/>');
});

it('omits <enclosure> when absent', () => {
  const xml = createRssDocument({
    channel: { title: 'g', link: 'https://x.test', description: 'd' },
    items: [{ title: 't', link: 'https://x.test/1' }],
  });

  expect(xml).not.toContain('<enclosure');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/utils/rss/create-rss-document/create-rss-document.test.ts`
Expected: FAIL — `enclosure` is not a known property of `ItemData` (type error) / element not emitted.

- [ ] **Step 3: Add the `enclosure` type**

In `src/utils/rss/types.ts`, add above `ItemData`:

```ts
// An RSS `<enclosure>` — a media file attached to an item (e.g. a gallery image).
// `length` is the file size in bytes; pass 0 when unknown (RSS allows it).
export type EnclosureData = {
  url: string;
  type: string;
  length: number;
};
```

Then add the field to `ItemData` (after `description`):

```ts
  description?: string;
  enclosure?: EnclosureData;
```

- [ ] **Step 4: Emit the enclosure line**

In `src/utils/rss/create-rss-document/index.ts`, inside `buildItem`, add after `descriptionLine`:

```ts
  const enclosureLine =
    item.enclosure === undefined
      ? undefined
      : `      <enclosure url="${escapeXml(item.enclosure.url)}" length="${item.enclosure.length}" type="${escapeXml(item.enclosure.type)}"/>`;
```

Then include it in the `lines` array (append `enclosureLine` after `descriptionLine`):

```ts
  const lines = [
    `      <title>${escapeXml(item.title)}</title>`,
    `      <link>${escapeXml(item.link)}</link>`,
    guidLine,
    pubDateLine,
    categoryLine,
    descriptionLine,
    enclosureLine,
  ].filter((line): line is string => line !== undefined);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run src/utils/rss/create-rss-document/create-rss-document.test.ts`
Expected: PASS (all cases, including the pre-existing ones).

- [ ] **Step 6: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/utils/rss/types.ts src/utils/rss/create-rss-document/
git commit -m "feat(rss): support <enclosure> for media items"
```

---

## Phase 2 — works collection

### Task 2.1: Define the `works` collection

**Files:**
- Create: `src/collections/works.ts`

- [ ] **Step 1: Write the collection definition**

```ts
import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Works feed the archive (`/works`), the detail page (`/works/{id}`), the home
// teaser, and the log chronicle. Busting CACHE_TAGS.works purges those reads via
// the unstable_cache tags; revalidatePath('/') and ('/works') cover the ISR HTML.
const revalidateWorks = createPublishedTagRevalidateHooks([CACHE_TAGS.works]);

export const Works = {
  slug: 'works',
  labels: { singular: '作品', plural: '作品' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'year', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateWorks.afterChange],
    afterDelete: [revalidateWorks.afterDelete],
  },
  fields: [
    { name: 'title', label: 'タイトル', type: 'text', required: true },
    {
      name: 'no',
      label: '表示番号',
      type: 'text',
      admin: { description: "'01' のような表示用の連番。未設定なら一覧の並び順から自動採番されます。" },
    },
    {
      name: 'type',
      label: '種別',
      type: 'select',
      required: true,
      options: [
        { label: 'グラフィック', value: 'graphic' },
        { label: 'VJ', value: 'vj' },
        { label: 'フライヤー', value: 'flyer' },
        { label: '開発', value: 'dev' },
        { label: '映像', value: 'video' },
        { label: 'VRChat', value: 'vrchat' },
        { label: '登壇', value: 'talk' },
        { label: 'サポート', value: 'support' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'year',
      label: '制作年',
      type: 'number',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'url',
      label: '外部リンク',
      type: 'text',
      admin: { description: '設定すると、一覧や年表のリンクが内部の詳細ページではなくこの URL を指します。' },
    },
    { name: 'thumbnail', label: 'サムネイル', type: 'upload', relationTo: 'media' },
    { name: 'description', label: '概要', type: 'textarea' },
    { name: 'body', label: '本文', type: 'richText' },
  ],
} satisfies CollectionConfig;
```

> Note: a `media` relationship from a `type: 'upload'` field is the Payload idiom for image references and gives the admin an upload/picker UI. `to-work-item` resolves it via `depth`.

- [ ] **Step 2: Register in `payload.config.ts`**

In `src/payload.config.ts`:
- Add import near the other collection imports: `import { Works } from './collections/works';`
- Change `collections: [Users, Media, News],` to `collections: [Users, Media, News, Works],`
- In `seoPlugin({ collections: ['news'], ... })` change to `collections: ['news', 'works']`.
- In `admin.livePreview`, add a `draftPreviewRoute` entry (mirror the `news` one):

```ts
        draftPreviewRoute({
          slug: 'works',
          previewSecret: cfEnv.PREVIEW_SECRET ?? '',
          buildPath: (data) => `/works/${data.id}`,
        }),
```
  and add `'works'` to the `collections: ['news']` array under `livePreview`.

- [ ] **Step 3: Generate types + import map**

Run:
```bash
pnpm payload generate:types
pnpm payload generate:importmap
```
Expected: `src/payload-types.ts` now exports a `Work` type; `importMap.js` updated. (These files are auto-generated; do not hand-edit.)

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/collections/works.ts src/payload.config.ts src/payload-types.ts src/app/\(payload\)/admin/importMap.js
git commit -m "feat(works): add works collection and register in payload config"
```

### Task 2.2: `to-work-item` mapper (TDD)

**Files:**
- Create: `src/lib/payload/works/to-work-item/index.ts`
- Test: `src/lib/payload/works/to-work-item/to-work-item.test.ts`

The existing domain type `WorkRow` (`src/app/(site)/works/_lib/work-row/index.ts`) is the target:
```ts
type WorkRow = { id: string; no: string; title: string; type: string; year: number; url?: string; thumbnail?: { src: string; width: number; height: number }; description?: string; body?: SerializedEditorState };
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { toWorkItem } from './index';

import type { Work } from '@payload-types';

const base = {
  id: 7,
  title: 'glitch study',
  type: 'graphic',
  year: 2025,
  updatedAt: '2025-01-01T00:00:00.000Z',
  createdAt: '2025-01-01T00:00:00.000Z',
} as unknown as Work;

describe('toWorkItem', () => {
  it('maps required fields and stringifies the id', () => {
    const row = toWorkItem(base, '03');
    expect(row.id).toBe('7');
    expect(row.no).toBe('03');
    expect(row.title).toBe('glitch study');
    expect(row.type).toBe('graphic');
    expect(row.year).toBe(2025);
  });

  it('coerces NULL url/description/body to undefined', () => {
    const row = toWorkItem({ ...base, url: null, description: null, body: null } as unknown as Work, '01');
    expect(row.url).toBeUndefined();
    expect(row.description).toBeUndefined();
    expect(row.body).toBeUndefined();
  });

  it('extracts thumbnail src/width/height from a populated media upload', () => {
    const withThumb = {
      ...base,
      thumbnail: { id: 1, alt: 'x', url: '/media/x.jpg', width: 800, height: 600, updatedAt: '', createdAt: '' },
    } as unknown as Work;
    const row = toWorkItem(withThumb, '01');
    expect(row.thumbnail).toEqual({ src: '/media/x.jpg', width: 800, height: 600 });
  });

  it('omits thumbnail when the upload is an unpopulated id or missing', () => {
    expect(toWorkItem({ ...base, thumbnail: 1 } as unknown as Work, '01').thumbnail).toBeUndefined();
    expect(toWorkItem(base, '01').thumbnail).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/payload/works/to-work-item/to-work-item.test.ts`
Expected: FAIL — `toWorkItem` not defined.

- [ ] **Step 3: Implement the mapper**

```ts
import type { WorkRow } from '../../../../app/(site)/works/_lib/work-row';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Media, Work } from '@payload-types';

// A populated media upload (depth >= 1) is an object with url/width/height; an
// unpopulated one is just the numeric id. Narrow to the object case.
const isPopulatedMedia = (value: unknown): value is Media =>
  typeof value === 'object' && value !== null && 'url' in value;

const toThumbnail = (thumbnail: Work['thumbnail']): WorkRow['thumbnail'] => {
  if (!isPopulatedMedia(thumbnail)) return undefined;
  if (thumbnail.url === null || thumbnail.url === undefined) return undefined;
  if (thumbnail.width === null || thumbnail.width === undefined) return undefined;
  if (thumbnail.height === null || thumbnail.height === undefined) return undefined;

  return { src: thumbnail.url, width: thumbnail.width, height: thumbnail.height };
};

// Maps a Payload `works` document to the site's `WorkRow`. `no` is supplied by the
// caller (derived from list order) since it is optional in the CMS. Payload NULLs
// are coerced to undefined at this boundary. Pure — unit-testable in isolation.
export const toWorkItem = (doc: Work, no: string): WorkRow => ({
  id: `${doc.id}`,
  no: doc.no ?? no,
  title: doc.title,
  type: doc.type,
  year: doc.year,
  url: doc.url ?? undefined,
  thumbnail: toThumbnail(doc.thumbnail),
  description: doc.description ?? undefined,
  body: (doc.body ?? undefined) as SerializedEditorState | undefined,
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/payload/works/to-work-item/to-work-item.test.ts`
Expected: PASS.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/payload/works/to-work-item/
git commit -m "feat(works): add to-work-item mapper"
```

### Task 2.3: works query helper

**Files:**
- Create: `src/lib/payload/works/index.ts`

This mirrors `src/lib/payload/news/index.ts` exactly, substituting: collection `works`, tag `CACHE_TAGS.works`, sort `-year`, mapper `toWorkItem`, and supplying the derived `no` from list index.

- [ ] **Step 1: Write the helper**

```ts
import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toWorkItem } from './to-work-item';

import type { WorkRow } from '../../../app/(site)/works/_lib/work-row';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

const publishedWhere = { _status: { equals: 'published' } } as const;

// Two-digit display ordinal from a zero-based index: 0 -> '01'.
const ordinal = (index: number): string => `${index + 1}`.padStart(2, '0');

const fetchWorksList = unstable_cache(
  async (): Promise<readonly WorkRow[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'works',
      where: publishedWhere,
      sort: '-year',
      depth: 1,
      limit: 0,
    });

    return result.docs.map((doc, index) => toWorkItem(doc, ordinal(index)));
  },
  ['works-list'],
  { tags: [CACHE_TAGS.works] },
);

export const findWorksList = async (): Promise<readonly WorkRow[]> => {
  if (isBuildPhase()) return [];

  return fetchWorksList();
};

const fetchWorkById = unstable_cache(
  async (id: string): Promise<WorkRow | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'works',
      where: { and: [{ id: { equals: id } }, publishedWhere] },
      depth: 1,
      limit: 1,
    });

    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return toWorkItem(doc, '01');
  },
  ['works-by-id'],
  { tags: [CACHE_TAGS.works] },
);

export const findWorkById = async (id: string): Promise<WorkRow | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchWorkById(id);
};
```

- [ ] **Step 2: Typecheck, commit**

```bash
pnpm typecheck
git add src/lib/payload/works/index.ts
git commit -m "feat(works): add works query helper"
```

### Task 2.4: Wire `/works` and `/works/[id]` to Payload

**Files:**
- Modify: `src/app/(site)/works/page.tsx`
- Modify: `src/app/(site)/works/[id]/page.tsx`

- [ ] **Step 1: Update the archive page**

In `src/app/(site)/works/page.tsx`:
- Remove `import { works } from './sample-works';`
- Add `import { findWorksList } from '@lib/payload/works';`
- Inside `WorksPage`, after `const { page: raw } = await searchParams;`, add `const works = await findWorksList();` (the rest of the pagination logic referencing `works` is unchanged).

- [ ] **Step 2: Update the detail page**

In `src/app/(site)/works/[id]/page.tsx`:
- Remove `import { works } from '../sample-works';` and `import { findWork } from '../_lib/find-work';`.
- Add `import { findWorkById } from '@lib/payload/works';` and `import { findWorksList } from '@lib/payload/works';`.
- Replace `generateStaticParams`:

```ts
export const generateStaticParams = async () => {
  const works = await findWorksList();
  return works.map((work) => ({ id: work.id }));
};
```
- In `generateMetadata`, replace `const work = findWork(works, id);` with `const work = await findWorkById(id);`.
- In the page component, replace `const work = findWork(works, id);` with `const work = await findWorkById(id);`. For `adjacentWorks`/`relatedWorks` (which need the full list), add `const works = await findWorksList();` before those calls. Keep the `if (work === undefined) notFound();` guard.

- [ ] **Step 3: Lint, typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS. (`find-work` may now be unused; if `relatedWorks`/`adjacentWorks` still import it that's fine. If `find-work` becomes entirely unused, leave it — it has a test and is harmless; removal is out of scope.)

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/works/page.tsx src/app/\(site\)/works/\[id\]/page.tsx
git commit -m "feat(works): wire /works pages to payload"
```

### Task 2.5: Schema migration for works

**Files:**
- Create: `migrations/*` (auto-generated)

- [ ] **Step 1: Create + apply the migration**

Run:
```bash
pnpm payload migrate:create works
pnpm payload migrate
```
Expected: a new `migrations/<timestamp>_works.ts` creating the `works` + `_works_v` tables; `migrate` applies it to the local D1 with no error.

- [ ] **Step 2: Commit**

```bash
git add migrations/
git commit -m "feat(works): add works schema migration"
```

> Sample content for works is seeded in Phase 8 (it depends on media records). Until then `/works` renders empty, which is expected.

---

## Phase 3 — blog collection

### Task 3.1: Define the `blog` collection

**Files:**
- Create: `src/collections/blog.ts`

- [ ] **Step 1: Write the collection definition**

```ts
import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Blog posts are self-authored articles (the home teaser + `/blog` + `/blog/{id}`).
// External RSS posts are NOT part of this collection — they stay in the log feed.
const revalidateBlog = createPublishedTagRevalidateHooks([CACHE_TAGS.blog]);

export const Blog = {
  slug: 'blog',
  labels: { singular: 'ブログ', plural: 'ブログ' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'source', 'publishedAt', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateBlog.afterChange],
    afterDelete: [revalidateBlog.afterDelete],
  },
  fields: [
    { name: 'title', label: 'タイトル', type: 'text', required: true },
    {
      name: 'source',
      label: 'クロス投稿先',
      type: 'select',
      required: true,
      options: [
        { label: 'Zenn', value: 'zenn' },
        { label: 'しずかなインターネット', value: 'sizu' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      label: '公開日',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    { name: 'excerpt', label: '抜粋', type: 'textarea', required: true },
    { name: 'body', label: '本文', type: 'richText', required: true },
  ],
} satisfies CollectionConfig;
```

- [ ] **Step 2: Register in `payload.config.ts`**

- Import: `import { Blog } from './collections/blog';`
- `collections: [Users, Media, News, Works, Blog],`
- SEO: `collections: ['news', 'works', 'blog']`
- livePreview: add a `draftPreviewRoute` with `slug: 'blog'`, `buildPath: (data) => `/blog/${data.id}``, and `'blog'` in the `collections` array.

- [ ] **Step 3: Generate types + importmap, typecheck, commit**

```bash
pnpm payload generate:types
pnpm payload generate:importmap
pnpm typecheck
git add src/collections/blog.ts src/payload.config.ts src/payload-types.ts src/app/\(payload\)/admin/importMap.js
git commit -m "feat(blog): add blog collection and register in payload config"
```

### Task 3.2: `to-blog-post` mapper (TDD)

**Files:**
- Create: `src/lib/payload/blog/to-blog-post/index.ts`
- Test: `src/lib/payload/blog/to-blog-post/to-blog-post.test.ts`

Target domain type `Post` (`src/app/(site)/blog/_lib/post/index.ts`):
```ts
type Post = { id: string; index: string; title: string; source: string; readMin: number; date: string; excerpt: string; body?: SerializedEditorState };
```
`readMin` is derived from the body via `readingMinutes(extractPlainText(body))`; `index` is the caller-supplied ordinal.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { toBlogPost } from './index';

import type { Blog } from '@payload-types';

// A lexical body with ~10 chars of text → readingMinutes returns 1 (min).
const body = {
  root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: '十文字ほどの本文' }] }] },
} as unknown as Blog['body'];

const base = {
  id: 3,
  title: 'Panda CSS で作る design token',
  source: 'zenn',
  publishedAt: '2026-05-10T00:00:00.000Z',
  excerpt: 'OKLCH の話',
  body,
  updatedAt: '',
  createdAt: '',
} as unknown as Blog;

describe('toBlogPost', () => {
  it('maps fields, stringifies id, formats date as YYYY-MM-DD', () => {
    const post = toBlogPost(base, '02');
    expect(post.id).toBe('3');
    expect(post.index).toBe('02');
    expect(post.title).toBe('Panda CSS で作る design token');
    expect(post.source).toBe('zenn');
    expect(post.date).toBe('2026-05-10');
    expect(post.excerpt).toBe('OKLCH の話');
  });

  it('derives readMin from the body (minimum 1)', () => {
    expect(toBlogPost(base, '01').readMin).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/payload/blog/to-blog-post/to-blog-post.test.ts`
Expected: FAIL — `toBlogPost` not defined.

- [ ] **Step 3: Implement the mapper**

```ts
import { extractPlainText } from '../../../../app/(site)/news/rss.xml/extract-plain-text';
import { dayjs } from '@utils/dayjs';
import { readingMinutes } from '@utils/reading-minutes';

import type { Post } from '../../../../app/(site)/blog/_lib/post';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Blog } from '@payload-types';

// Maps a Payload `blog` document to the site's `Post`. `index` is the caller's
// display ordinal. `readMin` is derived from the body text (never stored), so it
// always matches the content. Pure.
export const toBlogPost = (doc: Blog, index: string): Post => {
  const body = (doc.body ?? undefined) as SerializedEditorState | undefined;

  return {
    id: `${doc.id}`,
    index,
    title: doc.title,
    source: doc.source,
    date: dayjs(doc.publishedAt).tz('Asia/Tokyo').format('YYYY-MM-DD'),
    excerpt: doc.excerpt,
    readMin: readingMinutes(extractPlainText(body)),
    body,
  };
};
```

> `extractPlainText` currently lives under `news/rss.xml/extract-plain-text`. If importing across page folders is undesirable, an optional refactor is to move it to `src/utils/extract-plain-text/` and update the two import sites; that move is OUT OF SCOPE here — import from its current location.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/payload/blog/to-blog-post/to-blog-post.test.ts`
Expected: PASS.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/payload/blog/to-blog-post/
git commit -m "feat(blog): add to-blog-post mapper"
```

### Task 3.3: blog query helper

**Files:**
- Create: `src/lib/payload/blog/index.ts`

- [ ] **Step 1: Write the helper**

```ts
import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toBlogPost } from './to-blog-post';

import type { Post } from '../../../app/(site)/blog/_lib/post';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

const publishedWhere = { _status: { equals: 'published' } } as const;

const ordinal = (index: number): string => `${index + 1}`.padStart(2, '0');

const fetchBlogList = unstable_cache(
  async (): Promise<readonly Post[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'blog',
      where: publishedWhere,
      sort: '-publishedAt',
      limit: 0,
    });

    return result.docs.map((doc, index) => toBlogPost(doc, ordinal(index)));
  },
  ['blog-list'],
  { tags: [CACHE_TAGS.blog] },
);

export const findBlogList = async (): Promise<readonly Post[]> => {
  if (isBuildPhase()) return [];

  return fetchBlogList();
};

const fetchBlogById = unstable_cache(
  async (id: string): Promise<Post | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'blog',
      where: { and: [{ id: { equals: id } }, publishedWhere] },
      limit: 1,
    });

    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return toBlogPost(doc, '01');
  },
  ['blog-by-id'],
  { tags: [CACHE_TAGS.blog] },
);

export const findBlogById = async (id: string): Promise<Post | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchBlogById(id);
};
```

- [ ] **Step 2: Typecheck, commit**

```bash
pnpm typecheck
git add src/lib/payload/blog/index.ts
git commit -m "feat(blog): add blog query helper"
```

### Task 3.4: Wire `/blog` and `/blog/[id]`

**Files:**
- Modify: `src/app/(site)/blog/page.tsx`
- Modify: `src/app/(site)/blog/[id]/page.tsx`

- [ ] **Step 1: Update the feed page**

In `src/app/(site)/blog/page.tsx`:
- Remove `import { posts } from './sample-posts';`
- Add `import { findBlogList } from '@lib/payload/blog';`
- Replace the module-scope `const sortedPosts = [...posts].sort(...)` with an in-component fetch. Inside the page component (it is `async`), add at the top:

```ts
const posts = await findBlogList();
const sortedPosts = [...posts].sort((a, b) => dayjs(b.date).tz('Asia/Tokyo').valueOf() - dayjs(a.date).tz('Asia/Tokyo').valueOf());
```
  (Move the sort inside the component since it now depends on a fetched value. Keep the existing pagination logic that slices `sortedPosts`.)

- [ ] **Step 2: Update the detail page**

In `src/app/(site)/blog/[id]/page.tsx`:
- Remove `import { posts } from '../sample-posts';` and `import { findPost } from '../_lib/find-post';`.
- Add `import { findBlogById, findBlogList } from '@lib/payload/blog';`.
- Replace `generateStaticParams`:

```ts
export const generateStaticParams = async () => {
  const posts = await findBlogList();
  return posts.map((post) => ({ id: post.id }));
};
```
- In `generateMetadata`, replace `const post = findPost(posts, id);` with `const post = await findBlogById(id);`.
- In the component, replace `const post = findPost(posts, id);` with `const post = await findBlogById(id);`. Where `adjacentPosts` needs the full list, add `const posts = await findBlogList();`. Keep the `notFound()` guard.

- [ ] **Step 3: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/blog/page.tsx src/app/\(site\)/blog/\[id\]/page.tsx
git commit -m "feat(blog): wire /blog pages to payload"
```

### Task 3.5: Schema migration for blog

- [ ] **Step 1: Create + apply**

```bash
pnpm payload migrate:create blog
pnpm payload migrate
```

- [ ] **Step 2: Commit**

```bash
git add migrations/
git commit -m "feat(blog): add blog schema migration"
```

---

## Phase 4 — gallery collection

### Task 4.1: Define the `gallery` collection

**Files:**
- Create: `src/collections/gallery.ts`

- [ ] **Step 1: Write the collection definition**

```ts
import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Gallery photos feed `/gallery` (skyline masonry) and the home teaser. The image
// is a media upload; width/height/alt come from the media record.
const revalidateGallery = createPublishedTagRevalidateHooks([CACHE_TAGS.gallery]);

export const Gallery = {
  slug: 'gallery',
  labels: { singular: 'ギャラリー', plural: 'ギャラリー' },
  admin: {
    useAsTitle: 'caption',
    defaultColumns: ['caption', 'order', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateGallery.afterChange],
    afterDelete: [revalidateGallery.afterDelete],
  },
  fields: [
    { name: 'image', label: '画像', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', label: 'キャプション', type: 'text', admin: { description: "'flyer / 05.23' のような短い表示ラベル。" } },
    { name: 'alt', label: '代替テキスト（上書き）', type: 'text', admin: { description: '空なら画像（media）側の alt を使います。' } },
    { name: 'order', label: '並び順', type: 'number', admin: { position: 'sidebar', description: '昇順。masonry の表示順。未設定は最後。' } },
  ],
} satisfies CollectionConfig;
```

- [ ] **Step 2: Register in `payload.config.ts`**

- Import: `import { Gallery } from './collections/gallery';`
- `collections: [Users, Media, News, Works, Blog, Gallery],`
- SEO: `collections: ['news', 'works', 'blog', 'gallery']`
- livePreview: gallery has no detail route — add a `draftPreviewRoute` with `slug: 'gallery'`, `buildPath: () => '/gallery'`, and `'gallery'` in `collections`.

- [ ] **Step 3: Generate types + importmap, typecheck, commit**

```bash
pnpm payload generate:types
pnpm payload generate:importmap
pnpm typecheck
git add src/collections/gallery.ts src/payload.config.ts src/payload-types.ts src/app/\(payload\)/admin/importMap.js
git commit -m "feat(gallery): add gallery collection and register in payload config"
```

### Task 4.2: `to-gallery-photo` mapper (TDD)

**Files:**
- Create: `src/lib/payload/gallery/to-gallery-photo/index.ts`
- Test: `src/lib/payload/gallery/to-gallery-photo/to-gallery-photo.test.ts`

Target `GalleryPhoto` (`@components/gallery-archive`):
```ts
type GalleryPhoto = { id: string; src: string; width: number; height: number; alt: string; caption: string };
```
The mapper returns `GalleryPhoto | undefined` (undefined when the image is unpopulated / missing dimensions), so the helper can filter.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { toGalleryPhoto } from './index';

import type { Gallery } from '@payload-types';

const media = { id: 1, alt: 'media alt', url: '/media/x.jpg', width: 800, height: 600, updatedAt: '', createdAt: '' };

const base = { id: 5, image: media, updatedAt: '', createdAt: '' } as unknown as Gallery;

describe('toGalleryPhoto', () => {
  it('maps media src/width/height and falls back to media.alt', () => {
    const photo = toGalleryPhoto(base);
    expect(photo).toEqual({ id: '5', src: '/media/x.jpg', width: 800, height: 600, alt: 'media alt', caption: '' });
  });

  it('prefers the gallery alt override and caption when set', () => {
    const photo = toGalleryPhoto({ ...base, alt: 'override', caption: 'flyer' } as unknown as Gallery);
    expect(photo?.alt).toBe('override');
    expect(photo?.caption).toBe('flyer');
  });

  it('returns undefined when the image is an unpopulated id', () => {
    expect(toGalleryPhoto({ ...base, image: 1 } as unknown as Gallery)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/payload/gallery/to-gallery-photo/to-gallery-photo.test.ts`
Expected: FAIL — `toGalleryPhoto` not defined.

- [ ] **Step 3: Implement the mapper**

```ts
import type { GalleryPhoto } from '@components/gallery-archive';
import type { Gallery, Media } from '@payload-types';

const isPopulatedMedia = (value: unknown): value is Media =>
  typeof value === 'object' && value !== null && 'url' in value;

// Maps a Payload `gallery` document to a `GalleryPhoto`. Returns undefined when
// the image upload is unpopulated or lacks usable dimensions, so the caller can
// drop incomplete rows. alt prefers the per-entry override, then the media alt.
export const toGalleryPhoto = (doc: Gallery): GalleryPhoto | undefined => {
  if (!isPopulatedMedia(doc.image)) return undefined;
  const { url, width, height, alt } = doc.image;
  if (url === null || url === undefined) return undefined;
  if (width === null || width === undefined) return undefined;
  if (height === null || height === undefined) return undefined;

  return {
    id: `${doc.id}`,
    src: url,
    width,
    height,
    alt: doc.alt ?? alt ?? '',
    caption: doc.caption ?? '',
  };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/payload/gallery/to-gallery-photo/to-gallery-photo.test.ts`
Expected: PASS.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/lib/payload/gallery/to-gallery-photo/
git commit -m "feat(gallery): add to-gallery-photo mapper"
```

### Task 4.3: gallery query helper

**Files:**
- Create: `src/lib/payload/gallery/index.ts`

- [ ] **Step 1: Write the helper**

```ts
import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toGalleryPhoto } from './to-gallery-photo';

import type { GalleryPhoto } from '@components/gallery-archive';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

const publishedWhere = { _status: { equals: 'published' } } as const;

const fetchGalleryList = unstable_cache(
  async (): Promise<readonly GalleryPhoto[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'gallery',
      where: publishedWhere,
      sort: 'order',
      depth: 1,
      limit: 0,
    });

    return result.docs.map(toGalleryPhoto).filter((photo): photo is GalleryPhoto => photo !== undefined);
  },
  ['gallery-list'],
  { tags: [CACHE_TAGS.gallery] },
);

export const findGalleryList = async (): Promise<readonly GalleryPhoto[]> => {
  if (isBuildPhase()) return [];

  return fetchGalleryList();
};
```

- [ ] **Step 2: Typecheck, commit**

```bash
pnpm typecheck
git add src/lib/payload/gallery/index.ts
git commit -m "feat(gallery): add gallery query helper"
```

### Task 4.4: Wire `/gallery`

**Files:**
- Modify: `src/app/(site)/gallery/page.tsx`

- [ ] **Step 1: Update the page**

- Remove `import { galleryPhotos } from './sample-gallery';`
- Add `import { findGalleryList } from '@lib/payload/gallery';`
- Make `GalleryPage` `async` and add `const galleryPhotos = await findGalleryList();` at the top. The `GalleryArchive` expects a mutable `GalleryPhoto[]`; if its prop type is `GalleryPhoto[]` (not `readonly`), pass `[...galleryPhotos]`. Verify the prop type in `@components/gallery-archive`; the helper returns `readonly GalleryPhoto[]`, so spread to a fresh array at the call site: `<GalleryArchive photos={[...galleryPhotos]} />`.

- [ ] **Step 2: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/gallery/page.tsx
git commit -m "feat(gallery): wire /gallery to payload"
```

### Task 4.5: Schema migration for gallery

- [ ] **Step 1: Create + apply**

```bash
pnpm payload migrate:create gallery
pnpm payload migrate
```

- [ ] **Step 2: Commit**

```bash
git add migrations/
git commit -m "feat(gallery): add gallery schema migration"
```

---

## Phase 5 — logs collection + timeline integration

### Task 5.1: Define the `logs` collection

**Files:**
- Create: `src/collections/logs.ts`

- [ ] **Step 1: Write the collection definition**

```ts
import { CACHE_TAGS } from '@utils/cache-tags';

import { createPublishedTagRevalidateHooks } from './hooks/revalidate';

import type { CollectionConfig } from 'payload';

// Manual chronicle entries merged into the /log timeline alongside the derived
// news/works/external-post entries — for milestones that none of those cover.
const revalidateLogs = createPublishedTagRevalidateHooks([CACHE_TAGS.logs]);

export const Logs = {
  slug: 'logs',
  labels: { singular: '年表エントリ', plural: '年表エントリ' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'meta', '_status'],
  },
  access: {
    read: ({ req: { user } }) => (user !== null ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => user !== null,
    update: ({ req: { user } }) => user !== null,
    delete: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [revalidateLogs.afterChange],
    afterDelete: [revalidateLogs.afterDelete],
  },
  fields: [
    { name: 'title', label: 'タイトル', type: 'text', required: true },
    {
      name: 'date',
      label: '日付',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' } },
    },
    { name: 'meta', label: 'メタラベル', type: 'text', required: true, admin: { description: "年表に表示する種別ラベル（例: 'milestone'）。" } },
    { name: 'url', label: '外部リンク', type: 'text', admin: { description: '設定するとタイトルがこの URL へのリンクになります。' } },
  ],
} satisfies CollectionConfig;
```

- [ ] **Step 2: Register in `payload.config.ts`**

- Import: `import { Logs } from './collections/logs';`
- `collections: [Users, Media, News, Works, Blog, Gallery, Logs],`
- SEO: `collections: ['news', 'works', 'blog', 'gallery', 'logs']`
- livePreview: add `slug: 'logs'`, `buildPath: () => '/log'`, and `'logs'` in `collections`.

- [ ] **Step 3: Generate types + importmap, typecheck, commit**

```bash
pnpm payload generate:types
pnpm payload generate:importmap
pnpm typecheck
git add src/collections/logs.ts src/payload.config.ts src/payload-types.ts src/app/\(payload\)/admin/importMap.js
git commit -m "feat(logs): add logs collection and register in payload config"
```

### Task 5.2: logs domain type + mapper + helper

**Files:**
- Create: `src/app/(site)/log/_lib/log-manual-item/index.ts`
- Create: `src/lib/payload/logs/to-log-manual-item/index.ts` + `.test.ts`
- Create: `src/lib/payload/logs/index.ts`

- [ ] **Step 1: Define the domain type**

`src/app/(site)/log/_lib/log-manual-item/index.ts`:

```ts
// A manual chronicle entry authored in the `logs` collection. Merged into the
// timeline by buildLogTimeline. `date` is ISO (YYYY-MM-DD); `url` optional.
export type LogManualItem = {
  id: string;
  title: string;
  date: string;
  meta: string;
  url?: string;
};
```

- [ ] **Step 2: Write the failing mapper test**

`src/lib/payload/logs/to-log-manual-item/to-log-manual-item.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { toLogManualItem } from './index';

import type { Log } from '@payload-types';

const base = { id: 2, title: 'サイト公開', date: '2026-06-01T00:00:00.000Z', meta: 'milestone', updatedAt: '', createdAt: '' } as unknown as Log;

describe('toLogManualItem', () => {
  it('maps fields, stringifies id, formats date YYYY-MM-DD', () => {
    const item = toLogManualItem(base);
    expect(item).toEqual({ id: '2', title: 'サイト公開', date: '2026-06-01', meta: 'milestone', url: undefined });
  });

  it('coerces NULL url to undefined', () => {
    expect(toLogManualItem({ ...base, url: null } as unknown as Log).url).toBeUndefined();
  });
});
```

> Note: the Payload generated type for the `logs` collection is named `Log` (singular of slug `logs`). Confirm the exact exported name in `src/payload-types.ts` after Task 5.1 and adjust the import if Payload pluralizes differently.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/payload/logs/to-log-manual-item/to-log-manual-item.test.ts`
Expected: FAIL — `toLogManualItem` not defined.

- [ ] **Step 4: Implement the mapper**

`src/lib/payload/logs/to-log-manual-item/index.ts`:

```ts
import { dayjs } from '@utils/dayjs';

import type { LogManualItem } from '../../../../app/(site)/log/_lib/log-manual-item';
import type { Log } from '@payload-types';

// Maps a Payload `logs` document to a LogManualItem. NULL url coerced at this
// boundary. Pure.
export const toLogManualItem = (doc: Log): LogManualItem => ({
  id: `${doc.id}`,
  title: doc.title,
  date: dayjs(doc.date).tz('Asia/Tokyo').format('YYYY-MM-DD'),
  meta: doc.meta,
  url: doc.url ?? undefined,
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/payload/logs/to-log-manual-item/to-log-manual-item.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the helper**

`src/lib/payload/logs/index.ts`:

```ts
import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toLogManualItem } from './to-log-manual-item';

import type { LogManualItem } from '../../../app/(site)/log/_lib/log-manual-item';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

const publishedWhere = { _status: { equals: 'published' } } as const;

const fetchLogList = unstable_cache(
  async (): Promise<readonly LogManualItem[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'logs',
      where: publishedWhere,
      sort: '-date',
      limit: 0,
    });

    return result.docs.map(toLogManualItem);
  },
  ['logs-list'],
  { tags: [CACHE_TAGS.logs] },
);

export const findLogList = async (): Promise<readonly LogManualItem[]> => {
  if (isBuildPhase()) return [];

  return fetchLogList();
};
```

- [ ] **Step 7: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/log/_lib/log-manual-item/ src/lib/payload/logs/
git commit -m "feat(logs): add log-manual-item type, mapper, and query helper"
```

### Task 5.3: Extend `buildLogTimeline` to merge manual entries (TDD)

**Files:**
- Modify: `src/app/(site)/log/_lib/build-log-timeline/index.ts`
- Test: `src/app/(site)/log/_lib/build-log-timeline/build-log-timeline.test.ts` (create if absent, else append)

- [ ] **Step 1: Write the failing test**

Append (or create) test cases:

```ts
import { describe, expect, it } from 'vitest';

import { buildLogTimeline } from './index';

import type { LogManualItem } from '../log-manual-item';

const now = '2026-06-09T00:00:00.000Z';

describe('buildLogTimeline manual entries', () => {
  it('merges manual log entries into the correct year, sorted by date desc', () => {
    const logs: LogManualItem[] = [{ id: '1', title: 'サイト公開', date: '2026-06-01', meta: 'milestone', url: 'https://napochaan.com' }];
    const groups = buildLogTimeline([], [], [], now, logs);
    const y2026 = groups.find((g) => g.year === 2026);
    expect(y2026).toBeDefined();
    const entry = y2026?.items.find((i) => i.id === 'log-1');
    expect(entry).toMatchObject({ title: 'サイト公開', date: '06.01', meta: 'milestone', upcoming: false, href: 'https://napochaan.com' });
  });

  it('keeps working when no manual entries are passed (default param)', () => {
    expect(() => buildLogTimeline([], [], [], now)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/app/\(site\)/log/_lib/build-log-timeline/build-log-timeline.test.ts`
Expected: FAIL — `buildLogTimeline` accepts only 4 args / `log-1` entry not present.

- [ ] **Step 3: Implement the extension**

In `src/app/(site)/log/_lib/build-log-timeline/index.ts`:
- Add import: `import type { LogManualItem } from '../log-manual-item';`
- Add a converter near the other `toXEntry` helpers:

```ts
// Manual log entries are dated, so they sort alongside news/posts by sortDate.
const toManualEntry = (item: LogManualItem): SortableEntry => {
  const at = dayjs(item.date).tz('Asia/Tokyo');

  return {
    id: `log-${item.id}`,
    year: at.year(),
    date: at.format('MM.DD'),
    meta: item.meta,
    title: item.title,
    upcoming: false,
    href: item.url,
    sortDate: item.date,
  };
};
```
- Change the signature and the `entries` assembly:

```ts
export const buildLogTimeline = (
  news: readonly NewsItem[],
  works: readonly WorkRow[],
  posts: readonly ExternalPost[],
  now: string,
  logs: readonly LogManualItem[] = [],
): LogYearGroup[] => {
  const newsEntries = news.filter(isChronicleNews).map((item) => toNewsEntry(item, now));
  const postEntries = posts.map(toPostEntry);
  const workEntries = works.map(toWorkEntry);
  const manualEntries = logs.map(toManualEntry);
  const entries = [...newsEntries, ...postEntries, ...workEntries, ...manualEntries];
  // ...rest unchanged (bucketing + sort)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/app/\(site\)/log/_lib/build-log-timeline/build-log-timeline.test.ts`
Expected: PASS (including any pre-existing cases).

- [ ] **Step 5: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/log/_lib/build-log-timeline/
git commit -m "feat(log): merge manual logs entries into the chronicle timeline"
```

### Task 5.4: Wire `/log` to use works + logs from Payload

**Files:**
- Modify: `src/app/(site)/log/page.tsx`

- [ ] **Step 1: Update the page**

- Remove `import { works } from '../works/sample-works';`
- Add `import { findWorksList } from '@lib/payload/works';` and `import { findLogList } from '@lib/payload/logs';`
- In `LogPage`, replace the data gathering:

```ts
const news = await findNewsList();
const works = await findWorksList();
const posts = await fetchExternalPosts();
const logs = await findLogList();
const now = dayjs().tz('Asia/Tokyo').toISOString();
const groups = buildLogTimeline(news, works, posts, now, logs);
```

- [ ] **Step 2: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/log/page.tsx
git commit -m "feat(log): source works and manual entries from payload"
```

### Task 5.5: Schema migration for logs

- [ ] **Step 1: Create + apply**

```bash
pnpm payload migrate:create logs
pnpm payload migrate
```

- [ ] **Step 2: Commit**

```bash
git add migrations/
git commit -m "feat(logs): add logs schema migration"
```

---

## Phase 6 — about → Payload global `profile`

### Task 6.1: Define the `profile` global

**Files:**
- Create: `src/globals/profile.ts`

- [ ] **Step 1: Write the global definition**

```ts
import { revalidatePath, revalidateTag } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import type { GlobalConfig } from 'payload';

// Singleton profile powering /about. Busting CACHE_TAGS.profile purges the
// unstable_cache read; revalidatePath('/about') refreshes the ISR HTML.
export const Profile = {
  slug: 'profile',
  label: 'プロフィール',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user !== null,
  },
  versions: { drafts: { autosave: { interval: 375 } } },
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag(CACHE_TAGS.profile);
          revalidatePath('/about');
        } catch {
          // revalidate throws outside a Next request context (e.g. CLI seed). Safe to swallow.
        }
      },
    ],
  },
  fields: [
    { name: 'name', label: '名前', type: 'text', required: true },
    { name: 'aka', label: '別名', type: 'text' },
    { name: 'now', label: '現在', type: 'text' },
    { name: 'team', label: 'チーム', type: 'text' },
    { name: 'tagline', label: 'タグライン', type: 'text' },
    { name: 'bio', label: '自己紹介', type: 'richText' },
    { name: 'philosophy', label: '思想', type: 'richText' },
    {
      name: 'love',
      label: '好きなジャンル',
      type: 'array',
      labels: { singular: 'ジャンル', plural: 'ジャンル' },
      fields: [{ name: 'value', label: '名称', type: 'text', required: true }],
    },
    {
      name: 'skillGroups',
      label: 'スキル',
      type: 'array',
      labels: { singular: 'スキル群', plural: 'スキル群' },
      fields: [
        { name: 'category', label: 'カテゴリ', type: 'text', required: true },
        {
          name: 'items',
          label: '項目',
          type: 'array',
          labels: { singular: '項目', plural: '項目' },
          fields: [{ name: 'value', label: '名称', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'contacts',
      label: '連絡先',
      type: 'array',
      labels: { singular: '連絡先', plural: '連絡先' },
      fields: [
        { name: 'label', label: 'ラベル', type: 'text', required: true },
        { name: 'handle', label: 'ハンドル', type: 'text', required: true },
        { name: 'href', label: 'URL', type: 'text', required: true },
      ],
    },
  ],
} satisfies GlobalConfig;
```

- [ ] **Step 2: Register in `payload.config.ts`**

- Import: `import { Profile } from './globals/profile';`
- Add a top-level `globals: [Profile],` key to `buildConfig({...})` (next to `collections`).

- [ ] **Step 3: Generate types + importmap, typecheck, commit**

```bash
pnpm payload generate:types
pnpm payload generate:importmap
pnpm typecheck
git add src/globals/profile.ts src/payload.config.ts src/payload-types.ts src/app/\(payload\)/admin/importMap.js
git commit -m "feat(about): add profile global and register in payload config"
```

### Task 6.2: profile domain type + mapper + helper (TDD)

**Files:**
- Create: `src/app/(site)/about/_lib/profile/index.ts` (domain type)
- Create: `src/lib/payload/profile/to-profile/index.ts` + `.test.ts`
- Create: `src/lib/payload/profile/index.ts`

> The existing `about/profile.ts` is an `as const` literal that the page consumes directly with several derived shapes (`whoamiRows`, `SkillMatrix`, `TagCloud`, `ContactList`). Introduce a domain type that matches the fields the page reads, then map the Payload global into it. Keep field names identical to the literal (`name/aka/now/team/tagline/bio/philosophy/love/skillGroups/contacts`) so page code changes minimally.

- [ ] **Step 1: Define the domain type**

`src/app/(site)/about/_lib/profile/index.ts`:

```ts
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type ProfileSkillGroup = { category: string; items: readonly string[] };
export type ProfileContact = { label: string; handle: string; href: string };

export type Profile = {
  name: string;
  aka: string;
  now: string;
  team: string;
  tagline: string;
  bio?: SerializedEditorState;
  philosophy?: SerializedEditorState;
  love: readonly string[];
  skillGroups: readonly ProfileSkillGroup[];
  contacts: readonly ProfileContact[];
};
```

- [ ] **Step 2: Write the failing mapper test**

`src/lib/payload/profile/to-profile/to-profile.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { toProfile } from './index';

import type { Profile as ProfileGlobal } from '@payload-types';

const global = {
  name: 'naporitan',
  aka: 'napochaan',
  now: 'programmer',
  team: 'StudioGnu',
  tagline: 'おそろしき、なんでも屋。',
  love: [{ id: 'a', value: 'dubstep' }, { id: 'b', value: 'riddim' }],
  skillGroups: [{ id: 'g', category: 'lang', items: [{ id: '1', value: 'TypeScript' }, { id: '2', value: 'Rust' }] }],
  contacts: [{ id: 'c', label: 'x', handle: '@naporin24690', href: 'https://x.com/naporin24690' }],
} as unknown as ProfileGlobal;

describe('toProfile', () => {
  it('flattens array value/items into plain string arrays', () => {
    const profile = toProfile(global);
    expect(profile.name).toBe('naporitan');
    expect(profile.tagline).toBe('おそろしき、なんでも屋。');
    expect(profile.love).toEqual(['dubstep', 'riddim']);
    expect(profile.skillGroups).toEqual([{ category: 'lang', items: ['TypeScript', 'Rust'] }]);
    expect(profile.contacts).toEqual([{ label: 'x', handle: '@naporin24690', href: 'https://x.com/naporin24690' }]);
  });

  it('coerces missing optional text fields to empty string and bodies to undefined', () => {
    const sparse = { name: 'n', love: null, skillGroups: null, contacts: null } as unknown as ProfileGlobal;
    const profile = toProfile(sparse);
    expect(profile.aka).toBe('');
    expect(profile.bio).toBeUndefined();
    expect(profile.love).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/payload/profile/to-profile/to-profile.test.ts`
Expected: FAIL — `toProfile` not defined.

- [ ] **Step 4: Implement the mapper**

`src/lib/payload/profile/to-profile/index.ts`:

```ts
import type { Profile, ProfileContact, ProfileSkillGroup } from '../../../../app/(site)/about/_lib/profile';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Profile as ProfileGlobal } from '@payload-types';

const toValues = (rows: ProfileGlobal['love']): readonly string[] => (rows ?? []).map((row) => row.value);

const toSkillGroups = (groups: ProfileGlobal['skillGroups']): readonly ProfileSkillGroup[] =>
  (groups ?? []).map((group) => ({ category: group.category, items: (group.items ?? []).map((item) => item.value) }));

const toContacts = (contacts: ProfileGlobal['contacts']): readonly ProfileContact[] =>
  (contacts ?? []).map((contact) => ({ label: contact.label, handle: contact.handle, href: contact.href }));

// Maps the Payload `profile` global to the site's Profile domain type, flattening
// `{ value }` / `{ items: [{ value }] }` arrays into plain string arrays and
// coercing absent text to '' and absent rich-text to undefined. Pure.
export const toProfile = (global: ProfileGlobal): Profile => ({
  name: global.name,
  aka: global.aka ?? '',
  now: global.now ?? '',
  team: global.team ?? '',
  tagline: global.tagline ?? '',
  bio: (global.bio ?? undefined) as SerializedEditorState | undefined,
  philosophy: (global.philosophy ?? undefined) as SerializedEditorState | undefined,
  love: toValues(global.love),
  skillGroups: toSkillGroups(global.skillGroups),
  contacts: toContacts(global.contacts),
});
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/payload/profile/to-profile/to-profile.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the helper**

`src/lib/payload/profile/index.ts`:

```ts
import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toProfile } from './to-profile';

import type { Profile } from '../../../app/(site)/about/_lib/profile';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

const fetchProfile = unstable_cache(
  async (): Promise<Profile | undefined> => {
    const payload = await getPayloadClient();
    const global = await payload.findGlobal({ slug: 'profile' });

    return toProfile(global);
  },
  ['profile'],
  { tags: [CACHE_TAGS.profile] },
);

export const findProfile = async (): Promise<Profile | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchProfile();
};
```

- [ ] **Step 7: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/about/_lib/profile/ src/lib/payload/profile/
git commit -m "feat(about): add profile domain type, mapper, and query helper"
```

### Task 6.3: Wire `/about` to the global

**Files:**
- Modify: `src/app/(site)/about/page.tsx`
- Inspect: the `_components` that consume `profile` (AboutMasthead, ContactList, SkillMatrix, TagCloud, Whoami) to confirm prop shapes still match the new `Profile` type.

- [ ] **Step 1: Read the page + its components**

Run: `sed -n '1,200p' "src/app/(site)/about/page.tsx"` and skim the five `_components` prop types. The new `Profile` type uses the same field names, so the swap is mechanical. The only difference: `love`/`skillGroups`/`contacts` are now `readonly` arrays — if a component declares a mutable array prop, spread at the call site (`[...profile.love]`).

- [ ] **Step 2: Update the page**

- Remove `import { profile } from './profile';`
- Add `import { findProfile } from '@lib/payload/profile';`
- Make the page component `async` (if not already) and add at the top:

```ts
const profile = await findProfile();
if (profile === undefined) notFound();
```
  (Add `import { notFound } from 'next/navigation';` if missing.) `generateMetadata` reads `profile.tagline`; change it to `async` and fetch via `findProfile()` there too (mirror how works/blog detail metadata fetch).

- [ ] **Step 3: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/about/page.tsx
git commit -m "feat(about): wire /about to the profile global"
```

> No schema migration step is strictly separate for globals — the global's table is created by `migrate:create` in Phase 8's combined regen, OR run `pnpm payload migrate:create profile_global && pnpm payload migrate` now. Prefer running it now for an immediately working `/about` admin:
> ```bash
> pnpm payload migrate:create profile_global
> pnpm payload migrate
> git add migrations/ && git commit -m "feat(about): add profile global migration"
> ```

---

## Phase 7 — RSS feeds for blog / works / log / gallery

Each route mirrors `src/app/(site)/news/rss.xml/route.ts`: `export const revalidate = 3600`, read the tagged helper, build items, return `application/rss+xml`. Origin: `process.env.BASE_URL ?? 'http://localhost:3000'`.

### Task 7.1: `/blog/rss.xml`

**Files:**
- Create: `src/app/(site)/blog/rss.xml/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { findBlogList } from '@lib/payload/blog';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { ChannelData, ItemData } from '@utils/rss/types';

export const revalidate = 3600;

export const GET = async (): Promise<Response> => {
  const posts = await findBlogList();
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const items: ItemData[] = posts.map((post) => ({
    title: post.title,
    link: `${origin}/blog/${post.id}`,
    guid: `${origin}/blog/${post.id}`,
    pubDate: post.date,
    category: post.source,
    description: post.excerpt,
  }));

  const [newest] = posts;
  const channel = {
    title: 'napochaan — blog',
    link: `${origin}/blog`,
    description: 'napochaan のブログ — 制作・技術・日々の記録。',
    language: 'ja',
    selfUrl: `${origin}/blog/rss.xml`,
    lastBuildDate: newest?.date,
  } satisfies ChannelData;

  return new Response(createRssDocument({ channel, items }), { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
```

- [ ] **Step 2: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/blog/rss.xml/route.ts
git commit -m "feat(blog): add /blog/rss.xml feed"
```

### Task 7.2: `/works/rss.xml`

**Files:**
- Create: `src/app/(site)/works/rss.xml/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { findWorksList } from '@lib/payload/works';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { WorkRow } from '../_lib/work-row';
import type { ChannelData, ItemData } from '@utils/rss/types';

export const revalidate = 3600;

// Works carry year-precision only; use Jan 1 of the year as a stable pubDate.
const pubDateOf = (work: WorkRow): string => `${work.year}-01-01`;

const linkOf = (work: WorkRow, origin: string): string => {
  if (work.url === undefined) return `${origin}/works/${work.id}`;
  if (work.url.startsWith('/')) return `${origin}${work.url}`;

  return work.url;
};

export const GET = async (): Promise<Response> => {
  const works = await findWorksList();
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const items: ItemData[] = works.map((work) => ({
    title: work.title,
    link: linkOf(work, origin),
    guid: `${origin}/works/${work.id}`,
    pubDate: pubDateOf(work),
    category: work.type,
    description: work.description,
  }));

  const channel = {
    title: 'napochaan — works',
    link: `${origin}/works`,
    description: 'napochaan の制作アーカイブ — graphic・VJ・flyer・dev・video。',
    language: 'ja',
    selfUrl: `${origin}/works/rss.xml`,
    lastBuildDate: items[0]?.pubDate,
  } satisfies ChannelData;

  return new Response(createRssDocument({ channel, items }), { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
```

- [ ] **Step 2: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/works/rss.xml/route.ts
git commit -m "feat(works): add /works/rss.xml feed"
```

### Task 7.3: `/log/rss.xml`

**Files:**
- Create: `src/app/(site)/log/rss.xml/route.ts`

The log feed flattens the timeline groups into items. `LogEntry.href` may be relative (`/works/3`), absolute (external), or absent.

- [ ] **Step 1: Write the route**

```ts
import { buildLogTimeline } from '../_lib/build-log-timeline';
import { fetchExternalPosts } from '../_lib/fetch-external-posts';

import { findLogList } from '@lib/payload/logs';
import { findNewsList } from '@lib/payload/news';
import { findWorksList } from '@lib/payload/works';
import { createRssDocument } from '@utils/rss/create-rss-document';
import { dayjs } from '@utils/dayjs';

import type { LogEntry } from '../_lib/build-log-timeline';
import type { ChannelData, ItemData } from '@utils/rss/types';

export const revalidate = 3600;

const linkOf = (entry: LogEntry, origin: string): string => {
  if (entry.href === undefined) return `${origin}/log`;
  if (entry.href.startsWith('/')) return `${origin}${entry.href}`;

  return entry.href;
};

// Reconstruct an ISO pubDate from the year + 'MM.DD' display date. Works rows use
// '—' (no day); fall back to Jan 1 of the year.
const pubDateOf = (year: number, date: string): string => {
  if (date === '—') return `${year}-01-01`;
  const [month, day] = date.split('.');

  return `${year}-${month}-${day}`;
};

export const GET = async (): Promise<Response> => {
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const news = await findNewsList();
  const works = await findWorksList();
  const posts = await fetchExternalPosts();
  const logs = await findLogList();
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const groups = buildLogTimeline(news, works, posts, now, logs);

  const items: ItemData[] = groups.flatMap((group) =>
    group.items.map((entry) => ({
      title: entry.title,
      link: linkOf(entry, origin),
      guid: `${origin}/log#${entry.id}`,
      pubDate: pubDateOf(group.year, entry.date),
      category: entry.meta,
    })),
  );

  const channel = {
    title: 'napochaan — log',
    link: `${origin}/log`,
    description: 'napochaan の活動年表 — gig・release・work・milestone。',
    language: 'ja',
    selfUrl: `${origin}/log/rss.xml`,
    lastBuildDate: items[0]?.pubDate,
  } satisfies ChannelData;

  return new Response(createRssDocument({ channel, items }), { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
```

> If `LogEntry` / `LogYearGroup` are not exported from `build-log-timeline`, they already are (confirmed in the source). Use those exports.

- [ ] **Step 2: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/log/rss.xml/route.ts
git commit -m "feat(log): add /log/rss.xml feed"
```

### Task 7.4: `/gallery/rss.xml` (with enclosures)

**Files:**
- Create: `src/app/(site)/gallery/rss.xml/route.ts`

Gallery images may be relative (`/media/x.jpg`) — absolutize against origin for both the enclosure and link.

- [ ] **Step 1: Write the route**

```ts
import { findGalleryList } from '@lib/payload/gallery';
import { createRssDocument } from '@utils/rss/create-rss-document';

import type { GalleryPhoto } from '@components/gallery-archive';
import type { ChannelData, ItemData } from '@utils/rss/types';

export const revalidate = 3600;

const absolutize = (src: string, origin: string): string => (src.startsWith('http') ? src : `${origin}${src}`);

// Best-effort MIME from the file extension; default to image/jpeg.
const mimeOf = (src: string): string => {
  if (src.endsWith('.png')) return 'image/png';
  if (src.endsWith('.webp')) return 'image/webp';
  if (src.endsWith('.gif')) return 'image/gif';

  return 'image/jpeg';
};

const toItem = (photo: GalleryPhoto, origin: string): ItemData => {
  const url = absolutize(photo.src, origin);

  return {
    title: photo.caption !== '' ? photo.caption : photo.alt,
    link: `${origin}/gallery#${photo.id}`,
    guid: `${origin}/gallery#${photo.id}`,
    description: photo.alt,
    enclosure: { url, type: mimeOf(photo.src), length: 0 },
  };
};

export const GET = async (): Promise<Response> => {
  const origin = process.env.BASE_URL ?? 'http://localhost:3000';
  const photos = await findGalleryList();
  const items = photos.map((photo) => toItem(photo, origin));

  const channel = {
    title: 'napochaan — gallery',
    link: `${origin}/gallery`,
    description: 'napochaan のギャラリー — flyer・VRChat・photo。',
    language: 'ja',
    selfUrl: `${origin}/gallery/rss.xml`,
  } satisfies ChannelData;

  return new Response(createRssDocument({ channel, items }), { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
```

- [ ] **Step 2: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/gallery/rss.xml/route.ts
git commit -m "feat(gallery): add /gallery/rss.xml feed with enclosures"
```

### Task 7.5: Add `<head>` alternate-feed links for discovery

**Files:**
- Modify: `src/app/(site)/blog/page.tsx`, `works/page.tsx`, `log/page.tsx`, `gallery/page.tsx`

For each page, add (or extend) the `metadata`/`generateMetadata` `alternates.types`. Example for blog (apply the analogous block to each, pointing at its own feed):

- [ ] **Step 1: Add alternates to each list page's metadata**

In each page's `generateMetadata` return object (or static `metadata`), add:

```ts
    alternates: {
      types: {
        'application/rss+xml': [{ url: '/blog/rss.xml', title: 'napochaan — blog' }],
      },
    },
```
Use the matching path/title per page: `/works/rss.xml` "napochaan — works", `/log/rss.xml` "napochaan — log", `/gallery/rss.xml` "napochaan — gallery". For `works/page.tsx` which currently has no `generateMetadata`, add a static `export const metadata: Metadata = { alternates: { types: { 'application/rss+xml': [{ url: '/works/rss.xml', title: 'napochaan — works' }] } } };` (import `Metadata` from `next`). Verify it does not conflict with an existing metadata export; if one exists, merge.

- [ ] **Step 2: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck
git add src/app/\(site\)/blog/page.tsx src/app/\(site\)/works/page.tsx src/app/\(site\)/log/page.tsx src/app/\(site\)/gallery/page.tsx
git commit -m "feat(rss): add alternate feed links to dynamic page heads"
```

---

## Phase 8 — Seed migrations (preserve sample content)

> Per `.claude/rules/payload-cms.md`: seed with `payload.create()` (handles draft + version tables), never raw SQL; make each migration idempotent by checking for existing rows first. Works/gallery seeds need `media` rows, so seed media first via the Local API's `filePath` upload, then reference the returned ids.

### Task 8.1: Seed media + works

**Files:**
- Create: `migrations/<timestamp>_seed_works.ts` (create via `pnpm payload migrate:create seed_works`, then fill the `up` body)

- [ ] **Step 1: Generate the empty migration**

Run: `pnpm payload migrate:create seed_works`
Expected: a new file with empty `up`/`down`.

- [ ] **Step 2: Implement the seed in `up`**

Reference the existing sample data (`src/app/(site)/works/sample-works.ts`) for the titles/types/years/descriptions. Image files live in `src/assets/*.jpg` (the `@assets` alias target). Use absolute paths via `path.resolve`. Pattern:

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-d1-sqlite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = (file: string): string => path.resolve(dirname, '..', 'src', 'assets', file);

// Create a media row from an asset file, returning its id. Idempotent by alt.
const ensureMedia = async (payload: MigrateUpArgs['payload'], alt: string, file: string): Promise<number> => {
  const existing = await payload.find({ collection: 'media', where: { alt: { equals: alt } }, limit: 1 });
  const [found] = existing.docs;
  if (found !== undefined) return found.id;
  const created = await payload.create({ collection: 'media', data: { alt }, filePath: assets(file) });

  return created.id;
};

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'works', limit: 1 });
  if (existing.docs.length > 0) return; // idempotent

  const square = await ensureMedia(payload, 'Booth² key visual', 'vrchat-square.jpg');
  // ...one ensureMedia per distinct asset used below...

  await payload.create({
    collection: 'works',
    data: {
      title: 'Booth² key visual',
      type: 'graphic',
      year: 2026,
      no: '01',
      thumbnail: square,
      description: 'Booth² のためのキービジュアル。…',
      _status: 'published',
    },
  });
  // ...repeat payload.create for each sample work, reusing media ids...
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // No-op: seed data removal is manual.
}
```

> Reproduce ALL sample works (8+ entries) from `sample-works.ts`, mapping each `thumbnail` import to an `ensureMedia(...)` call on the matching `src/assets/<file>.jpg`. For rich-text `body`, either omit (description-only) or build a minimal lexical state; the sample uses `richTextFromParagraphs` — you may import that helper (`@utils/sample-rich-text`) inside the migration to reproduce bodies faithfully.

- [ ] **Step 3: Apply + verify**

```bash
pnpm payload migrate
pnpm dev
```
Then visit `http://localhost:3000/works` and `/works/1` — confirm the archive and a detail page render the seeded works. Stop dev.

- [ ] **Step 4: Commit**

```bash
git add migrations/
git commit -m "feat(works): seed sample works + media"
```

### Task 8.2: Seed blog

**Files:**
- Create: `migrations/<timestamp>_seed_blog.ts`

- [ ] **Step 1: Generate + implement**

Run `pnpm payload migrate:create seed_blog`. In `up`, idempotency-guard on `blog` count, then `payload.create` one entry per post in `sample-posts.ts` (`title/source/excerpt/publishedAt=date/_status:'published'`), building `body` from the post's blocks with `richTextFromBlocks` (`@utils/sample-rich-text`). No media needed.

- [ ] **Step 2: Apply, verify `/blog` + `/blog/1`, commit**

```bash
pnpm payload migrate
git add migrations/
git commit -m "feat(blog): seed sample posts"
```

### Task 8.3: Seed gallery

**Files:**
- Create: `migrations/<timestamp>_seed_gallery.ts`

- [ ] **Step 1: Generate + implement**

Run `pnpm payload migrate:create seed_gallery`. In `up`, idempotency-guard on `gallery` count, `ensureMedia` for each `src/assets/gallery-*.jpg` / reused asset (see `sample-gallery.ts`), then `payload.create({ collection: 'gallery', data: { image: mediaId, caption, alt, order, _status: 'published' } })` preserving the sample order (use the array index as `order`).

- [ ] **Step 2: Apply, verify `/gallery`, commit**

```bash
pnpm payload migrate
git add migrations/
git commit -m "feat(gallery): seed sample photos + media"
```

### Task 8.4: Seed the profile global

**Files:**
- Create: `migrations/<timestamp>_seed_profile.ts`

- [ ] **Step 1: Generate + implement**

Run `pnpm payload migrate:create seed_profile`. In `up`, `payload.updateGlobal({ slug: 'profile', data: {...} })` with the values from `about/profile.ts`: scalar text fields directly; `love` → `love.map((v) => ({ value: v }))`; `skillGroups` → `skillGroups.map((g) => ({ category: g.category, items: g.items.map((v) => ({ value: v })) }))`; `contacts` directly; `bio`/`philosophy` via `richTextFromBlocks`/`richTextFromParagraphs`. Globals are singletons so `updateGlobal` is naturally idempotent.

- [ ] **Step 2: Apply, verify `/about`, commit**

```bash
pnpm payload migrate
git add migrations/
git commit -m "feat(about): seed profile global"
```

### Task 8.5: Final regen + full verification

- [ ] **Step 1: Regenerate types + import map (catch any drift)**

```bash
pnpm payload generate:types
pnpm payload generate:importmap
```

- [ ] **Step 2: Full gate**

```bash
pnpm lint && pnpm typecheck
pnpm vitest run
```
Expected: all green.

- [ ] **Step 3: Build smoke test**

```bash
pnpm build
```
Expected: build succeeds (this also exercises the `@assets/*.jpg` ambient-module risk noted in the spec — a path typo only surfaces here, not in typecheck).

- [ ] **Step 4: Manual feed check**

```bash
pnpm dev
```
Fetch each feed and confirm valid XML:
```bash
curl -s http://localhost:3000/blog/rss.xml | head -20
curl -s http://localhost:3000/works/rss.xml | head -20
curl -s http://localhost:3000/log/rss.xml | head -20
curl -s http://localhost:3000/gallery/rss.xml | head -20
```
Confirm `/gallery/rss.xml` contains `<enclosure ...>`. Stop dev.

- [ ] **Step 5: Commit any regen drift**

```bash
git add -A
git commit -m "chore(cms): regenerate types/importmap after seeds"
```

---

## Final review / difit

- [ ] Run `difit` to request review (per project rule: launch difit after implementation for the user's review).
- [ ] Remove the now-unused `sample-*.ts` files ONLY if the user confirms — they are referenced by some `_lib` tests and serve as documentation. Leaving them is acceptable; deletion is a follow-up.

> Production DB migration (`pnpm deploy:database:production`) is intentionally NOT part of this plan — the user runs it after review (it targets remote D1 bindings).

---

## Self-Review notes (author)

- **Spec coverage:** works ✓ (P2), blog ✓ (P3), gallery ✓ (P4), logs+timeline ✓ (P5), about global ✓ (P6), RSS all-four incl. gallery enclosure ✓ (P1+P7), seed-via-create ✓ (P8), config registration/SEO/livePreview/types/importmap ✓ (each phase), readMin-derived ✓ (3.2), works.type 8 values ✓ (2.1).
- **Type consistency:** mapper names (`toWorkItem`/`toBlogPost`/`toGalleryPhoto`/`toLogManualItem`/`toProfile`) and helper names (`findWorksList`/`findWorkById`/`findBlogList`/`findBlogById`/`findGalleryList`/`findLogList`/`findProfile`) are used consistently across helper, page-wiring, and RSS tasks. `buildLogTimeline` 5th param `logs` defaulted to `[]` so existing 4-arg callers and the new call both compile.
- **Open risk flagged in-plan:** the Payload generated type name for the `logs` collection (`Log` vs other pluralization) must be confirmed after Task 5.1 (noted in 5.2). `extractPlainText` is imported from its current `news/rss.xml` location (move is out of scope).
