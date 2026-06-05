---
description: Use data-* attributes for UI variant styling — no conditional classNames or ternary style props
paths:
  - "**/*.css.ts"
  - "**/*.tsx"
---

Use `data-*` attributes to express UI variants. Define all visual differences in `.css.ts` via attribute selectors — never branch with conditional classNames or ternary style props.

## Correct

```ts
// styles.css.ts
export const badge = css({
  px: '2',
  py: '1',
  borderRadius: 'md',
  fontSize: 'sm',
  '&[data-status="success"]': { bg: 'success', color: 'fg.onEmphasis' },
  '&[data-status="warning"]': { bg: 'warning', color: 'fg' },
  '&[data-status="danger"]':  { bg: 'danger',  color: 'fg.onEmphasis' },
})
```

```tsx
// index.tsx
<span className={badge} data-status={status}>
```

## Incorrect

```tsx
// Conditional className — splits style logic across JS and CSS
<span className={status === 'success' ? successStyle : dangerStyle}>

// Ternary style prop — bypasses design system
<span style={{ color: isActive ? 'green' : 'red' }}>
```

## Why

- One className, one source of truth — no `${isActive ? activeStyle : inactiveStyle}` tangles
- Inspectable in DevTools — `data-status="danger"` is self-documenting
- Composable — multiple `data-*` attributes can combine without className merging logic
- Panda CSS conditions (`_hover`, `_open`) already follow this pattern via `data-*` selectors
