import localFont from 'next/font/local';

// LINE Seed JP — the self-hosted Japanese gothic used ONLY by the Payload admin
// (the rich-text editor, via custom.css). It is a full-glyph CJK face: two ~1.5MB
// woff2 files (Regular + Bold).
//
// This MUST live in its own module, imported solely by the admin layout. next/font
// preloads every font declared in a module that a route imports — so if these
// localFont calls shared `fonts.ts` with the public body fonts, every public page
// would emit <link rel=preload> for both 1.5MB files and download ~3MB of admin-only
// Japanese glyphs it never renders (the public site uses M PLUS 1 + system JP).
// Keeping the admin face isolated scopes that preload to the admin routes only.
//
// LINE Seed JP is not in Next 15.3.9's `next/font/google` manifest (it landed on
// Google Fonts on 2026-01-23, after this Next release), so we self-host the
// full-glyph woff2 from the official OFL release. Next emits the @font-face + files
// to `/_next/static/media` (same origin) only when this variable is applied.
const lineSeedJp = localFont({
  src: [
    { path: './fonts/line-seed-jp/LINESeedJP-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/line-seed-jp/LINESeedJP-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-line-seed-jp',
});

/** CSS class exposing `--font-line-seed-jp`. Applied to the Payload admin `<html>`. */
export const adminFontVariables = lineSeedJp.variable;
