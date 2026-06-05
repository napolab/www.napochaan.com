# Early Return & Minimal Branching

Prefer guard clauses, early returns, and flat control flow. Minimize `else` blocks and nesting depth.

Note: `no-else-return` lint rule already catches `else` after `return`. This rule covers broader patterns the linter cannot enforce.

## Guard Clauses

Return early for invalid/edge cases at the top. Happy path comes last.

```typescript
// Correct - guard clauses
const processUser = (user: User | undefined) => {
  if (!user) return null;
  if (!user.isActive) return null;

  return transform(user);
};

// Forbidden - nested if/else
const processUser = (user: User | undefined) => {
  if (user) {
    if (user.isActive) {
      return transform(user);
    } else {
      return null;
    }
  } else {
    return null;
  }
};
```

## Ternary for Simple Two-Branch Expressions

When both branches are short expressions (not statements), use ternary or conditional call.

```typescript
// Correct - ternary
const label = isActive ? "Active" : "Inactive";

// Avoid - if/else for simple value selection
if (isActive) {
  label = "Active";
} else {
  label = "Inactive";
}
```

## Max Nesting: 2 Levels

If nesting exceeds 2 levels, extract a helper or use early return with `continue`.

```typescript
// Too deep
for (const item of items) {
  if (item.isValid) {
    for (const child of item.children) {
      if (child.isActive) {
        // deep logic
      }
    }
  }
}

// Flat with continue + helper
const processChild = (child: Child) => {
  if (!child.isActive) return;
  // logic at flat level
};

for (const item of items) {
  if (!item.isValid) continue;
  for (const child of item.children) {
    processChild(child);
  }
}
```

## Strategy Selection Pattern

For multi-branch mode selection, extract strategy objects or use a map.

```typescript
// Correct - strategy map
const strategies = {
  primary: { bg: "accent.base", color: "text.inverse" },
  secondary: { bg: "bg.surface", color: "text.primary" },
} as const;

const style = strategies[variant];

// Avoid - repeated if/else for variant branching
if (variant === "primary") {
  // ...
} else {
  // ...
}
```

## Switch for Discriminated Unions

Prefer exhaustive `switch` over `if/else` chains for union types.

```typescript
// Correct - exhaustive switch
const getIcon = (type: "success" | "warning" | "error") => {
  switch (type) {
    case "success": return <CheckIcon />;
    case "warning": return <AlertIcon />;
    case "error": return <ErrorIcon />;
  }
};

// Avoid - if/else chain
const getIcon = (type: "success" | "warning" | "error") => {
  if (type === "success") return <CheckIcon />;
  else if (type === "warning") return <AlertIcon />;
  else return <ErrorIcon />;
};
```

## Summary

| Pattern                            | Use When                                |
| ---------------------------------- | --------------------------------------- |
| Guard clause + early return        | Validating preconditions                |
| Ternary                            | Selecting between two short expressions |
| Conditional variable + single call | Two branches differ only in argument    |
| `continue` in loops                | Skipping invalid items                  |
| Extract helper function            | Nesting exceeds 2 levels                |
| Strategy map/object                | Repeated mode-based branching           |
| Exhaustive `switch`                | Discriminated union dispatch            |
