# Coding Rules

## Package Management

- Install modules: `pnpm add <package>`
- Uninstall modules: `pnpm remove <package>`

## TypeScript Configuration

- **DO NOT modify** `tsconfig.json` `paths` settings
- If path changes are needed, use `AskUserQuestion` to discuss first

## Development Scripts

| Command          | Description                                         |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | Start development server                            |
| `pnpm build`     | Production build                                    |
| `pnpm start`     | Start production server                             |
| `pnpm lint`      | Run oxlint                                          |
| `pnpm fmt`       | Format code (oxfmt + oxlint --fix)                  |
| `pnpm typecheck` | Type check with `@typescript/native-preview` (tsgo) |

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

- **Framework**: vinext (Vite-based Next.js reimplementation)
- **UI**: React 19 + Panda CSS
- **Accessibility**: react-aria-components
- **Server Components**: @vitejs/plugin-rsc
- **Build**: Vite 7
- **Linting**: oxlint + oxfmt
- **Type Check**: @typescript/native-preview (tsgo)
