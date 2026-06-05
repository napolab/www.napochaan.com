# No Barrel Imports

Do not use `index.ts` as a barrel file that only re-exports. Consumers must import directly from the source module.

## Forbidden

```typescript
// components/index.ts - barrel file with re-exports only
export { Button } from './button';
export { Hero } from './hero';
export type { ButtonProps } from './button';
```

```typescript
// consumer imports via barrel
import { Button, Hero } from './components';
```

## Required

```typescript
// consumer imports directly
import { Button } from './components/button';
import { Hero } from './components/hero';
```

## When `index.ts` Is Allowed

When `index.ts` contains actual logic or definitions, it is a regular module, not a barrel:

```typescript
// components/button/index.tsx - contains component implementation -> OK
export const Button = (props: ButtonProps) => { ... };
```

## Why

- Better tree-shaking
- Import sources are explicit and easy to trace
- Reduces risk of circular dependencies
- Large barrels negatively impact bundle size
