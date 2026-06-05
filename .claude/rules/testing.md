---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing Conventions

## Vitest for Testing

Use Vitest for all tests in this project.

### Test Pattern

```tsx
import { describe, it, expect } from "vitest";

describe("formatDate", () => {
  it("should format valid date", () => {
    const result = formatDate(new Date("2024-01-15"), "YYYY-MM-DD");
    expect(result).toBe("2024-01-15");
  });
});
```

### Component Testing

```tsx
import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "@vitest/browser/context";

describe("Button", () => {
  it("should render children", async () => {
    render(<Button>Click me</Button>);
    await expect.element(page.getByRole("button", { name: "Click me" })).toBeVisible();
  });
});
```

### Query Priority

Use queries in this order (most to least preferred):

1. `page.getByRole()` - Accessible to everyone
2. `page.getByLabelText()` - Form elements
3. `page.getByPlaceholderText()` - When no label
4. `page.getByText()` - Non-interactive elements
5. `page.getByTestId()` - Last resort

### Interaction Testing

```typescript
it("should call handler when clicked", async () => {
  const handleClick = vi.fn();
  render(<Button onPress={handleClick}>Click</Button>);

  await page.getByRole("button", { name: "Click" }).click();

  expect(handleClick).toHaveBeenCalledOnce();
});
```

## Test Organization

Colocate tests with the code they test:

```
components/button/
├── index.tsx
├── styles.css.ts
└── button.test.tsx

utils/format-date/
├── index.ts
└── format-date.test.ts
```

## Test File Naming

- Unit tests: `<module-name>.test.ts` or `<module-name>.test.tsx`
- Integration tests: `<feature-name>.integration.test.ts`
