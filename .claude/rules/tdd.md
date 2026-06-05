---
description: Require TDD (Red-Green-Refactor) for lib, components, and colocated _components
paths:
  - "src/utils/**/*.{ts,tsx}"
  - "src/components/**/*.{ts,tsx}"
  - "src/app/**/_components/**/*.{ts,tsx}"
---

Code under `src/utils/`, `src/components/`, and colocated `_components/` must be developed with TDD.

Invoke the `superpowers:test-driven-development` skill and follow the Red → Green → Refactor cycle.

- Place test files next to the implementation: `*.test.ts` / `*.test.tsx`
- Use vitest as the test runner: `pnpm vitest run <path>` to run a single file
- Follow the progression: fake it → triangulate → obvious implementation
