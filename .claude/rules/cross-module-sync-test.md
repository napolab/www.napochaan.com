# Cross-Module Constant Sync: Assert With a Test

When two modules must keep a list/constant in 1:1 sync, a comment saying "keep in sync with X" is not enforcement. Export the canonical value from one side and assert equality in a test that imports both.

## Pattern

```typescript
// side A (canonical or co-canonical) — export the list
export const PRELOADED_LANGUAGE_KEYS = ['typescript', 'tsx', 'css', 'json', 'bash'] as const;

// side B's test — import both, assert 1:1
expect(Object.keys(CODE_LANGUAGES)).toEqual([...PRELOADED_LANGUAGE_KEYS]);
```

A hand-copied literal in the test (`toEqual(['typescript', ...])`) only pins one side — it does not fail when the *other* module drifts. The assertion must import from both modules.

## When a Literal Cannot Be Derived

Some values must stay literal for tooling (e.g. dynamic `import('@shikijs/langs/typescript')` paths must be literal for the bundler). In that case keep the literal AND the exported list adjacent in the same file with a comment binding them, and let the cross-module test cover the inter-module drift.

## Known Sync Pairs in This Repo

| Pair | Test |
| --- | --- |
| `CODE_LANGUAGES` (src/blocks/code) ↔ Shiki `PRELOADED_LANGUAGE_KEYS` (rich-text code highlighter) | `src/blocks/code/code.test.ts` |
| `NodeTypes` union (rich-text converters) ↔ `renderBlock` branches (src/utils/lexical/to-markdown) | mirrored by hand — add branches to both when adding a block |
| `WORK_TYPE_OPTIONS` (src/collections/fields/work-type) ↔ `type` select options in `Works` (src/collections/works.ts) | `src/lib/mcp/tools/works/works.test.ts` |
| `CONTENT_MAX_WIDTH_PX` (src/themes/layout) ↔ site-shell `maxWidth` literal (src/components/site-shell/styles.css.ts) | `src/themes/layout.test.ts` |
| `TITLE_JP_VAR` (src/themes/font-vars, imported directly by `titleJP` token) ↔ `variable` literal in `Zen_Kaku_Gothic_New(...)` (src/themes/fonts.ts — next/font requires a literal, can't import the constant) | `src/themes/font-vars.test.ts` (statically reads fonts.ts source; the module can't be imported under vitest — next/font/google is a build-time-only stub outside Next's compiler) |

Add new pairs to this table when you introduce one.
