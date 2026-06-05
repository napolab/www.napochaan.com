---
description: next/dynamic with ssr:false must be used in Client Components only
paths:
  - "src/app/**/*.tsx"
---

`next/dynamic({ ssr: false })` is **not allowed in Server Components**. Next.js App Router treats all components as Server Components by default, and `ssr: false` requires a Client Component boundary.

## Pattern

Wrap the dynamic import in a dedicated client component file:

```
_components/
  hero-canvas/
    index.tsx          ← 'use client' + dynamic({ ssr: false })
    hero-canvas.tsx    ← actual implementation
```

```tsx
// _components/hero-canvas/index.tsx
'use client';
import dynamic from 'next/dynamic';

export const HeroCanvas = dynamic(
  () => import('./hero-canvas').then((m) => ({ default: m.HeroCanvas })),
  { ssr: false },
);
```

## Do NOT

- Use `dynamic({ ssr: false })` directly in `page.tsx` or `layout.tsx` (these are Server Components)
- Add `'use client'` to a page just to use `dynamic({ ssr: false })`
