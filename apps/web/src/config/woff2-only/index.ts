import { list } from 'postcss';

import type { Plugin } from 'postcss';

// @fontsource ships every @font-face with a woff2 source followed by a woff fallback.
// Every browser the site supports reads woff2, so the woff entry is dead weight in
// the font-face stylesheet (and its files are emitted into dist for nothing). This
// PostCSS plugin keeps only woff2 web-font sources; Vite's CSS pipeline runs it after
// postcss-import has inlined the fontsource files and before url() rewriting, so the
// dropped .woff files are never emitted.
//
// postcss.config.cjs require()s this file through Node's type stripping: keep it to
// erasable TypeScript (no enums / namespaces / parameter properties) and import only
// packages by name, never `@…` path aliases or relative paths without an extension.

const formatOf = (source: string): string | undefined => {
  const match = /format\(\s*["']?([\w-]+)["']?\s*\)/.exec(source);
  return match?.[1];
};

// Drop `format(woff)` entries from an @font-face `src` value — only when a woff2 entry
// remains, so a face whose sole web source is woff keeps working.
export const woff2OnlySrc = (value: string): string => {
  const sources = list.comma(value);
  if (!sources.some((source) => formatOf(source) === 'woff2')) return value;

  const kept = sources.filter((source) => formatOf(source) !== 'woff');
  if (kept.length === sources.length) return value;
  return kept.join(', ');
};

export const woff2Only = (): Plugin => ({
  postcssPlugin: 'woff2-only',
  AtRule: {
    'font-face': (rule) => {
      rule.walkDecls('src', (decl) => {
        decl.value = woff2OnlySrc(decl.value);
      });
    },
  },
});
woff2Only.postcss = true;
