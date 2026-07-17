---
name: precise-type-modeling 
description: Use when authoring or converting TypeScript — defining a type / interface / function signature, typing arguments or state, deciding between optional fields and a union, or about to reach for any, unknown, Record<string, unknown>, an index signature, or an as cast. The minimum modeling rules for making code TypeScript.
---

# Precise Type Modeling

## Core principle

A type must model reality **exactly**: every argument and every state, with no looser shape than the truth. `any`, bare `unknown`, `Record<string, unknown>`, open index signatures, and `as` are where models go to die — they each say "I gave up modeling here." When you make code TypeScript, the goal is not "it compiles" but "impossible states are unrepresentable."

## The rules (minimum bar)

1. **No escape-hatch types for data you control.** Ban `any`. Ban `Record<string, unknown>` / `[k: string]: unknown` for "arbitrary" or "pass-through" data — "arbitrary" almost always means "I didn't enumerate it yet." Enumerate the fields, or model the variants as a union of concrete shapes.
2. **`unknown` only at a true external boundary, and only in transit.** Network/JSON/`process.env` may arrive as `unknown` — immediately parse it into a concrete type (zod `.parse`, a type guard). `unknown` must never be a field type, a return type, or a resting place; it is a doorway, not a room.
3. **Model every state as a discriminated union — the union IS the state-transition diagram.** A value that can be in N states = N variants, each with a literal discriminant tag (`type`/`kind`/`outcome`) carrying only that state's data. The compiler then makes illegal field access (reading success data off a failure) impossible, and `switch` exhaustiveness flags missing states.
4. **Optional fields are a smell — usually a collapsed union.** If field A is present only when field B is, those are two variants, not two `?:` fields. Many optionals on one interface = you merged several states into one shape and pushed the distinction onto the reader. Reserve `?:` for a field that is genuinely, independently absent (e.g. `description?`), not for state.
5. **`satisfies` over `as`.** `as` *silences* the checker and can lie; `satisfies` *checks* the value against the type AND keeps its narrow inferred type. Annotate literals with `satisfies`, never `as`. Use `as` only for narrowing the checker genuinely cannot express — and prefer a type guard even then.

## Before / after

### Optionals hiding a state machine → discriminated union (rules 3, 4)

```ts
// ❌ every field optional; nothing stops `result.session` on a failure
interface AuthResult {
  ok: boolean;
  user?: User; session?: Session;        // success only
  code?: string; status?: number;        // failure only
  challengeId?: string; methods?: AuthMethod[]; // mfa only
}
```

```ts
// ✅ the union names each state; each variant carries ONLY its own data
type AuthResult =
  | { outcome: 'success'; user: User; session: Session }
  | { outcome: 'failure'; code: string; status: number }
  | { outcome: 'mfa_required'; challengeId: string; methods: AuthMethod[] };

const summarize = (r: AuthResult): string => {
  switch (r.outcome) {
    case 'success':      return `signed in as ${r.user.name}`;
    case 'failure':      return `failed (${r.code}, ${r.status})`;
    case 'mfa_required': return `mfa: ${r.methods.join(', ')}`;
    // add a 4th outcome → this switch fails to compile until handled
  }
};
```

### "Arbitrary pass-through" → enumerated concrete type (rules 1, 2)

```ts
// ❌ the index signature is a giveaway: the flags were never modeled
interface AuthOptions {
  clientIp?: string;
  requireDatabase?: boolean;
  [featureFlag: string]: unknown;   // "callers can pass anything"
}
```

```ts
// ✅ name the flags; a new flag is a one-line type change, reviewable & autocompleted
interface FeatureFlags {
  betaPasskeyFlow: boolean;
  rolloutBucket: number;
}
interface AuthOptions {
  clientIp?: string;
  requireDatabase?: boolean;
  flags: FeatureFlags;
}
```

### `satisfies`, not annotation-or-`as` (rule 5)

```ts
const opts = { clientIp: '203.0.113.7', requireDatabase: true } as AuthOptions;     // ❌ as: can hide missing/extra fields
const opts: AuthOptions = { clientIp: '203.0.113.7', requireDatabase: true };       // ❌ widens literals, drops inference
const opts = { clientIp: '203.0.113.7', requireDatabase: true } satisfies AuthOptions; // ✅ checks AND keeps narrow types
```

## Quick reference

| You're about to write | Do instead |
|---|---|
| `any` | model it; if truly external, `unknown` + parse |
| `Record<string, unknown>` / `[k: string]: unknown` | enumerate fields, or a union of concrete shapes |
| `unknown` as a field/return type | parse at the boundary into a concrete type first |
| interface with many `?:` fields | split into a discriminated union by state |
| `boolean` flags + optional payload | one variant per state, payload non-optional inside it |
| `x as T` | `x satisfies T`; or a type guard `(x): x is T` |
| `value as any` to "make it work" | fix the model; `as any` is never the answer |

## Common rationalizations

| Excuse | Reality |
|---|---|
| "The flags are arbitrary, I need an index signature" | "Arbitrary" = unenumerated. List them; add a field when a flag is born. |
| "Optionals are simpler than a union" | They push every "is this set?" check onto every reader, forever. The union checks once. |
| "`as` is fine, I know the shape" | Then `satisfies` proves it for free. `as` only matters when you might be wrong — exactly when it's dangerous. |
| "`unknown` is the safe version of `any`" | Only if narrowed immediately. As a resting type it's `any` with extra steps. |
| "I'll model it properly later" | The optional-soup interface is the thing you ship and never revisit. Model it now. |

## Red flags — STOP

- Reaching for `Record<string, unknown>`, `[k: string]: unknown`, or `any` for "config"/"options"/"metadata"/"payload".
- An interface where most fields are `?:`.
- `as` on anything other than narrowing the checker provably can't do.
- A `boolean`/`status` field that decides which *other* fields are meaningful — that's a discriminant; make it a union.
