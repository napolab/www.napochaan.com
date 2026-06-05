---
paths:
  - "src/**/*"
---

# File and Directory Naming Conventions

## Kebab-Case Everywhere

All files and directories use kebab-case:

```
components/
├── primary-button/      # NOT PrimaryButton/ or primaryButton/
├── hero-section/
└── navigation-menu/

hooks/
├── use-scroll.ts        # NOT useScroll.ts
├── use-intersection.ts
└── use-media-query.ts

utils/
├── format-date.ts       # NOT formatDate.ts
├── parse-query.ts
└── validate-email.ts
```

## Namespace Convention

When a directory provides namespace context, child files should NOT repeat that namespace:

```
# Correct
hooks/
├── use-scroll.ts        # "use-" prefix is standard for hooks
├── use-intersection.ts
└── use-media-query.ts

components/
├── button/
│   ├── index.tsx        # NOT button-component.tsx
│   └── styles.css.ts
├── hero/
│   ├── index.tsx
│   └── styles.css.ts

# Incorrect
components/
├── button/
│   ├── button-component.tsx  # Redundant - already in button/
│   └── button-styles.css.ts  # Redundant
```

## Component Directory Structure

Each component lives in its own directory:

```
<component-name>/
├── index.tsx                    # Component implementation & exports
├── styles.css.ts                # Panda CSS styles (NOT <name>.styles.ts)
└── <component-name>.test.tsx    # Tests (e.g., primary-button.test.tsx)
```

### Example

```
primary-button/
├── index.tsx
├── styles.css.ts
└── primary-button.test.tsx
```

## Style Naming Convention

Use `xxxRoot` pattern for root/wrapper elements. Never use `container`, `wrapper`, or similar generic names:

```ts
// Correct - xxxRoot pattern
export const root = css({ ... })        // Component's root element
export const headerRoot = css({ ... })  // Header section
export const listRoot = css({ ... })    // List wrapper

// Wrong - generic names
export const container = css({ ... })
export const wrapper = css({ ... })
```

### Style Import Pattern

Always import styles as namespace:

```tsx
// Correct - namespace import
import * as styles from './styles.css'

<div className={styles.root}>
  <h1 className={styles.heading}>Title</h1>
</div>
```

```tsx
// Wrong - named exports
import { root, heading } from './styles.css'
```

## Test File Naming

- Unit tests: `<component-name>.test.tsx`
- Integration tests: `<feature-name>.integration.test.ts`

Always colocate tests with the code they test.
