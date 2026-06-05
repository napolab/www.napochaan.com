---
description: Prohibit inline style props — use .css.ts classes or CSS variables instead
paths:
  - "**/*.css.ts"
  - "**/*.tsx"
---

The `style` prop is **not allowed** except for CSS custom properties (variables).

## Rules

1. **Static values** → define in `.css.ts`
2. **Dynamic values** → pass via CSS custom property, consume in `.css.ts`
3. **Visibility toggling** → use `data-*` attribute + CSS selector
4. **Third-party components** (R3F Canvas, etc.) that only accept `style` → allowed as exception, add `// style-prop: third-party` comment

## Dynamic values — correct

```ts
// styles.css.ts
export const bar = css({
  width: 'var(--bar-width)',
})
```

```tsx
// index.tsx
<div className={bar} style={{ '--bar-width': `${progress}%` } as CSSProperties}>
```

## Visibility toggling — correct

```ts
// styles.css.ts
export const root = css({
  visibility: 'hidden',
  '&[data-ready]': { visibility: 'visible' },
})
```

```tsx
// index.tsx
<div className={root} data-ready={isReady || undefined}>
```

## Incorrect

```tsx
// Static values in style prop — move to .css.ts
<div style={{ position: 'absolute', top: '5%', zIndex: 5 }}>

// Visibility via style prop — use data attribute
<div style={{ visibility: isReady ? 'visible' : 'hidden' }}>

// Standard CSS value in style prop — move to .css.ts
<div style={{ background: 'transparent' }}>
```

## Why

- Keeps visual logic in `.css.ts` where it can use tokens, media queries, and conditions
- `style` props bypass the design system and cannot be linted by Panda CSS
- CSS variables are the only acceptable bridge between JS state and CSS
