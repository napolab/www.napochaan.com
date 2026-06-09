import { M_PLUS_1 } from 'next/font/google';
import localFont from 'next/font/local';

const mplus1 = M_PLUS_1({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mplus1',
});

/** CSS class string to apply font variables to the root element */
export const fontVariables = mplus1.variable;

// LINE Seed JP is not in Next 15.3.9's `next/font/google` manifest (it landed on
// Google Fonts on 2026-01-23, after this Next release), so we self-host the
// full-glyph woff2 from the official OFL release via `next/font/local`. Next
// emits the @font-face + files to `/_next/static/media` (same origin) only when
// this variable is applied to an element — currently the Payload admin only.
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
