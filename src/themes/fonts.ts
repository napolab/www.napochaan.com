import { M_PLUS_1 } from 'next/font/google';

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

/** CSS class string to apply font variables to the root element */
export const fontVariables = `${mplus1.variable} ${mplus1En.variable}`;

// LINE Seed JP (admin-only, ~3MB) now lives in `fonts-admin.ts` so next/font does
// not preload it on public routes — see that file's header for the why.
