---
name: composing-domain-functions
description: Use when writing or refactoring a guard, validator, policy, or decision with several conditions — an if-chain of checks in one function, a predicate that ANDs several header/path/method tests inline, or a middleware/handler body that builds input, decides, and applies effects in one place. Express the domain as small single-responsibility functions composed together.
---

# Composing Domain Functions

## Rule

Complex domain logic is **small single-responsibility functions + composition**, not one function with a serial if-chain.
Each function answers one question or does one thing; the domain rule reads as the composition of them.

Repeated owner feedback: 「小さい関数に分割して関数合成で表現して欲しい」(2026-07-16, MCP SSRF guard) and
「細かく単一責任で関数を作って関数合成で複雑なドメインを表現してほしい」(2026-10-15, worker /admin path policy).

## Shape

| Layer | What it is | Example |
| --- | --- | --- |
| Generic combinators | one-line, domain-free | `allOf`, `not`, `on(select, p)`, `equals`, `isIn` (`worker/lib/predicate`) / `composeValidators` (`src/lib/mcp/tools`) |
| Domain predicates | one fact each, built from combinators | `isWithinPath('/admin')`, `isCrossSite`, `isNavigationMethod` |
| Domain rules | composition of predicates, named for the rule | `isCrossSiteNavigation = allOf(isNavigationMethod, byHeaders(allOf(isCrossSite, isDocumentDest)))` |
| Plugin / policy | rule + result constructor | `when(rule, () => redirectTo('/admin'))` (see `prefix-match-processor`) |
| Effect boundary | build input → decide → apply, each its own function | `toPathRequest(c)` → `resolve` → `switch` → `applyRedirect` / `applyFrameHeaders` |

```ts
// Bad — one function decides everything inline
run: (input) => {
  if (!['GET', 'HEAD'].includes(input.method)) return err(input);
  if (input.headers.get('Sec-Fetch-Site') !== 'cross-site') return err(input);
  if (!input.pathname.startsWith('/admin/') || input.pathname === '/admin/') return err(input);
  return ok({ kind: 'redirect', location: '/admin' });
};

// Good — the rule is the composition
export const adminLandingPlugin = when(allOf(isCrossSiteNavigation, byPathname(isDescendantOf(ADMIN_ROOT))), () => redirectTo(ADMIN_ROOT));
```

## Checklist

- A function with 3+ guard clauses checking unrelated facts → split each fact into a predicate/validator and compose.
- A middleware/handler that reads input, decides, and writes the response → separate `toX(c)`, decision, and `applyY` functions; the body only wires them.
- Name the composed rule after the domain concept (`isCrossSiteNavigation`), not after the mechanics.
- Each small function gets its own test; the composition gets a test for the rule as a whole.
- Don't add a combinator nothing uses — composition, not a framework.
- Validators return the first error (`composeValidators`); predicates return boolean; plugins return `Result` (`err(input)` on no match).
