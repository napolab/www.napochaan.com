# Function Style

## Arrow Functions Only

All top-level functions must use arrow function syntax (`const fn = () => {}`). The `func-style` rule enforces this.

### Required Pattern

```typescript
// Correct - arrow function
export const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Correct - React component
export const Button = ({ children, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{children}</button>;
};
```

### Forbidden Pattern

```typescript
// Wrong - function declaration
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Wrong - function expression with function keyword
export const calculateTotal = function(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

### Exception: TypeScript Function Overloads

TypeScript function overloads require `function` declarations. Use `eslint-disable` comments:

```typescript
// eslint-disable-next-line func-style -- overloads require function declaration
export function overloadedFn(a: string): string;
export function overloadedFn(a: number): number;
export function overloadedFn(a: string | number): string | number {
  return a;
}
```

### Why Arrow Functions?

- **Consistent syntax**: One way to write functions across the codebase
- **Lexical `this`**: Arrow functions don't have their own `this` binding
- **Concise**: Shorter syntax for simple functions
- **Hoisting**: `const` declarations aren't hoisted, making dependencies explicit

## Class Method Style

Class methods must use method shorthand syntax, not arrow function properties.

### Required Pattern

```typescript
class MyService {
  // Correct - method shorthand syntax
  getData(): Data {
    return this.#data;
  }

  // Correct - async method
  async fetchData(): Promise<Data> {
    return await this.#client.get();
  }
}
```

### Forbidden Pattern

```typescript
class MyService {
  // Wrong - arrow function property
  getData = (): Data => {
    return this.#data;
  };

  // Wrong - async arrow function
  fetchData = async (): Promise<Data> => {
    return await this.#client.get();
  };
}
```

### Why Method Syntax in Classes?

| Aspect        | Method Syntax                   | Arrow Property                 |
| ------------- | ------------------------------- | ------------------------------ |
| Prototype     | Shared on prototype             | Duplicated per instance        |
| Memory        | Efficient                       | Inefficient for many instances |
| Override      | Can be overridden in subclasses | Cannot be overridden           |
| `super` calls | Supported                       | Not supported                  |

### Combining Both Rules

Top-level functions use arrow syntax; class methods use method shorthand:

```typescript
// Correct - top-level arrow function
export const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

class MyService {
  // Correct - class method
  getTotal(): number {
    return calculateTotal(this.#items);
  }
}
```
