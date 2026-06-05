# Type Coercion Rules

## String Conversion: Use Template Literals

Use template literals instead of `String()` constructor for type conversion.

```typescript
// Correct - template literal
const str = `${value}`;
const message = `Count: ${count}`;

// Forbidden - String() constructor
const str = String(value);
const message = "Count: " + String(count);
```

### Why Template Literals?

- Consistent with `restrict-template-expressions` lint rule (already enforced)
- More readable when embedding in larger strings
- No function call overhead

## Number Conversion: Use parseInt / parseFloat

Use `parseInt()` or `parseFloat()` instead of `Number()` constructor for type conversion.

```typescript
// Correct - explicit parse functions
const intValue = parseInt(str, 10);
const floatValue = parseFloat(str);

// Forbidden - Number() constructor
const intValue = Number(str);
const floatValue = Number(str);

// Forbidden - unary plus operator
const intValue = +str;
```

### Choosing Between parseInt and parseFloat

| Function     | Use When                              | Example                        |
| ------------ | ------------------------------------- | ------------------------------ |
| `parseInt`   | Integer values (always pass radix 10) | `parseInt("42", 10)` -> `42`   |
| `parseFloat` | Decimal values                        | `parseFloat("3.14")` -> `3.14` |

### Always Pass Radix to parseInt

```typescript
// Correct - explicit radix
const value = parseInt(str, 10);

// Wrong - missing radix
const value = parseInt(str);
```
