---
name: switch-pattern
description: >
  Convert `if`-based discriminated-value matching (HTTP status codes, event/action `type` fields, mode strings)
  to exhaustive `switch` statements. Use when refactoring existing code to the project style or when reviewing
  a file for `if (x === ...) / if (x !== ...)` clusters that should be flattened to switch.
disable-model-invocation: true
allowed-tools: Read, Edit, Glob, Grep, Bash
argument-hint: "[file-or-directory-glob]"
---

# Switch Pattern

Refactor `if`-based pattern matching on a single discriminated value (HTTP status, event type, mode) to `switch` blocks. Backs the project rule documented in `.claude/rules/early-return.md` (`Switch for Discriminated Unions`).

## When to use this skill

Apply switch refactor when **all** of the following hold:

1. The code matches **one** value against multiple known constants (status codes, string enums, union discriminators).
2. The current shape is a chain or pair of `if (x === ...) / if (x !== ...)` checks on that same value.
3. The branches are mutually exclusive (not range checks, not multi-condition guards).

Skip switch refactor when:

- Only a single binary check (`if (x !== null) return null;`) — keep the guard clause.
- Branches mix multiple variables (`if (x === 1 && y === 2)`) — switch can't express AND across discriminators.
- Truthiness or range checks (`if (count > 0)`).

## Pattern Catalog (project-canonical)

### Pattern A — success-only side effect

`if (res.status === <success>)` with no else branch.

```ts
// Before
if (res.status === 200) {
  const data = await res.json();
  set(data.videos);
}

// After
switch (res.status) {
  case 200: {
    const data = await res.json();
    set(data.videos);
    break;
  }
}
```

Ref: `src/renderer/src/atoms/videos.ts` `fetchInitialVideos`.

### Pattern B — success-return + default-log

`if (res.status !== <success>) { log }` is an inverted check. Flip to `switch` with early-return success and `default` for log.

```ts
// Before
if (res.status !== 201) {
  const data = await res.json();
  console.error('[importVideo]', res.status, data);
}

// After
switch (res.status) {
  case 201:
    return;
  default: {
    const data = await res.json();
    console.error('[importVideo]', res.status, data);
  }
}
```

Ref: `src/renderer/src/atoms/videos.ts` `importVideoAtom`.

### Pattern C — success-return + default-throw

When the failure path throws.

```ts
switch (res.status) {
  case 200: {
    const data = await res.json();
    return data.videos;
  }
  default:
    throw new Error(`Failed to fetch videos: ${res.status}`);
}
```

### Pattern D — discriminated union (event / action `type`)

Already standard for event handlers and worker protocols.

```ts
switch (event.type) {
  case 'composition':
    store.set(compositionAtom, event.composition);
    break;
  case 'sourceStatus':
    store.set(cellSourceStatusFamily(key), event.status);
    break;
  // ...
}
```

Ref: `src/renderer/src/window/main-window/routes/__root/index.tsx` (`CompositionBridge` `proxy.subscribe`).

## Style rules

- **Block scope each `case`** with `{ }` when declaring `const` / `await`. Avoids fall-through declaration leaks.
- **`break;` after side-effect cases**, **`return …;`** when the case is terminal.
- **`default:` last**. Use it for "everything else" (log, throw, fallback).
- **Don't write `case 200: break;` solely to silence default** — instead invert and use `default` for the cold path (Pattern B).
- **No `case` fall-through** unless intentional and commented.
- **No `eslint-disable` for switch** unless the rule conflicts (the project's lint already permits this style).

## Workflow

When the user invokes `/switch-pattern [glob]`:

1. **Resolve target**: if `$ARGUMENTS` is empty, ask via Grep which files contain `if (.*\.status\s*[!=]==`. Otherwise glob the argument.
2. **Read each candidate** and identify `if`-on-discriminator clusters.
3. **Classify** each cluster against Patterns A–D above.
4. **Apply Edit** preserving:
   - Surrounding control flow (early returns before / after the cluster)
   - `eslint-disable` comments (re-attach to the new `case` body)
   - Original error messages and log channel names
5. **Verify**: run `pnpm lint && pnpm typecheck`. Report pass/fail. If failures introduced, revert and report.
6. **Summarize** changes per file: `<file>: N if-clusters → switch (Patterns A=x, B=y, ...)`.

## Anti-patterns to flag

```ts
// ❌ Inverted-only with no else — Pattern B candidate
if (res.status !== 200) {
  console.error(...);
}
// (success path is implicit — readers must reason about the negation)

// ❌ Chained if/else on the same field — switch is shorter & exhaustive
if (status === 'idle') return null;
else if (status === 'loading') return <Spinner />;
else if (status === 'ready') return <Data />;
else return <Error />;

// ❌ Nested if where switch + default would be flat
if (res.ok) {
  if (res.status === 201) doCreate();
  else if (res.status === 200) doUpdate();
}
```

## Out of scope

This skill does **not**:

- Add exhaustiveness checks (`const _: never = x;`) — that's a separate concern.
- Convert `match`-style libraries (ts-pattern, neverthrow `.match`) — those are intentional pattern syntax.
- Rewrite if-else chains that branch on different variables.
