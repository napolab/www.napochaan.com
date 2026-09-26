import { M_PLUS_1, Zen_Kaku_Gothic_New } from 'next/font/google';

const mplus1 = M_PLUS_1({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mplus1',
});

// Latin-only M PLUS 1 at a heavy weight. The base M PLUS 1 only covers Latin
// (Japanese glyphs fall through to the system font), and a shared `font-weight`
// would thicken the JP system font too. So instead we render Latin in a separate
// 700-weight instance prepended to the body stack: Latin reads bold, JP keeps its
// untouched system weight. The font-family fallback does the per-script split.
const mplus1En = M_PLUS_1({
  weight: ['700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mplus1-en',
});

// Zen Kaku Gothic New (weight 500 only) — the Japanese gothic used for long
// content detail titles (works / news / blog, PageHeader `titleTracking="tight"`).
// Replaces the Adobe Fonts (Typekit) face "Ryo Gothic PlusN": the Typekit kit
// shipped the whole ~1.08MB Ryo Gothic file to every page load, even pages
// (e.g. home) that never render a tight title. next/font/google instead emits
// unicode-range-split @font-face rules, so the browser only downloads the glyph
// slices actually painted by the one component that references this family.
//
// `preload: false` is essential: next/font preloads every font declared in a
// module a route imports, and this module (fontVariables) is imported by the
// root layout for every public page. Without this flag, home would still pay a
// <link rel="preload"> + eager download for a face it never renders. Leaving
// it unpreloaded means the @font-face rule exists globally (cheap — just CSS)
// but the actual glyph-slice files only fetch where the `titleJP` token is
// used, which is exactly what next/font's per-glyph splitting buys us here.
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

/** CSS class string to apply font variables to the root element */
export const fontVariables = `${mplus1.variable} ${mplus1En.variable} ${zenKakuGothicNew.variable}`;

// LINE Seed JP (admin-only, ~3MB) now lives in `fonts-admin.ts` so next/font does
// not preload it on public routes — see that file's header for the why.
