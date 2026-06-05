---
description: Ensure ISR-cached pages are purged via revalidatePath alongside any revalidateTag — the path-keyed cache is unreachable by revalidateTag alone
paths:
  - "src/app/(site)/page.tsx"
  - "src/app/(site)/layout.tsx"
  - "src/collections/**/*.ts"
  - "src/utils/cache/**/*.ts"
  - "src/utils/payload/**/*.ts"
---

The home route (`src/app/(site)/page.tsx`) is ISR-cached via `export const revalidate = 3600`. The rendered HTML lives in a **path-keyed** cache that `revalidateTag` does **not** reach — `revalidateTag` only purges `unstable_cache` entries (the data layer).

When a collection's data flows into an ISR page, its `afterChange` / `afterDelete` hooks must call **both**:

- `revalidateTag(<tag>)` — if the data is wrapped in `unstable_cache` with that tag
- `revalidatePath(<path>)` — for every ISR-cached page that renders the data

Without both, CMS edits surface on the site only after the page's `revalidate` window elapses (up to 1 h).

## Current wiring

- **Uses `unstable_cache`** (`how-to-connect`, `media`) → `revalidateTag(HOW_TO_CONNECT_TAG)` + `revalidatePath('/')`
- **Rendered directly** (`events`, `performers`) → `revalidatePath('/')` only (`performers` is dormant until `<Timetable />` is re-enabled)

## Example

```ts
// src/collections/how-to-connect.ts — cached via unstable_cache
import { revalidatePath, revalidateTag } from 'next/cache';

hooks: {
  afterChange: [() => {
    revalidateTag(HOW_TO_CONNECT_TAG);
    revalidatePath('/');
  }],
},
```

```ts
// src/collections/events.ts — queried directly, no tag
import { revalidatePath } from 'next/cache';

hooks: {
  afterChange: [() => revalidatePath('/')],
  afterDelete: [() => revalidatePath('/')],
},
```

## When editing `page.tsx`

Before landing:

1. List every collection / global queried (directly, via `getPayload`, `unstable_cache`, or a helper)
2. For each:
   - `unstable_cache` wrapped → hook calls **both** `revalidateTag()` + `revalidatePath('/')`
   - Rendered directly → hook calls **`revalidatePath('/')`** only
3. New ISR page? → repeat the mapping for its path

## Anti-patterns

```ts
// Bad — only purges the data cache; ISR HTML stays stale up to 1 h
afterChange: [() => revalidateTag(HOW_TO_CONNECT_TAG)]

// Bad — rendering event data on '/' without wiring up revalidation
// (page caches 1 h of stale JSON-LD)
const event = await getNextEvent();

// Good — pairs data changes with path invalidation
afterChange: [() => {
  revalidateTag(HOW_TO_CONNECT_TAG);
  revalidatePath('/');
}],
```
