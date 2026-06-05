import { M_PLUS_1 } from 'next/font/google';

const mplus1 = M_PLUS_1({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mplus1',
});

/** CSS class string to apply font variables to the root element */
export const fontVariables = mplus1.variable;
