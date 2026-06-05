---
description: Ban Boolean/String/Number wrapper coercions and Number.*; use explicit comparisons, literal strings, and global parseInt/parseFloat
paths:
  - "src/**/*.{ts,tsx}"
  - "worker/**/*.{ts,tsx}"
---

Never use the `Boolean` / `String` / `Number` wrapper functions for coercion, and never use `Number.parseInt` / `Number.parseFloat`.

- **Boolean check** → use an explicit `===` / `!==` comparison. Never `Boolean(x)`, never an implicit truthiness check like `if (x)` or `.filter(Boolean)`.
- **String conversion** → use a literal template string `` `${x}` ``.
- **Number parsing** → use global `parseInt` / `parseFloat` (or unary `+`).

| Banned                   | Use instead                                       |
| ------------------------ | ------------------------------------------------- |
| `Boolean(user)`          | `user !== null` / `user !== undefined`            |
| `if (value) { ... }`     | `if (value !== undefined) { ... }`                |
| `arr.filter(Boolean)`    | `arr.filter((v) => v !== undefined && v !== '')`  |
| `String(x)`              | `` `${x}` ``                                       |
| `Number(x)`              | `parseInt(x, 10)` / `parseFloat(x)` / `+x`        |
| `Number.parseInt(x, 10)` | `parseInt(x, 10)`                                 |
| `Number.parseFloat(x)`   | `parseFloat(x)`                                   |

```ts
// Good
user !== null
items.filter((item) => item !== undefined)
`${count}`
parseInt(value, 10)
parseFloat(value)
+input

// Bad
Boolean(user)
items.filter(Boolean)
String(count)
Number(input)
Number.parseInt(value, 10)
```
