import type { GlobalStyleObject } from '@pandacss/dev';

export const globalCss: GlobalStyleObject = {
  'html, body': {
    bg: 'bg',
    color: 'fg',
    fontFamily: 'body',
    colorScheme: 'dark',
  },
  'h1, h2, h3, h4, h5, h6, p, li, dt, dd, th, td, label, figcaption, blockquote, caption': {
    wordBreak: 'auto-phrase',
  },
  h1: { fontWeight: 'bold', lineHeight: 'tight', letterSpacing: 'tighter' },
  h2: { fontWeight: 'bold', lineHeight: 'tight', letterSpacing: 'tight' },
  h3: { fontWeight: 'bold', lineHeight: 'snug' },
  h4: { fontWeight: 'semibold', lineHeight: 'snug' },
  h5: { fontWeight: 'semibold', lineHeight: 'snug' },
  h6: { fontWeight: 'semibold', lineHeight: 'normal' },
};
