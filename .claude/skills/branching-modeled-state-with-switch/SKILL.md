---
name: branching-modeled-state-with-switch
description: Use when writing TypeScript that branches on a value carrying a modeled state — a discriminated union, a status/kind/type tag, or any state-machine state — to choose behavior or a return value, or when adding a variant to such a union. Also when reaching for an if/else-if chain, an assertNever helper, or a lookup map to consume a tagged union.
---

# Branching Modeled State With switch

## Overview

When a value models state as a discriminated union, **branch on it with `switch` keyed on the discriminant, and make the `default` branch assign the value to `never` inline.** A forgotten variant then becomes a typecheck failure that points at the exact `switch`, not a silent runtime fallthrough.

This skill is the *consume* side of a modeled type. **REQUIRED SUB-SKILL:** Use `precise-type-modeling` to model the union in the first place (`kind`/`status`/`type` discriminant, all states represented, no `any`/`Record`).

## The recipe (NEW and existing code)

```ts
type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; value: string }
  | { kind: "failed"; error: string };

function label(state: FetchState): string {
  switch (state.kind) {
    case "idle":
      return "待機中";
    case "loading":
      return "読み込み中";
    case "ready":
      return state.value; // narrowed: state.value is in scope here
    case "failed":
      return `失敗（${state.error}）`; // narrowed: state.error is in scope here
    default: {
      const _exhaustive: never = state;
      throw new Error(`unhandled state: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
```

Add a variant `{ kind: "cancelled"; at: number }` to the union and `state` in `default` is no longer `never` — `const _exhaustive: never = state` fails to compile, pointing at this `switch`. Add the `case`, the build goes green. The `default` also guards malformed wire data at runtime.

## When the discriminant has no narrowable fields

If branches are pure constant mappings AND no branch needs per-variant fields, a `satisfies Record<...>` lookup is also exhaustive and fine:

```ts
const LABEL = {
  idle: "待機中",
  loading: "読み込み中",
} satisfies Record<FetchState["kind"], string>;
```

The moment any branch needs a per-variant field (`state.value`, `state.error`), go back to `switch` — the map can't reach those fields.

## Why not the alternatives

| Anti-pattern | Why it fails |
|---|---|
| `if (s.kind === "x") … if (s.kind === "y") …` + trailing `return fallback` | The fallback silently swallows a new variant — no compile error. if-chains give no exhaustiveness. |
| `assertNever(state)` helper in `default` | A thin wrapper — banned here (`薄い wrapper 関数は作らない`). Inline the `const _exhaustive: never = state` instead. |
| `Record` map when a branch needs a per-variant field | The map throws away discriminant narrowing; you lose access to the variant's fields. |
| `default: return ""` / `default: return fallback` | Defeats the whole point — a forgotten variant compiles and ships. |

## Common mistakes

- Adding a `default` that returns a fallback "to be safe" — it disables exhaustiveness. The `default` must assign to `never`.
- Introducing `assertNever` (or `exhaustiveCheck`, `absurd`) helpers. Inline the never-assignment; do not add a wrapper.
- Switching on a stringly-typed field instead of the modeled discriminant. Model first (`precise-type-modeling`), then switch.

## Red Flags — STOP

- About to write `if (state.kind === …)` for a union → use `switch`.
- About to write or import `assertNever` → inline `const _exhaustive: never = state`.
- About to add `default:` that returns a value → only `never`-assignment belongs there.
- A trailing `return fallback` after the branches → a new variant will be swallowed silently.
