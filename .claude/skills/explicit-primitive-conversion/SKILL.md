---
name: explicit-primitive-conversion
description: Use when converting a value to a number, string, or boolean in TypeScript, or annotating a primitive type — about to write Number(x), String(x), Boolean(x), unary +x, !!x, .filter(Boolean), or a : Number / : String / : Boolean type annotation.
---

# Explicit Primitive Conversion

## Overview

The `Number` / `String` / `Boolean` globals — **called as functions** or **used as type annotations** — hide intent and bury edge cases. `Number(x)` silently maps `null`→0 and `""`→0; `String(x)` quietly stringifies anything; `Boolean(x)` collapses `0`, `""`, `null`, `undefined`, `false`, `NaN` into one bucket. Convert **explicitly** instead, and annotate with the lowercase primitive.

**Calling `Number`/`String`/`Boolean`, or annotating with the uppercase wrapper type, is banned. No exceptions.**

## The rule

| Goal | ❌ banned (implicit coercion) | ✅ required (explicit) |
|---|---|---|
| string → integer | `Number(x)`, `+x`, `parseInt(x)` (no radix) | `parseInt(x, 10)` — radix is mandatory |
| string → float | `Number(x)`, `+x` | `parseFloat(x)` |
| anything → string | `String(x)` | `` `${x}` `` (template literal) |
| truthiness / → boolean | `Boolean(x)`, `!!x`, `.filter(Boolean)` | an explicit `x === …` / `x !== …` condition |
| type annotation | `: Number` `: String` `: Boolean`, `Array<String>`, `as Number` | `: number` `: string` `: boolean` |

**Still allowed:** `Number`'s static methods are not coercion — `Number.parseInt(x, 10)`, `Number.parseFloat(x)`, `Number.isNaN(x)`, `Number.isInteger(x)` are all fine. The ban is on *calling* `Number(...)` and on the *uppercase type*, not on the namespace.

## Before → after

```ts
// ❌ before — every conversion is implicit
const page: Number = Number(query.page);          // wrapper type + coercion
const note = String(form.note);                   // hides what note actually is
const msg = parts.map((p) => String(p)).join(" "); // ditto
const apply = !!user && Boolean(rate);            // two truthiness coercions
const tags = raw.filter(Boolean);                 // drops which falsy values?
```

```ts
// ✅ after — intent is named at every step
const page: number = parseInt(query.page ?? "", 10) || 1;
const note = `${form.note}`;
const msg = parts.map((p) => `${p}`).join(" ");
const apply = user !== undefined && rate > 0;     // exactly the conditions you mean
const tags = raw.filter((t): t is string => t !== null && t !== undefined && t !== "");
```

## Why `Boolean(x)` is the one that bites

`Boolean(x)` / `!!x` / `.filter(Boolean)` test "is it truthy" — but you almost never mean *all six* falsy values. Writing the `!==`/`===` condition forces you to name the one you actually mean:

- "is it present?" → `x !== null && x !== undefined`
- "is the string non-empty?" → `x !== ""`
- "is the count positive?" → `x > 0` (`Boolean(0)` would have hidden the `0` case)

If you genuinely want a real boolean from a comparison, you already have one: `const ok = x !== null` — there is nothing left to coerce.

## A value typed `unknown`?

Do not reach for `String(x)` / `Number(x)` to dodge the type. Narrow or model it first (see `precise-type-modeling`), then convert the narrowed value. `` `${x}` `` on a bare `unknown`/`symbol` is itself a smell that the type was never modeled.

## Common mistakes

| Mistake | Fix |
|---|---|
| `parseInt(x)` without radix | `parseInt(x, 10)` — always pass the radix. |
| `Number(x)` "because parseInt is verbose" | Verbosity is the point: `Number("")` is `0`, `parseInt("", 10)` is `NaN`. Pick the parser that matches intent. |
| Thinking the whole `Number` global is banned | `Number.parseInt` / `Number.isNaN` (static methods) are fine; only the **call** `Number(x)` and the **type** `Number` are banned. |
| `.filter(Boolean)` to "remove empties" | Spell out the condition: `.filter((x): x is T => x !== null && x !== undefined)`. |
| `: Number` / `: String` / `: Boolean` annotation | Use the lowercase primitive. The uppercase wrapper type accepts boxed objects and breaks assignability. |

## Red Flags — STOP

- About to type `Number(`, `String(`, or `Boolean(` followed by `(` → it is a coercion call. Use `parseInt(x, 10)` / `parseFloat(x)` / `` `${x}` `` / an explicit `===`/`!==`.
- About to write `+x` or `!!x` → implicit coercion. Same replacements.
- About to write `.filter(Boolean)` → name the condition in a predicate.
- About to annotate `: Number` / `: String` / `: Boolean` (or `Array<String>`, `as String`) → use `number` / `string` / `boolean`.

These rules are partly lint-enforceable (the call form and `new` wrappers); this skill exists for the part that is not — *choosing the right explicit replacement*.
