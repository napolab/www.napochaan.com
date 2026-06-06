import type { GlobalStyleObject } from '@pandacss/dev';

export const globalCss: GlobalStyleObject = {
  'html, body': {
    bg: 'bg.canvas',
    color: 'fg.default',
    fontFamily: 'body',
    colorScheme: 'light',
    lineHeight: 'jp',
  },
  body: {
    backgroundImage: '[linear-gradient(to right, token(colors.grid.line) 1px, transparent 1px), linear-gradient(to bottom, token(colors.grid.line) 1px, transparent 1px)]',
    backgroundSize: '[24px 24px]',
  },
  'h1, h2, h3, h4, h5, h6, p, li, dt, dd, th, td, label, figcaption, blockquote, caption': {
    wordBreak: 'auto-phrase',
  },
  // Anchor-scroll targets clear the fixed top TypographyBand (24px) plus a gutter.
  'section[id]': {
    scrollMarginTop: '[calc(token(sizes.band) + token(spacing.6))]',
  },
  'h1, h2, h3, h4, h5, h6': { fontFamily: 'display', fontWeight: 'normal' },
  h1: { lineHeight: 'tight', letterSpacing: 'tighter' },
  h2: { lineHeight: 'tight', letterSpacing: 'tight' },
  h3: { lineHeight: 'tight' },
  // Marching-ants focus ring: animated ::after under prefers-reduced-motion: no-preference.
  // The focusRing layerStyle provides the static dashed fallback for reduced-motion.
  // Under motion-safe conditions, the outline is hidden and this ::after renders the animation.
  '@media (prefers-reduced-motion: no-preference)': {
    // Smooth in-page navigation (e.g. the works year-heading anchors). Gated
    // under motion-safe so reduced-motion users get instant jumps.
    html: {
      scrollBehavior: 'smooth',
    },
    '*:focus-visible': {
      outlineStyle: 'none',
      position: 'relative',
    },
    '*:focus-visible::after': {
      content: '""',
      position: 'absolute',
      inset: '[-3px]',
      pointerEvents: 'none',
      backgroundImage:
        '[repeating-linear-gradient(90deg, var(--colors-blue-9) 0 4px, transparent 4px 8px), repeating-linear-gradient(90deg, var(--colors-blue-9) 0 4px, transparent 4px 8px), repeating-linear-gradient(0deg, var(--colors-blue-9) 0 4px, transparent 4px 8px), repeating-linear-gradient(0deg, var(--colors-blue-9) 0 4px, transparent 4px 8px)]',
      backgroundSize: '[8px 2px, 8px 2px, 2px 8px, 2px 8px]',
      backgroundPosition: '[0 0, 0 100%, 0 0, 100% 0]',
      backgroundRepeat: '[repeat-x, repeat-x, repeat-y, repeat-y]',
      animation: '[marchingAnts 0.6s linear infinite]',
    },
  },
};
