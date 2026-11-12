# Payload CMS Rules

Payload lives only in `apps/cms` (cms.napochaan.com / cms-stg.napochaan.com). `apps/web` is Payload-free (display only) and reads the CMS over the `env.CMS` Service Binding; do not add Payload imports to web. All paths below are relative to `apps/cms/` unless stated, and CLI commands run from the repo root through `--filter cms` (or the root delegating scripts).

## Adding a New Collection — Checklist

When adding a new collection, complete **all** steps below. No exceptions.

### 1. Create the Collection definition

Create `apps/cms/src/collections/<slug>.ts`:

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

### 2. Register in `apps/cms/src/payload.config.ts`

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

Live Preview is built from `WEB_ORIGIN` (per-environment wrangler var of apps/cms; `http://localhost:3000` locally, `https://stg.napochaan.com`, `https://napochaan.com`). Add a `draftPreviewRoute({ webOrigin, slug, previewSecret, buildPath })` resolver and the slug to `admin.livePreview.collections` in `payload.config.ts`:

```typescript
livePreview: {
  url: createPreviewURLFactory({
    webOrigin,
    resolvers: [
      // ...
      draftPreviewRoute({ webOrigin, slug: 'new-collection', previewSecret, buildPath: (data) => `/new-collection/preview/${data.id}` }), // ← add
    ],
  }),
  collections: ['news', 'new-collection'], // ← add
},
```

The preview page itself lives in apps/web (`/…/preview/*`) and must also be added to web's `PREVIEW_PATH_PREFIXES` (`apps/web/src/app/next/preview/allowed-paths.ts`) — `PREVIEW_ROOTS` is checked against it in `preview-frame.test.ts`. `PREVIEW_SECRET` must be the same wrangler secret on cms and web.

### 4b. Cache purge on write

web is SSR + Workers Cache (`.claude/rules/workers-cache.md`). A collection that web renders needs its `afterChange` / `afterDelete` hooks to call the `revalidate` hook (`src/collections/hooks/revalidate`), which asks web to purge via `env.WEB.purge()` (Service Binding to web's **default** entrypoint, best-effort, `ctx.waitUntil`). There is no `revalidatePath` / `revalidateTag` / `unstable_cache` any more. Seed import does not go through the hook (`disableRevalidate`) — redeploy web afterwards to empty the cache.

### 5. Generate and run migration

```bash
pnpm --filter cms payload:migrate:create <migration_name>
pnpm --filter cms payload:migrate
```

### 6. Regenerate import map

```bash
pnpm --filter cms payload:generate-importmap
```

### 7. Regenerate types (optional)

```bash
pnpm --filter cms payload generate:types
```

## Commands

| Command                                         | Description                                   |
| ----------------------------------------------- | --------------------------------------------- |
| `pnpm --filter cms payload migrate:create <name>` | Generate migration file (root: `pnpm payload:migrate:create <name>`) |
| `pnpm --filter cms payload migrate`             | Apply migrations locally                      |
| `pnpm --filter cms payload generate:importmap`  | Regenerate admin import map                   |
| `pnpm --filter cms payload generate:types`      | Regenerate TypeScript types                   |
| `pnpm deploy:database:production`               | Apply migrations to production D1 (= `pnpm --filter cms deploy:database:production`) |

The root `package.json` delegates `payload`, `payload:*`, `seed:*`, `deploy:database:*` and `deploy:{staging,production}` (cms then web) to the right workspace, so `pnpm payload <command>` from the repo root still works.

**Note:** Payload CLI commands need `PAYLOAD_SECRET`, but you do **not** pass it explicitly. `payload.config.ts` reads it from the Cloudflare env (`cfEnv.PAYLOAD_SECRET`), and the CLI resolves bindings through wrangler's `getPlatformProxy`, which loads `apps/cms/.dev.vars` automatically. So as long as `PAYLOAD_SECRET` is defined in `apps/cms/.dev.vars`, this works with no prefix:

```bash
pnpm payload <command>   # = pnpm --filter cms payload <command>
```

If you see `PAYLOAD_SECRET is required at runtime`, the key is missing from `apps/cms/.dev.vars` (add it there — do **not** reintroduce a `PAYLOAD_SECRET=… pnpm payload …` prefix or a `.env`).

> Production migrations (`pnpm deploy:database:production`, `CLOUDFLARE_ENV=production`) use **remote** bindings, so they read the deployed `wrangler secret`, not `.dev.vars`.

## File Structure

```
apps/cms/
├── migrations/                    # Auto-generated: DB migrations (apps/cms root, not src/ — see payload.config `migrationDir`)
└── src/
    ├── payload.config.ts          # Config: collections, plugins, DB
    ├── payload-types.ts           # Auto-generated: TypeScript types
    ├── collections/               # Collection definitions
    │   ├── users.ts
    │   ├── media.ts
    │   ├── news.ts
    │   └── hooks/revalidate/      # afterChange / afterDelete → env.WEB.purge()
    ├── app/(payload)/             # Payload admin routes (admin at host root: `routes.admin = '/'`)
    │   ├── importMap.js           # Auto-generated: import map (`admin.importMap.importMapFile`)
    │   ├── [[...segments]]/       # admin views: `/`, `/login`, `/collections/<slug>/<id>` ...
    │   └── api/[...slug]/         # REST (`/api/*` — static segment, wins over the catch-all)
    ├── worker.ts                  # Worker entry (CMS RPC entrypoint `CMS`, /mcp forward)
    └── seed/                      # seed bin scripts (seed / seed:export / seed:import)
packages/cms-api/                  # shared Hono app / DTO / service interfaces (no implementation)
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

- `apps/cms/src/app/(payload)/importMap.js`
- `apps/cms/src/payload-types.ts`
- `apps/cms/migrations/*.ts`

These files may not pass linter rules (filename casing, function style, etc.). This is expected.

## Reverting / Rolling back Migrations

`git revert` of a PR that added a migration does **not** roll back D1: `payload migrate` only walks local files (the applied row is silently skipped) and `payload migrate:down` needs the `down` fn from local files (`Migration X not found locally.`). Follow `docs/migration-rollback.md`:

- Run `CLOUDFLARE_ENV=<env> pnpm payload migrate:status` → `migrate:down` from the **pre-revert commit** on staging/production **before** merging the revert (main auto-deploys staging). `migrate:down` rolls back the whole latest batch.
- Prefer roll-forward (a new migration that undoes the change) over revert.
- **Expand/contract for destructive migrations**: never put code removal and a DROP migration in the same PR. Ship the code-removal PR first (no migration, safe to revert), then the DROP-only migration PR. Data lost by a DROP is only recoverable via D1 Time Travel.
- The deploy workflow runs `pnpm deploy:database:check:<env>` (`payload migrate:check-drift`) before migrating; it fails when D1 has applied migrations missing from `migrations/`. Resolve it per the runbook — never bypass it.
