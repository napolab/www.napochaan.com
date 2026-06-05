---
paths:
  - "**/*.{ts,tsx}"
---

# TypeScript Type Safety Rules

## Type Assertions

### Always Use `satisfies` Over `as`

```typescript
// Correct - type checking with satisfies
const config = {
  port: 3000,
  host: "localhost",
} satisfies ServerConfig;

// Incorrect - as bypasses type checking
const config = {
  port: 3000,
  host: "localhost",
} as ServerConfig;
```

### Use `unknown` Over `any`

```typescript
// Correct - forces type narrowing
const parseJson = (input: string): unknown => JSON.parse(input);

// Then narrow with type guards
const isUser = (value: unknown): value is User => {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
};

// Incorrect - loses all type safety
const parseJson = (input: string): any => JSON.parse(input);
```

## Interface vs Type Philosophy

### Use `interface` for Behaviors and Contracts

Interfaces define **what something can do** - function signatures, class contracts, API definitions:

```typescript
// Behavior contracts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// Function signatures
interface Comparator<T> {
  (a: T, b: T): number;
}
```

### Use `type` for Data Structures

Types define **what something is** - data shapes, unions, computed types:

```typescript
// Data structures
type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string; // RFC3339 format
};

// Union types
type Status = "pending" | "active" | "completed";

// Computed types
type UserKeys = keyof User;
type PartialUser = Partial<User>;
```

## Type Guards

Implement proper type guards for runtime type checking:

```typescript
// Type guard function
const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

// Discriminated unions
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

const handleResult = <T, E>(result: Result<T, E>) => {
  if (result.success) {
    return result.value;
  }
  throw result.error;
};
```

## Strict Null Checks

Always handle null/undefined explicitly:

```typescript
// Use optional chaining
const name = user?.profile?.displayName;

// Use nullish coalescing
const displayName = user?.name ?? "Anonymous";

// Explicit null checks
if (user !== null && user !== undefined) {
  processUser(user);
}
```

## Path Aliases

### Use Configured Aliases

When path aliases are configured in `tsconfig.json`, always use them instead of relative paths:

```typescript
// Correct - use configured aliases
import { Button } from "@components/button";
import { css } from "@styled/css";

// Incorrect - deep relative paths when aliases exist
import { Button } from "../../components/button";
import { css } from "../../styled-system/css";
```

### Available Aliases in This Project

- `@components/*` - `./src/components/*` (UI components)
- `@themes/*` - `./src/themes/*` (theme provider, global styles)
- `@styled/*` - `./styled-system/*` (Panda CSS generated)

### Forbidden Aliases

- **Project root alias** (`#/*` → `./src/*` etc.) is forbidden. Do not alias the entire project root. Use specific aliases for specific directories, or relative paths for non-aliased imports.
