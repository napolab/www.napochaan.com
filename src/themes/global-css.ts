import type { GlobalStyleObject } from '@pandacss/dev';

export const globalCss: GlobalStyleObject = {
  'html, body': {
    bg: 'bg.canvas',
    color: 'fg.default',
    fontFamily: 'body',
    colorScheme: 'light',
    lineHeight: 'jp',
  },
  'h1, h2, h3, h4, h5, h6, p, li, dt, dd, th, td, label, figcaption, blockquote, caption': {
    wordBreak: 'auto-phrase',
  },
  'h1, h2, h3, h4, h5, h6': { fontFamily: 'display', fontWeight: 'normal' },
  h1: { lineHeight: 'tight', letterSpacing: 'tighter' },
  h2: { lineHeight: 'tight', letterSpacing: 'tight' },
  h3: { lineHeight: 'tight' },
};
