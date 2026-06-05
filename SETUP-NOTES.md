# SETUP-NOTES

Scaffolding notes for `www.napochaan.com` (Next.js 15 + Payload CMS v3 + OpenNext on Cloudflare Workers + Panda CSS + GSAP).

## 1. Final versions chosen

Base = `/tmp/ref-booth` (Booth2Booth), bumped to the newest safe mix across the three reference repos.

| Package                                                                                       | Version                                | Source / note                       |
| --------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------- |
| next                                                                                          | 15.3.9                                 | booth                               |
| payload + @payloadcms/\*                                                                      | 3.81.0                                 | booth                               |
| @opennextjs/cloudflare                                                                        | 1.18.0                                 | booth                               |
| gsap                                                                                          | ^3.15.0 (resolved 3.15.0)              | life (project uses GSAP)            |
| @gsap/react                                                                                   | ^2.1.2                                 | booth/life                          |
| react-aria-components                                                                         | ^1.17.0 (resolved 1.18.0)              | life                                |
| @pandacss/dev                                                                                 | **^1.11.1 (resolved 1.11.2)**          | life — newest, **kept** (see below) |
| @typescript/native-preview (tsgo)                                                             | 7.0.0-dev.20251229.1                   | all                                 |
| oxlint                                                                                        | 1.36.0 (resolved 1.68.0)               | all                                 |
| oxfmt                                                                                         | 0.21.0                                 | all                                 |
| vitest                                                                                        | ^4.0.18 (resolved 4.1.8), browser mode | booth                               |
| @cloudflare/vitest-pool-workers, @vitest/browser-playwright, vitest-browser-react, playwright | as booth                               | booth                               |
| react / react-dom                                                                             | ^19                                    | booth                               |
| packageManager                                                                                | pnpm@10.33.2                           | task spec                           |
| mise node                                                                                     | 24, pnpm 10.33.2                       | task spec                           |

### Panda CSS decision

