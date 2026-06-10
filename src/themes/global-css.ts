import type { GlobalStyleObject } from '@pandacss/dev';

export const globalCss: GlobalStyleObject = {
  // Safe-area-aware extents of the fixed TypographyBand frame. Each edge is the
  // 24px band plus the device safe-area inset (iOS notch / home indicator /
  // landscape ears), so the brand-blue frame paints the whole physical edge
  // instead of leaving white in the inset zone. Anything positioned relative to
  // a band edge must consume these vars, not sizes.band directly.
  ':root': {
    '--band-top': '[calc(token(sizes.band) + env(safe-area-inset-top, 0px))]',
    '--band-bottom': '[calc(token(sizes.band) + env(safe-area-inset-bottom, 0px))]',
    '--band-left': '[calc(token(sizes.band) + env(safe-area-inset-left, 0px))]',
    '--band-right': '[calc(token(sizes.band) + env(safe-area-inset-right, 0px))]',
  },
  // iOS 26 Safari ignores the theme-color meta and tints its Liquid Glass chrome
  // (status-bar "forehead" / toolbar "chin") from the root elements'
  // background-COLOR property — not from the painted pixels. So the color is the
  // brand blue (what Safari samples) while an opaque bg.canvas gradient layer at
  // the bottom of the background-image stack keeps the page visually white.
  // Don't fold these back into a `bg` shorthand: the split between sampled color
  // and painted image is the whole point.
  'html, body': {
    backgroundColor: 'accent.solid',
    backgroundImage: '[linear-gradient(token(colors.bg.canvas), token(colors.bg.canvas))]',
    color: 'fg.default',
    fontFamily: 'body',
    colorScheme: 'light',
    lineHeight: 'jp',
  },
  body: {
    backgroundImage:
      '[linear-gradient(to right, token(colors.grid.line) 1px, transparent 1px), linear-gradient(to bottom, token(colors.grid.line) 1px, transparent 1px), linear-gradient(token(colors.bg.canvas), token(colors.bg.canvas))]',
    backgroundSize: '[24px 24px, 24px 24px, auto]',
  },
  'h1, h2, h3, h4, h5, h6, p, li, dt, dd, th, td, label, figcaption, blockquote, caption': {
    wordBreak: 'auto-phrase',
  },
  // Anchor-scroll targets clear the fixed top TypographyBand (safe-area-aware
  // --band-top) plus a gutter.
  'section[id]': {
    scrollMarginTop: '[calc(var(--band-top) + token(spacing.6))]',
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
