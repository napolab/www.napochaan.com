---
paths:
  - "src/**/*.{ts,tsx}"
---

# Data Attribute Styling Pattern

Dynamic styling must use data attributes with CSS selectors instead of inline styles. This keeps styling declarative and in CSS.

## Pattern

```tsx
// Correct - data attribute with CSS selector
<div className={styles.badge} data-variant={variant} />

// styles.css.ts
export const badge = css({
  bg: 'bg.surface', // default
  '&[data-variant="success"]': { bg: 'state.success' },
  '&[data-variant="warning"]': { bg: 'state.warning' },
  '&[data-variant="error"]': { bg: 'state.error' },
});
```

```tsx
// Incorrect - inline style with dynamic value
<div className={styles.badge} style={{ backgroundColor: color }} />
```

## When to Use

| Scenario                               | Use Data Attribute    |
| -------------------------------------- | --------------------- |
| Dynamic colors from a known set        | Yes                   |
| State-based styling (active, selected) | Yes                   |
| Theme variants                         | Yes                   |
| Truly arbitrary values (user input)    | No - use CSS variable |

## CSS Implementation

Always define default style and all variants:

```ts
export const statusIndicator = css({
  // Base styles
  width: '[10px]',
  height: '[10px]',
  borderRadius: 'full',

  // Default state (no data-status)
  bg: 'transparent',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'border.default',

  // Status variants - use Panda tokens
  '&[data-status="active"]': { bg: 'state.success', borderColor: 'transparent' },
  '&[data-status="warning"]': { bg: 'state.warning', borderColor: 'transparent' },
  '&[data-status="error"]': { bg: 'state.error', borderColor: 'transparent' },
});
```

## CSS Variable Fallback

For truly arbitrary values (e.g., user-input colors not in palette), use CSS variables:

```tsx
// Only when color is not from known palette
const style = { '--custom-color': userInputColor } as CSSProperties;
<div className={styles.customColor} style={style} />
```

```ts
export const customColor = css({
  backgroundColor: 'var(--custom-color, transparent)',
});
```

## Benefits

- **Declarative**: Styling logic stays in CSS
- **Type-safe**: Mapping functions catch invalid values at compile time
- **Design tokens**: Uses Panda CSS tokens consistently
- **Debuggable**: Data attributes visible in DevTools
- **No eslint-disable**: Avoids `react/forbid-dom-props` violations
- **Testable**: Data attributes can be asserted in tests

## Related

- `react.md` - State-based styling with data attributes
- `panda-css.md` - Design token usage
- `components.md` - Style import conventions
