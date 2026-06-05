# Payload CMS Rules

## Adding a New Collection — Checklist

When adding a new collection, complete **all** steps below. No exceptions.

### 1. Create the Collection definition

Create `src/collections/<slug>.ts`:

```typescript
import type { CollectionConfig } from 'payload';

export const Example = {
  slug: 'examples',
  labels: { singular: '例', plural: '例' },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'タイトル',
      type: 'text',
      required: true,
    },
  ],
} satisfies CollectionConfig;
```

**Requirements:**

- Set `labels` in Japanese (admin UI is Japanese)
- Set `label` on every field in Japanese
- Set `admin.useAsTitle` for the list view display field

### 2. Register in payload.config.ts

```typescript
import { NewCollection } from './collections/new-collection';

collections: [Users, Media, News, NewCollection],
```

### 3. Add to SEO plugin (public-facing collections only)

```typescript
seoPlugin({
  collections: ['news', 'new-collection'], // ← add here
}),
```

### 4. Add to Live Preview (public-facing collections only)

Update `admin.livePreview`:

```typescript
livePreview: {
  url: ({ data, collectionConfig }) => {
    const base = process.env.BASE_URL ?? 'http://localhost:3000';
    if (collectionConfig?.slug === 'new-collection') return `${base}/new-collection/${data.id}`; // ← add
    return base;
  },
  collections: ['news', 'new-collection'], // ← add
},
```

### 5. Generate and run migration

```bash
PAYLOAD_SECRET=dev-secret-change-me-in-production pnpm payload migrate:create <migration_name>
PAYLOAD_SECRET=dev-secret-change-me-in-production pnpm payload migrate
```

### 6. Regenerate import map

```bash
PAYLOAD_SECRET=dev-secret-change-me-in-production pnpm payload generate:importmap
```

### 7. Regenerate types (optional)

```bash
PAYLOAD_SECRET=dev-secret-change-me-in-production pnpm payload generate:types
```

## Commands

| Command                              | Description                       |
| ------------------------------------ | --------------------------------- |
| `pnpm payload migrate:create <name>` | Generate migration file           |
| `pnpm payload migrate`               | Apply migrations locally          |
| `pnpm payload generate:importmap`    | Regenerate admin import map       |
| `pnpm payload generate:types`        | Regenerate TypeScript types       |
| `pnpm deploy:database:production`    | Apply migrations to production D1 |

**Note:** All Payload CLI commands require `PAYLOAD_SECRET` env var. Defined in `.dev.vars` but must be passed explicitly when running CLI:

```bash
PAYLOAD_SECRET=dev-secret-change-me-in-production pnpm payload <command>
```

## File Structure

```
src/
├── payload.config.ts          # Config: collections, plugins, DB
├── payload-types.ts           # Auto-generated: TypeScript types
├── collections/               # Collection definitions
│   ├── users.ts
│   ├── media.ts
│   └── news.ts
├── migrations/                # Auto-generated: DB migrations
├── app/(payload)/             # Payload admin routes
│   ├── layout.tsx
│   ├── admin/
│   │   ├── importMap.js       # Auto-generated: import map
│   │   └── [[...segments]]/
│   └── api/[...slug]/
└── components/live-preview/   # Live Preview client component
```

## Seeding Data in Migrations

When inserting seed data in migrations, **always use `payload.create()`** — never raw SQL INSERT.

Payload collections with `versions.drafts: true` require entries in both the main table AND the `_<slug>_v` versions table (with `latest: true`). Raw SQL only inserts into one table, so the admin UI won't see the records.

```typescript
// CORRECT — use payload.create() which handles both tables
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.create({
    collection: 'news',
    data: {
      title: 'Example',
      publishedAt: '2026-01-01',
      _status: 'published',
    },
  });
}

// WRONG — raw SQL misses the versions table
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`INSERT INTO news (...) VALUES (...)`);
}
```

Always check for existing records before inserting to keep migrations idempotent.

## Auto-generated Files

These files are managed by Payload — do NOT edit manually:

- `src/app/(payload)/admin/importMap.js`
- `src/payload-types.ts`
- `src/migrations/*.ts`

These files may not pass linter rules (filename casing, function style, etc.). This is expected.
