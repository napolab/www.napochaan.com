---
description: Require TDD (Red-Green-Refactor) for utils, components, and page-specific components in both apps
paths:
  - "apps/*/src/utils/**/*.{ts,tsx}"
  - "apps/*/src/components/**/*.{ts,tsx,astro}"
  - "apps/cms/src/app/**/_components/**/*.{ts,tsx}"
  - "apps/web/src/features/**/*.{ts,tsx,astro}"
---

Code under `src/utils/`, `src/components/`, and page-specific components (apps/cms: colocated `_components/`; apps/web: `src/features/`) must be developed with TDD.

Invoke the `superpowers:test-driven-development` skill and follow the Red → Green → Refactor cycle.

- Place test files next to the implementation: `*.test.ts` / `*.test.tsx`
- Use vitest as the test runner: `pnpm vitest run <path>` to run a single file
- Follow the progression: fake it → triangulate → obvious implementation
