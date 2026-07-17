---
name: prefix-match-processor
description: Use when branching keys off the prefix of a string (startsWith, namespaced name families like "file.", "edit.", "edit.image.") and the number of prefix branches is growing, when a prefix if-chain is becoming hard to test or extend per-family, or when adding several new prefix families to an existing dispatcher.
---

# Prefix-Match Processor

## Overview

A growing if/`startsWith` chain where each branch carries real logic is a **processor registry** waiting to happen (a.k.a. the plugin / strategy registry, chain-of-responsibility). Replace the chain with a list of self-contained plugins — each one a `{ run(input): Result<T, input> }` that returns `err(input)` when it does not handle the input — and a runner that returns the first `ok`. Adding a family becomes "write a plugin, register it"; the dispatcher never grows.

The input is typically a tagged value — model it with `precise-type-modeling`.

## When to extract — the threshold

| Keep the inline `if`/`switch` | Extract to a processor registry |
|---|---|
| ≤ ~5 branches AND every branch is a one-line mapping | > ~5 prefix families, **or** any branch needs multi-line logic (read fields off the input, validate, branch on the suffix), **or** families are added over time / by different people and need independent tests |

Do not extract 2–3 one-liners — that is premature. Extract when the chain is the thing that keeps growing.

## Before (a prefix if-chain that outgrew itself) ❌

```ts
function handle(command: Command): Output {
  if (command.name.startsWith("file.")) return handleFile(command);
  if (command.name.startsWith("edit.")) return handleEdit(command);
  if (command.name.startsWith("view.")) return handleView(command);
  // …a dozen more, each growing its own logic, untestable per-family…
  return fallback;
}
```

## After (the canonical shape) ✅

**The plugin contract:**

```ts
import type { Result } from "neverthrow";

export interface Plugin<T = Output> {
  run(input: Command): Result<T, Command>;
}
```

**One self-contained plugin per family** — the prefix predicate lives inside `run`, and suffix-specific logic stays local to the plugin:

```ts
import { err, ok } from "neverthrow";

export const editPlugin: Plugin = {
  run(input) {
    if (!input.name.startsWith("edit.")) return err(input);
    const suffix = input.name.slice("edit.".length); // "undo", "image.crop", …
    if (suffix.startsWith("image.")) return ok(editImage(input));
    return ok(editText(input));
  },
};
```

**The runner — first match wins** (write once, reuse; this is the dispatch engine, not a thin wrapper):

```ts
const run = <T>(input: Command, plugins: readonly Plugin<T>[]): Result<T, Command> => {
  const [head, ...tail] = plugins;
  if (head === undefined) return err(input);
  const result = head.run(input);
  if (result.isOk()) return result;
  return run(input, tail);
};

export const createRunner = <T>(plugins: readonly Plugin<T>[]) => (input: Command) => run<T>(input, plugins);
```

**Registry + processor** — the only place that lists families; ordered most-specific-prefix first:

```ts
const plugins = [editImagePlugin, editPlugin, filePlugin, viewPlugin] as const;
const runner = createRunner(plugins);

export const dispatch = (input: Command) =>
  runner(input).mapErr(() => `no plugin for: ${input.name}`);
```

Adding a family: write `searchPlugin`, add it to `plugins`. Test it in isolation: `searchPlugin.run({ name: "search.run", … })` — no runner, no other families.

## Order matters

First match wins, so list the **more specific prefix before the broader one**: `edit.image.` before a bare `edit.`. A broad prefix placed first shadows every specific one after it.

## Common mistakes

| Mistake | Fix |
|---|---|
| Plugin `throw`s or returns a boolean/null instead of `err(input)` | The runner chains on `Result`; a non-match MUST be `return err(input)`. |
| Re-implementing the dispatch loop ad-hoc each time | Use one shared `createRunner`; only plugins are per-family. |
| Suffix logic placed in the dispatcher | Keep `startsWith` + suffix branching **inside** the plugin; the runner stays dumb. |
| A `Map<prefix, fn>` instead of the plugin list | A map keys on exact equality and can't express `startsWith` + suffix branching + specificity ordering. Use ordered plugins. |
| Broad prefix registered before a specific one | Order most-specific-first; first match wins. |
| Extracting 2–3 one-liners into plugins | Premature — keep the inline branch until the threshold above is met. |

## Red Flags — STOP

- A `startsWith` if-chain that keeps gaining branches, or branches gaining their own multi-line logic → extract to a processor registry.
- About to invent a new dispatch shape (`Map<prefix, fn>`, `[prefix, resolver][]`, a `switch` of `startsWith`) → use the `run(input): Result<T, input>` plugin + first-match runner instead.
- A plugin that returns `null`/`false`/throws on non-match → it must `return err(input)`.
- Per-family logic that can only be tested by driving the whole dispatcher → each plugin must be testable on its own.
