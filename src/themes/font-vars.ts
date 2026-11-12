// Single source of truth for the CSS custom property name behind the `titleJP`
// font token (see themes/tokens/index.ts). Deliberately has NO import of
// next/font: next/font/google's package entry (node_modules/next/font/google)
// is an empty stub outside Next.js's own compiler pipeline (its real
// implementation is swapped in by a Next-only SWC/webpack transform), so any
// module that imports it — like themes/fonts-title.ts — throws immediately
// under plain vitest. Keeping this constant in its own next/font-free module
// lets themes/tokens/index.ts (and its node test) read the variable name
// directly, without dragging in next/font.
//
// next/font itself requires the `variable` option passed to a font loader call
// to be a literal string (the Next.js compiler statically reads it), so this
// constant cannot be interpolated into that call in fonts-title.ts — the
// literal there is kept in sync with this constant by hand, and
// font-vars.test.ts statically asserts the two match so a drift fails loudly.
export const TITLE_JP_VAR = '--font-zen-kaku-gothic-new';