**Panda 1.11.2 was kept (NOT pinned back to booth's 0.52).** `panda codegen`, the
`defineConfig` / `defineTokens` / `defineSemanticTokens` API, `strictTokens`, custom
`globalCss`, oklch token scales, and `css()` usage in `*.css.ts` files all work, and
`next build` succeeds with it. No pin-back was necessary.

### Intentional simplifications vs booth

Booth-specific domain code was NOT copied (events/performers/roles/how-to-connect, hero
canvas, three.js, video/youtube, RBAC, RSS/sitemap/llms routes, local woff2 fonts).
Replaced with:

- Collections: **Users** (auth), **Media** (R2 upload), **Pages** (slug + title + lexical
  richText + excerpt). SEO plugin runs on `pages`.
- Fonts: Google fonts (`M_PLUS_1`, `Zen_Kaku_Gothic_New`) instead of missing local woff2.
- Theme provider: `RouterProvider` (react-aria) + Slot only (dropped booth's viewport hook).
- Worker: minimal OpenNext handler mount + `DOQueueHandler` re-export (no image handler).
- One tiny GSAP client component (`src/app/(site)/_components/fade-in-heading.tsx`) using
  `@gsap/react` `useGSAP` to prove GSAP works.

## 2. Command results (all exit 0)

### `pnpm typecheck`

```
> tsgo --noEmit -p tsconfig.json
EXIT: 0
```

### `pnpm lint`

```
> oxfmt --check .   → All matched files use the correct format.
> oxlint ...        → (no errors/warnings)
EXIT: 0
```

### `pnpm build`

```
Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ○ /                                    33.9 kB         138 kB          1h      1y
├ ○ /_not-found                            987 B         105 kB
├ ƒ /admin/[[...segments]]                 427 B         738 kB
└ ƒ /api/[...slug]                         186 B         104 kB
EXIT: 0
```

`/` is prerendered as static with ISR (Revalidate 1h via `export const revalidate = 3600`),
satisfying the OpenNext-ISR requirement.

`pnpm vitest run --project unit` also passes (2/2) — the trivial `clsx` test.

## 3. PLACEHOLDERS to replace before deploy

All live in `wrangler.toml`. Every placeholder id is `00000000-0000-0000-0000-000000000000`
and bucket/db names are clearly marked with `# TODO` comments.

| Placeholder                                     | Where                                             | Provision command                               |
| ----------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `account_id`                                    | top of `wrangler.toml` (commented out)            | from Cloudflare dashboard; uncomment + set      |
| D1 `napochaan-cms-dev` (+ staging/production)   | `[[d1_databases]] binding=D1`                     | `wrangler d1 create napochaan-cms-dev`          |
| D1 `napochaan-cache-dev` (+ staging/production) | `[[d1_databases]] binding=NEXT_TAG_CACHE_D1`      | `wrangler d1 create napochaan-cache-dev`        |
| R2 `napochaan-cms-dev` (+ staging/production)   | `[[r2_buckets]] binding=R2`                       | `wrangler r2 bucket create napochaan-cms-dev`   |
| R2 `napochaan-cache-dev` (+ staging/production) | `[[r2_buckets]] binding=NEXT_INC_CACHE_R2_BUCKET` | `wrangler r2 bucket create napochaan-cache-dev` |

After creating each D1 database, copy the returned `database_id` into the matching
`database_id` field (per environment: dev/staging/production). Repeat the create commands
with `-staging` / `-production` suffixes for those environments.

Also set runtime secrets before deploy:

```
wrangler secret put PAYLOAD_SECRET
```

(Add `--env staging` / `--env production` as needed.)

Then generate migrations once and run them against D1:

```
pnpm payload:migrate:create          # creates the initial migration in ./migrations
CLOUDFLARE_ENV=production pnpm payload:migrate
```

(The `./migrations` directory is intentionally empty in this scaffold; `next build`,
typecheck, and lint do not need migrations — only runtime DB does.)

## 4. How remote-vs-local bindings are gated

In `src/payload.config.ts` there are two independent decisions:

1. **Where the context comes from** (`src/payload.config.ts`)
   - Payload CLI bin scripts (`generate` / `migrate` / `seed` / `reset` / `run`, detected
     via `process.argv`) resolve bindings through wrangler `getPlatformProxy` (they run
     outside the worker runtime).
   - During `next build` (detected via `process.env.NEXT_PHASE === 'phase-production-build'`,
     which IS set in the jest-worker subprocesses that evaluate route modules) Payload is
     handed **inert stub bindings**. The build never executes DB/R2 queries — `/admin` and
     `/api` are dynamic and the marketing pages don't read Payload — so the stub is safe and
     avoids booting miniflare in every parallel build worker (which deadlocks on the shared
     local Durable Object SQLite state: `SQLITE_BUSY` / `SQLITE_READONLY`).
   - At runtime (deployed worker) and `next dev`, bindings resolve via OpenNext's
     `getCloudflareContext({ async: true })`.

2. **Whether bindings are remote**
   - `const useRemoteBindings = CLOUDFLARE_ENV === 'staging' || CLOUDFLARE_ENV === 'production'`.
   - Remote bindings (`experimental.remoteBindings`) are used ONLY for those explicit
     deploy targets. With `CLOUDFLARE_ENV` unset (local dev, `next build`), everything is
     local miniflare — no `wrangler login`, no real Cloudflare resources required.

3. **Dev-only miniflare boot** (`next.config.ts`)
   - `initOpenNextCloudflareForDev` is gated behind `process.env.NODE_ENV === 'development'`
     so it runs ONLY under `next dev`. It must NOT run during `next build`: at the moment
     `next.config.ts` is first evaluated `NEXT_PHASE` is still `undefined`, so a `NEXT_PHASE`
     check there is unreliable — `NODE_ENV` (`next dev` ⇒ development, `next build` ⇒
     production) is the correct gate. Running it during build boots miniflare in the main
     process and deadlocks the same way.

## 5. Anything not green / caveats

- Everything required is green: `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0.
- The `DOQueueHandler` warnings during build/codegen are expected and harmless — the
  durable object only exists in the deployed worker (`worker/worker.ts` re-exports it from
  the OpenNext build output), not in local miniflare.
- The browser-mode and workers-mode vitest projects are wired (config + mocks + deps) but
  were not executed here (browser mode needs a Playwright browser download; workers mode
  needs the worker DO). The `unit` project runs and passes. Run `pnpm exec playwright
install chromium` before `pnpm test` to enable the browser project.
- `migrations/` is empty by design; create it with `pnpm payload:migrate:create` before
  the first deploy (see section 3).
- `.oxfmtrc.json` ignores `.claude/**`, `**/CLAUDE.md`, and `migrations/**` so that the
  pre-existing skill markdown files (which must not be modified) don't fail `oxfmt --check`.
