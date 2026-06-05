---
description: Use padding for internal spacing, margin for external spacing between siblings
paths:
  - "**/*.css.ts"
  - "**/*.tsx"
---

Use `padding` for spacing inside a component's own boundary (space between the component's edge and its children).
Use `margin` for spacing outside a component's boundary (distance between sibling components).

```
┌─── Component ───────────────┐
│  ← padding (inner space) →   │
│   ┌── Child ──────────┐     │
│   └───────────────────┘     │
└─────────────────────────────┘
      ↕ margin (outer space)
┌─── Sibling ─────────────────┐
└─────────────────────────────┘
```
