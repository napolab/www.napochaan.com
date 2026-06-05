# Getter Pattern for Object Literals

When building an object literal where each property has its own derivation logic, use getter syntax instead of ternary expressions or intermediate variables.

## Required Pattern

```typescript
return {
  get title() {
    if (!meta?.title) return fallbackTitle;
    return meta.title;
  },
  get description() {
    return meta?.description ?? fallbackDescription;
  },
  get openGraph() {
    const images = resolveImages(meta);
    if (!images) return undefined;
    return { images };
  },
};
```

## Avoid Pattern

```typescript
// Avoid - intermediate variables and ternaries
const title = meta?.title ?? fallbackTitle;
const description = meta?.description ?? fallbackDescription;
const images = resolveImages(meta);
const openGraph = images ? { images } : undefined;

return { title, description, openGraph };
```

## Why

- **Early return**: Each getter can use guard clauses and early returns, avoiding nested ternaries
- **Encapsulation**: Derivation logic is scoped to the property it belongs to
- **Readability**: Complex branching stays flat and linear

This pattern is an alternative to extracting named helper functions (see `functional-programming.md`) when the derivation logic is tightly coupled to a specific property in an object literal.

## Caveat

Getters re-evaluate on every property access. This pattern is appropriate for objects that are consumed immediately (e.g., returned metadata objects). Do not use it for long-lived objects where repeated evaluation would be wasteful or produce inconsistent results.

## When to Use

| Scenario                                   | Use Getter                 |
| ------------------------------------------ | -------------------------- |
| Property needs early return / guard clause | Yes                        |
| Property has multi-step derivation         | Yes                        |
| Simple fallback (`a ?? b`)                 | Either is fine             |
| Property is a plain constant               | No - use direct assignment |

## When NOT to Use

- Class instances: use method shorthand (see `function-style.md`)
- Shared state or side effects: getters should remain pure
- Long-lived objects accessed multiple times: use plain properties
