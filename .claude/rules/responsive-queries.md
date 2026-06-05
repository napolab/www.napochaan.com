---
description: Components use container queries, layouts use media queries
paths:
  - "**/*.css.ts"
  - "**/*.tsx"
---

Use **container query** in components — respond to the container's own size, not the viewport.
Use **media query** in layout layers — control layout-level changes based on viewport width.

```
┌─── Layout (media query) ──────────────────┐
│  Switch layout based on viewport width     │
│                                            │
│  ┌─── Component (container query) ───┐     │
│  │  Adapt UI based on container size  │     │
│  └───────────────────────────────────┘     │
└────────────────────────────────────────────┘
```

- Component (`_components/**`): use `@container` to adapt to its own container size
- Layout / Page (`layout.tsx`, `page.tsx`): use `@media` for viewport-based layout changes
