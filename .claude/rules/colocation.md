---
paths:
  - "src/**/*.{ts,tsx}"
---

# Colocation Pattern

Functions and their tests are colocated in the same directory.

## Directory Structure

```
<function-name>/
├── index.ts                    # Implementation
└── <function-name>.test.ts     # Test
```

### Example

```
utils/
├── format-date/
│   ├── index.ts                   # Pure function
│   └── format-date.test.ts
└── parse-query/
    ├── index.ts                   # Pure function
    └── parse-query.test.ts
```

## Benefits

- **Discoverability**: Tests are right next to implementation
- **Easy to move**: Move or delete entire directory
- **Clear scope**: Each directory has single responsibility

## When to Use

| Scenario                   | Colocation |
| -------------------------- | ---------- |
| Pure functions (testable)  | Yes        |
| Grouping related functions | Yes        |
| Utility modules            | Yes        |

## Import Pattern

```typescript
// External imports use parent directory
import { formatDate } from './utils/format-date';
import { parseQuery } from './utils/parse-query';

// Internal imports can be direct
import { createTemplate } from './create-template';
```

## Test Discovery

Vitest auto-discovers with `**/*.test.ts` pattern, so colocated tests run correctly.
