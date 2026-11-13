# Coding Rules

## Package Management

- Install modules: `pnpm add <package>`
- Uninstall modules: `pnpm remove <package>`

## TypeScript Configuration

- **DO NOT modify** `tsconfig.json` `paths` settings
- If path changes are needed, use `AskUserQuestion` to discuss first

## Development Scripts

Monorepo (pnpm workspaces: `apps/cms`, `apps/web`, `packages/cms-api`). Root scripts run recursively (`pnpm -r run …`) or delegate to a workspace.

| Command                                   | Description                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                                | Start web dev server (`pnpm --filter web dev`). web reads the cms over `env.CMS`, so start cms first (below) |
| `pnpm dev:cms`                            | cms admin dev server (`pnpm --filter cms dev`, port 3001). For web RPC, run `pnpm --filter cms dev:worker` (OpenNext build + `wrangler dev --port 8791`) first, then `pnpm dev`; pin `WRANGLER_REGISTRY_PATH` / `MINIFLARE_REGISTRY_PATH` per worktree |
| `pnpm build`                              | Production build of web (`pnpm --filter web build` = `astro build`)      |
| `pnpm lint`                               | oxlint + oxfmt --check in every workspace                                |
| `pnpm fmt`                                | Format code (oxfmt + oxlint --fix) in every workspace                    |
| `pnpm typecheck`                          | Type check with `@typescript/native-preview` (tsgo) in every workspace   |
| `pnpm test`                               | vitest in every workspace                                                |
| `pnpm payload <cmd>`                      | `pnpm --filter cms payload <cmd>` (migrate / seed / generate:types …)    |
| `pnpm deploy:staging` / `deploy:production` | cms then web (`--filter cms` then `--filter web`)                      |
| `pnpm deploy:database:{staging,production}` | Apply migrations to D1 (cms)                                           |
| `pnpm --filter <cms\|web> cf:types`       | Regenerate `cloudflare-env.d.ts` from wrangler config (needed before typecheck) |

## After Implementation

**MUST run before completing any implementation task:**

```bash
pnpm lint && pnpm typecheck
```

- `pnpm lint`: Ensures code style and catches potential issues
- `pnpm typecheck`: Uses `tsgo` (TypeScript native compiler) for fast type checking

Do NOT use `npx tsc` or `pnpm tsc` directly. Always use `pnpm typecheck`.

## Promise Handling in Handlers

**FORBIDDEN**: `.then()` / `.catch()` / IIFE in event handlers

**REQUIRED**: Make `useCallback` async directly

```typescript
// Correct
const handleClick = useCallback(async () => {
  try {
    await asyncOperation();
  } catch (error) {
    console.error(error);
  }
}, []);

// Forbidden: .then/.catch
const handleClick = useCallback(() => {
  asyncOperation().then(setData).catch(setError);
}, []);

// Forbidden: IIFE
const handleClick = useCallback(() => {
  void (async () => {
    await asyncOperation();
  })();
}, []);
```

See: @.claude/rules/react.md#async-handler-rules-no-thencatch

## Tech Stack

- **Framework**: web = Astro (`output: 'server'`, `@astrojs/cloudflare`, React islands via `@astrojs/react` — see `.claude/rules/astro-islands.md`); cms = Next.js (App Router) + Payload CMS
- **UI**: React 19 + Panda CSS
- **Accessibility**: react-aria-components
- **Build / Deploy**: web: `CLOUDFLARE_ENV=<env> astro build` → `wrangler deploy --env <env>`; cms: Next.js build → OpenNext (`@opennextjs/cloudflare`) → Wrangler (Cloudflare Workers)
- **Linting**: oxlint + oxfmt
- **Type Check**: @typescript/native-preview (tsgo)
