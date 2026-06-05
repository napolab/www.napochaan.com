---
paths:
  - "src/**/*.{ts,tsx}"
---

# Component Development Rules

## Colocation Principle

Keep all related files for a component in the same directory. This ensures maintainability and makes it easy to understand, test, and delete components as a unit.

### Directory Structure

Each component MUST follow this structure:

```
<component-name>/
├── index.tsx                    # Component implementation & exports
├── styles.css.ts                # Panda CSS styles (recipes, patterns)
└── <component-name>.test.tsx    # Unit tests
```

### Example

```
primary-button/
├── index.tsx
├── styles.css.ts
└── primary-button.test.tsx
```

### Function Modules (utilities, hooks, etc.)

```
module-name/
├── index.ts               # Module implementation & exports
└── module-name.test.ts    # Module tests
```

### Nested Components Example

```
components/
├── button/
│   ├── index.tsx
│   ├── styles.css.ts
│   └── button.test.tsx
└── hero-section/
    ├── index.tsx
    ├── styles.css.ts
    └── hero-section.test.tsx
```

## Rules

- Use **kebab-case** for all directory and file names
- `index.tsx` / `index.ts` is the single entry point for each module
- Styles must be in `styles.css.ts` (Panda CSS), not inline or separate CSS files
- Test files use the module name: `<module-name>.test.tsx` or `<module-name>.test.ts`
- Never scatter related files across different directories

## Styling with Panda CSS

### Use Design Tokens

Always use Panda CSS design tokens. Never hardcode raw values:

```ts
// Correct - using design tokens
export const button = css({
  color: "text.primary",
  bg: "bg.surface",
  padding: "4",
  gap: "2",
  fontSize: "md",
  borderRadius: "lg",
});

// Incorrect - hardcoded values
export const button = css({
  color: "#333333",
  backgroundColor: "#0066cc",
  padding: "16px",
});
```

**If a required token does not exist**, use `AskUserQuestion` to ask whether to add it to panda.config.ts or use an alternative.

### Responsive Design

- Components use **container queries** for responsive behavior (never media queries)
- Pages/layouts use **media queries** and propagate state to components via CSS variables or data attributes
- See `.claude/skills/responsive-design/SKILL.md` for decision flow and patterns

### Style Import Convention

Component files MUST import styles using namespace imports:

```tsx
// Correct
import * as styles from "./styles.css";

// Incorrect
import styles from "./styles.css";
import * as css from "./styles.css";
```

### Style Naming Rules

| Rule           | Correct      | Incorrect                          |
| -------------- | ------------ | ---------------------------------- |
| Root element   | `root`       | `container`, `wrapper`             |
| Sub-containers | `headerRoot` | `headerContainer`, `headerWrapper` |
| Max 3 words    | `cardTitle`  | `messageWallItemTimestamp`         |

### No Child Selectors

```ts
// Incorrect
export const card = css({
  "& h3": { fontSize: "1.5rem" },
});

// Correct - separate styles
export const card = css({ padding: "4" });
export const cardTitle = css({ fontSize: "lg" });
```

**Allowed selectors**: `&:hover`, `&:focus`, `&:nth-child()`, `&::placeholder`, `&[disabled]`, `&[data-*]`

## Design System Catalog

Every component in `src/components/` MUST have a corresponding showcase page at `src/app/(design-system)/components/<component-name>/page.tsx`.

- The showcase page demonstrates the component's variants, states, and usage
- To discover available components, check `src/app/(design-system)/components/` first
- Creating a new component without its showcase page is incomplete

## Accessibility

Use **react-aria-components** as the foundation for interactive components.

Reference: https://react-aria.adobe.com/llms.txt

```tsx
import { Button } from "react-aria-components";

export const PrimaryButton = (props: ButtonProps) => {
  return <Button className={styles.button} {...props} />;
};
```
