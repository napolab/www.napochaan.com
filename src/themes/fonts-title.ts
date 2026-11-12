import { Zen_Kaku_Gothic_New } from 'next/font/google';

// Zen Kaku Gothic New (weight 500 only) — the Japanese gothic used for long
// content detail titles (works / news / blog, via `TightPageHeader`).
//
// This MUST live in its own module — the same reasoning as `fonts-admin.ts`
// isolating LINE Seed JP. next/font/google emits this face's 122 unicode-range
// @font-face rules (~30 KB CSS, ~91 KB decoded) into every route whose module
// graph imports the module that declares the loader call. `fonts.ts` (via
// `fontVariables`) is imported by the root layout for EVERY public page, so if
// this call lived there, home and every index page would ship that CSS despite
// never rendering a tight title (measured in production: 30 KB render-blocking
// CSS on every page for a face 5 routes use). Only `TightPageHeader`
// (src/components/page-header/tight.tsx) imports this module, so only the
// routes that render it — works/blog/news detail + their previews — pull the
// font CSS into their bundle.
//
// `preload: false`: detail titles are almost entirely Japanese glyphs, and
// next/font's Latin-subset preload would not help them — the non-Latin glyph
// slices it splits out still have to be fetched on first paint of the title
// regardless of whether the Latin slice was preloaded.
//
// The `variable` value below MUST match TITLE_JP_VAR in ./font-vars exactly —
// see that file for why the constant lives there instead of being imported
// into this call (next/font requires `variable` to be a literal) and how the
// two are kept in sync (font-vars.test.ts).
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  weight: ['500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-zen-kaku-gothic-new',
  preload: false,
});

/** CSS class exposing `--font-zen-kaku-gothic-new`. Applied to the h1 by `TightPageHeader`. */
export const titleFontVariable = zenKakuGothicNew.variable;
