---
description: "Iteration, branching, and purity conventions for TypeScript/React code"
paths:
  - "src/**/*.{ts,tsx}"
---

## Functions

- Always use arrow function expressions (`const foo = () => {}`)
- The `function` keyword is only allowed for override methods

## Iteration

- Use `for...of` instead of `forEach`
- When no side effects or sequential dependency is needed, prefer `map` over `for`
- Use `map` / `filter` / `reduce` for data transformations (mapping, filtering, folding)

```ts
// BAD
items.forEach((item) => { ... })

// GOOD
for (const item of items) { ... }

// GOOD — pure data transformation
const names = items.map((item) => item.name)
const active = items.filter((item) => item.isActive)
```

## Branching

- Avoid `if` / `else if` / `else` chains for multi-state logic
- Guard clauses (`if (!x) return`, `if (x == null) throw`) are fine
- Represent state as discriminated unions and use `switch` for pattern matching
- `switch` enables exhaustiveness checking — the compiler catches unhandled cases

```ts
// BAD
if (state === "loading") { ... }
else if (state === "error") { ... }
else { ... }

// GOOD
type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "success"; data: Data }

switch (state.kind) {
  case "loading": return <Spinner />
  case "error":   return <Error message={state.message} />
  case "success": return <View data={state.data} />
}
```

## Purity

- Functions must be immutable — never mutate arguments or external state
- Prefer pure functions: same input always produces same output, no side effects
