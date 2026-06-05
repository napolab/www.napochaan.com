import { M_PLUS_1, Zen_Kaku_Gothic_New } from 'next/font/google';

const mplus1 = M_PLUS_1({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mplus1',
});

const zenKaku = Zen_Kaku_Gothic_New({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-zen-kaku',
});

/** CSS class string to apply both font variables to the root element */
export const fontVariables = `${mplus1.variable} ${zenKaku.variable}`;
