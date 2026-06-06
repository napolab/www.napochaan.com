import { defineSemanticTokens, defineTokens } from '@pandacss/dev';

// ---------------------------------------------------------------------------
// Primitive Tokens
// ---------------------------------------------------------------------------
export const tokens = defineTokens({
  colors: {
    white: { value: 'oklch(1.000 0 0)' },
    black: { value: 'oklch(0.000 0 0)' },

    gray: {
      1: { value: 'oklch(0.952 0.004 265)' },
      2: { value: 'oklch(0.934 0.005 265)' },
      3: { value: 'oklch(0.918 0.005 265)' },
      4: { value: 'oklch(0.900 0.006 265)' },
      5: { value: 'oklch(0.884 0.007 265)' },
      6: { value: 'oklch(0.845 0.008 265)' },
      7: { value: 'oklch(0.785 0.010 265)' },
      8: { value: 'oklch(0.700 0.013 265)' },
      9: { value: 'oklch(0.560 0.016 265)' },
      10: { value: 'oklch(0.510 0.017 265)' },
      11: { value: 'oklch(0.430 0.018 265)' },
      12: { value: 'oklch(0.185 0.020 265)' },
    },
    blue: {
      1: { value: 'oklch(0.972 0.012 266)' },
      2: { value: 'oklch(0.955 0.024 266)' },
      3: { value: 'oklch(0.925 0.046 266)' },
      4: { value: 'oklch(0.892 0.070 266)' },
      5: { value: 'oklch(0.850 0.100 266)' },
      6: { value: 'oklch(0.788 0.142 266)' },
      7: { value: 'oklch(0.700 0.192 266)' },
      8: { value: 'oklch(0.600 0.245 266)' },
      9: { value: 'oklch(0.490 0.287 266)' },
      10: { value: 'oklch(0.450 0.270 266)' },
      11: { value: 'oklch(0.520 0.225 266)' },
      12: { value: 'oklch(0.330 0.150 266)' },
    },
    red: {
      1: { value: 'oklch(0.972 0.013 25)' },
      2: { value: 'oklch(0.957 0.024 25)' },
      3: { value: 'oklch(0.930 0.044 25)' },
      4: { value: 'oklch(0.898 0.066 25)' },
      5: { value: 'oklch(0.858 0.098 25)' },
      6: { value: 'oklch(0.800 0.140 25)' },
      7: { value: 'oklch(0.728 0.182 25)' },
      8: { value: 'oklch(0.672 0.225 25)' },
      9: { value: 'oklch(0.630 0.256 25)' },
      10: { value: 'oklch(0.585 0.250 25)' },
      11: { value: 'oklch(0.530 0.205 25)' },
      12: { value: 'oklch(0.350 0.130 25)' },
    },
  },

  spacing: {
    0: { value: '0' },
    0.5: { value: '0.125rem' },
    1: { value: '0.25rem' },
    1.5: { value: '0.375rem' },
    2: { value: '0.5rem' },
    3: { value: '0.75rem' },
    4: { value: '1rem' },
    5: { value: '1.25rem' },
    6: { value: '1.5rem' },
    8: { value: '2rem' },
    10: { value: '2.5rem' },
    12: { value: '3rem' },
    16: { value: '4rem' },
    20: { value: '5rem' },
    24: { value: '6rem' },
  },

  fontSizes: {
    '2xs': { value: '0.6875rem' }, // 11
    xs: { value: '0.75rem' }, // 12 caption/mono
    sm: { value: '0.875rem' }, // 14
    md: { value: '1rem' }, // 16 body
    lg: { value: '1.1875rem' }, // 19
    xl: { value: '1.4375rem' }, // 23 (= h3)
    h3: { value: '1.4375rem' }, // 23
    h2: { value: 'clamp(1.75rem, 3.5vw, 2.0625rem)' }, // 28→33
    h1: { value: 'clamp(2.0625rem, 5vw, 3.1875rem)' }, // 33→51
    display: { value: 'clamp(3.5rem, 9vw, 6rem)' }, // 56→96
    hero: { value: 'clamp(3.5rem, 15vw, 10rem)' }, // 56→160 (fills ≤375px while keeping jump ratio vs body)
  },

  lineHeights: {
    none: { value: '0.9' },
    tight: { value: '1.2' },
    snug: { value: '1.4' },
    body: { value: '1.7' },
    jp: { value: '1.9' },
  },

  fontWeights: {
    normal: { value: '400' },
    medium: { value: '500' },
    semibold: { value: '600' },
  },

  letterSpacings: {
    tighter: { value: '-0.04em' },
    tight: { value: '-0.02em' },
    normal: { value: '0' },
    wide: { value: '0.04em' },
    wider: { value: '0.12em' },
  },

  radii: {
    none: { value: '0' },
    pill: { value: '9999px' },
  },

  shadows: {
    xs: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
    sm: { value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
    md: { value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
    lg: { value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
    xl: { value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
  },

  borderWidths: {
    none: { value: '0' },
    hairline: { value: '1px' },
    default: { value: '2px' },
    strong: { value: '3px' },
  },

  sizes: {
    gridCell: { value: '24px' },
    band: { value: '24px' },
    targetMin: { value: '24px' },
    targetComfortable: { value: '44px' },
    headerHeight: { value: '72px' },
  },

  opacity: {
    disabled: { value: '0.5' },
    overlay: { value: '0.8' },
  },

  fonts: {
    display: { value: '"digibop", system-ui, sans-serif' },
    body: { value: 'var(--font-mplus1), system-ui, -apple-system, sans-serif' },
    mono: { value: '"config-mono-vf", ui-monospace, "Cascadia Code", monospace' },
  },

  zIndex: {
    hide: { value: '-1' },
    base: { value: '0' },
    dropdown: { value: '1000' },
    sticky: { value: '1100' },
    overlay: { value: '1300' },
    modal: { value: '1400' },
    popover: { value: '1500' },
    toast: { value: '1700' },
  },

  durations: {
    instant: { value: '0ms' },
    fast: { value: '90ms' },
    base: { value: '150ms' },
    snap: { value: '180ms' },
    slow: { value: '280ms' },
    glitch: { value: '630ms' },
  },

  easings: {
    linear: { value: 'linear' },
    step1: { value: 'steps(1)' },
    stepSnap: { value: 'steps(3, end)' },
  },

  blurs: {
    none: { value: '0' },
    sm: { value: '4px' },
    md: { value: '8px' },
    lg: { value: '12px' },
    xl: { value: '16px' },
  },
});

// ---------------------------------------------------------------------------
// Semantic Tokens — light-first
// ---------------------------------------------------------------------------
export const semanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      canvas: { value: '{colors.gray.1}' },
      subtle: { value: '{colors.gray.2}' },
      muted: { value: '{colors.gray.3}' },
      emphasis: { value: '{colors.gray.5}' },
    },
    fg: {
      default: { value: '{colors.gray.12}' },
      muted: { value: '{colors.gray.11}' },
      subtle: { value: '{colors.gray.9}' },
      onSolid: { value: '{colors.gray.1}' },
      onDanger: { value: '{colors.gray.12}' },
    },
    border: {
      subtle: { value: '{colors.gray.6}' },
      default: { value: '{colors.gray.7}' },
      strong: { value: '{colors.gray.8}' },
      focus: { value: '{colors.blue.7}' },
    },
    grid: {
      line: { value: '{colors.gray.5}' },
    },
    accent: {
      solid: { value: '{colors.blue.9}' },
      solidHover: { value: '{colors.blue.10}' },
      text: { value: '{colors.blue.9}' },
      border: { value: '{colors.blue.7}' },
    },
    danger: {
      solid: { value: '{colors.red.9}' },
      solidHover: { value: '{colors.red.10}' },
      text: { value: '{colors.red.11}' },
      border: { value: '{colors.red.7}' },
      spot: { value: '{colors.red.9}' },
    },
  },
  spacing: {
    inline: { value: '{spacing.2}' }, // 8px
    element: { value: '{spacing.3}' }, // 12px
    block: { value: '{spacing.6}' }, // 24px = module
    section: { value: '{spacing.12}' }, // 48px
    page: { value: '{spacing.6}' }, // 24px
  },
});
