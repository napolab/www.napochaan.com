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
| `CODE_LANGUAGES` (apps/cms/src/blocks/code) ↔ Shiki `PRELOADED_LANGUAGE_KEYS` — both the cms preview highlighter (apps/cms/src/components/rich-text/converters/code/highlighter) and the public one (apps/web/src/components/rich-text/converters/code/highlighter) | `apps/cms/src/blocks/code/code.test.ts` (imports the web highlighter across workspaces by relative path) |
| `NodeTypes` union (apps/web/src/components/rich-text/converters) ↔ `renderBlock` branches (apps/web/src/utils/lexical/to-markdown) | mirrored by hand — add branches to both when adding a block |
| `WORK_TYPE_OPTIONS` (apps/cms/src/collections/fields/work-type) ↔ `type` select options in `Works` (apps/cms/src/collections/works.ts) | `apps/cms/src/lib/mcp/tools/works/works.test.ts` |
| youtube-embed `parseYouTubeVideoID` / `formatYouTubeEmbedMarkdown` (apps/cms/src/blocks/youtube-embed/{parse-url,markdown-format}, write-side validate + MCP export) ↔ web copies (apps/web/src/utils/youtube-embed/{parse-url,markdown-format}, iframe render + llms.txt export) | `apps/web/src/utils/youtube-embed/youtube-embed-sync.test.ts` (imports the cms modules across workspaces, compares outputs on shared fixtures) |
| `PREVIEW_ROOTS` (apps/web/worker/middleware/path-policy/plugins/preview-frame, reused by the cache-control `uncacheable` plugin) ↔ `PREVIEW_PATH_PREFIXES` (apps/web/src/app/next/preview/allowed-paths — the draft-mode handshake whitelist) | `apps/web/worker/middleware/path-policy/plugins/preview-frame/preview-frame.test.ts` |
| `CONTENT_MAX_WIDTH_PX` (apps/web/src/themes/layout) ↔ site-shell `maxWidth` literal (apps/web/src/components/site-shell/styles.css.ts) | `apps/web/src/themes/layout.test.ts` |
| `TITLE_JP_VAR` (apps/web/src/themes/font-vars, imported directly by `titleJP` token) ↔ `variable` literal in `Zen_Kaku_Gothic_New(...)` (apps/web/src/themes/fonts.ts — next/font requires a literal, can't import the constant) | `apps/web/src/themes/font-vars.test.ts` (statically reads fonts.ts source; the module can't be imported under vitest — next/font/google is a build-time-only stub outside Next's compiler) |
| `OG_IMAGE_ROUTE_SUFFIX` (apps/web-astro/src/utils/og/og-image-route) ↔ literal OG route filenames `apps/web-astro/src/pages/<section>/[slug]/opengraph-image-<suffix>.ts` (Next's `(site)` group hash — Astro route filenames must be literal) | `apps/web-astro/src/utils/og/og-image-route/og-image-route.test.ts` (asserts each route file exists) |

Add new pairs to this table when you introduce one. When the two sides live in different workspaces (apps/web ↔ apps/cms), the test imports the other side by relative path (`../../../../cms/src/...`) — both apps' vitest/tsgo resolve it.
