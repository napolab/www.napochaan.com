---
paths:
  - "src/**/*.css.ts"
---

# Panda CSS Design Token Usage (Strict Mode)

All colors and spacing must use design tokens defined in `panda.config.ts`. Arbitrary values are forbidden and will cause build errors (`strictTokens: true`).

## Correct Usage

```ts
// Correct - using tokens
export const card = css({
  padding: '4',              // spacing token
  color: 'text.primary',     // semantic color token
  bg: 'bg.surface',          // semantic color token
  gap: '2',                  // spacing token
})
```

## Forbidden Patterns

```ts
// Wrong - hardcoded values (build error)
export const card = css({
  padding: '16px',           // arbitrary value
  color: '#333333',          // hardcoded color
  backgroundColor: 'black',  // hardcoded color
  gap: '0.5rem',             // arbitrary value
})
```

## Available Tokens

Refer to `panda.config.ts` for the complete token definitions. The project uses Panda CSS defaults with `strictTokens: true`.

### Common Default Tokens

- **Spacing**: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20`, `24`
- **Sizes**: `full`, `screenW`, `screenH`
- **Colors**: Use semantic token names from the theme
- **Font Sizes**: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, etc.
- **Border Radius**: `sm`, `md`, `lg`, `xl`, `full`

## Adding New Tokens

If a required token does not exist, do NOT hardcode values. Instead:

1. Use `AskUserQuestion` to ask about adding the token to `panda.config.ts`
2. Propose a semantic name that fits the existing token structure
3. Wait for approval before implementing

## Style File Structure

```ts
// styles.css.ts
import { css, cva } from "@styled/css";

// Simple styles with css()
export const root = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
  padding: "4",
});

// Variant styles with cva()
export const button = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "md",
  },
  variants: {
    size: {
      sm: { padding: "2", fontSize: "sm" },
      md: { padding: "4", fontSize: "md" },
    },
  },
});
```

## Reference

Refer to `panda.config.ts` for the complete token definitions.
