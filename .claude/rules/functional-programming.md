# Functional Programming Patterns

## Immutable Rules

This project follows functional programming principles with immutable data patterns.

### Absolutely Forbidden

- **`let` keyword** - Use `const` exclusively
- **IIFE (Immediately Invoked Function Expression)** - Extract a named helper function instead
- **Non-null assertion operator (`!`)** - Use proper null checks instead
- **`forEach()` method** - Use `for...of` loops or array methods that return values
- **`any` type** - Use `unknown` for truly unknown data, or define proper types

### No IIFE - Extract Named Helper

When converting `let` + `if/else` to `const`, extract a named helper function instead of using an IIFE.

```typescript
// Correct - named helper function
const resolveLabel = (status: Status): string => {
  if (status === "active") return "Active";
  return "Inactive";
};

const label = resolveLabel(status);

// Forbidden - IIFE
const label = (() => {
  if (status === "active") return "Active";
  return "Inactive";
})();
```

### Variable Declaration

```typescript
// Always use const
const value = condition ? calculateValue() : undefined;

// Never reassign - create new values instead
const updatedArray = [...originalArray, newItem];
const updatedObject = { ...original, property: newValue };
```

### Array/Object Updates with Spread Operator

```typescript
// Adding to array
const newArray = [...existingArray, newItem];

// Updating object
const newObject = { ...existingObject, updatedField: newValue };

// Removing from array (filter creates new array)
const filtered = array.filter((item) => item.id !== targetId);
```

### Safe Array Access

```typescript
// Destructure first item
const [firstItem] = array;
if (firstItem !== undefined) {
  process(firstItem);
}

// Use optional chaining for nested access
const value = array[0]?.nested?.property;
```

### Loop Implementation

```typescript
// Standard iteration
for (const item of array) {
  process(item);
}

// When index is needed
for (const [index, item] of array.entries()) {
  process(index, item);
}

// Transformation (prefer map/filter/reduce)
const doubled = array.map((x) => x * 2);
const evens = array.filter((x) => x % 2 === 0);
const sum = array.reduce((acc, x) => acc + x, 0);
```

### Pure Functions

- Functions should have no side effects
- Same input always produces same output
- Side effects should be isolated to the edges of the system

## Side Effects Placement

All global side effects MUST be placed in the root `index.ts` or `layout.tsx` file of each module.

### What Are Global Side Effects?

- Extending libraries with plugins
- Setting global defaults
- Polyfills
- Global CSS imports
- Global state initialization

### Correct Pattern

```typescript
// app/layout.tsx - global CSS import
import '#/styles/globals.css';

export default ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
};
```

### Forbidden Pattern

```typescript
// app/components/header/index.tsx
import '#/styles/globals.css'; // NEVER do this in non-root files!
```

## Utility Function Patterns

### Pure Functions Only

All utility functions MUST be pure:

- No side effects
- Same input always produces same output
- No external state dependencies

```typescript
// Good: Pure function
export const formatDate = (date: Date, format: string): string => {
  // Transform input to output deterministically
};

// Bad: Side effect
export const formatDate = (date: Date): string => {
  console.log("Formatting date"); // Side effect!
  // ...
};
```

### Function Signature Guidelines

```typescript
// Good: Clear types
export const parseQuery = (query: string): ParsedQuery => {
  // ...
};

// Bad: Implicit any
export const parseQuery = (query) => {
  // ...
};
```
