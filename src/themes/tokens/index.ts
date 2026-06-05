import { defineSemanticTokens, defineTokens } from '@pandacss/dev';

// ---------------------------------------------------------------------------
// Primitive Tokens
// ---------------------------------------------------------------------------
export const tokens = defineTokens({
  colors: {
    white: { value: 'oklch(1.000 0 0)' },
    black: { value: 'oklch(0.000 0 0)' },

    gray: {
      1: { value: 'oklch(0.963 0.003 265)' },
      2: { value: 'oklch(0.945 0.004 265)' },
      3: { value: 'oklch(0.918 0.005 265)' },
      4: { value: 'oklch(0.900 0.006 265)' },
      5: { value: 'oklch(0.884 0.007 265)' },
      6: { value: 'oklch(0.845 0.008 265)' },
      7: { value: 'oklch(0.785 0.010 265)' },
      8: { value: 'oklch(0.700 0.013 265)' },
      9: { value: 'oklch(0.560 0.016 265)' },
      10: { value: 'oklch(0.510 0.017 265)' },
      11: { value: 'oklch(0.430 0.018 265)' },
      12: { value: 'oklch(0.145 0.020 265)' },
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
    xs: { value: '0.75rem' },
    sm: { value: '0.875rem' },
    md: { value: '1rem' },
    lg: { value: '1.125rem' },
    xl: { value: '1.333rem' },
    '2xl': { value: '1.777rem' },
    '3xl': { value: '2.369rem' },
    '4xl': { value: '3.157rem' },
    '5xl': { value: '4.209rem' },
    '6xl': { value: '5.61rem' },
  },

  lineHeights: {
    tight: { value: '1.2' },
    snug: { value: '1.375' },
    normal: { value: '1.5' },
    relaxed: { value: '1.625' },
    loose: { value: '2' },
  },

  fontWeights: {
    normal: { value: '400' },
    medium: { value: '500' },
    semibold: { value: '600' },
    bold: { value: '700' },
  },

  letterSpacings: {
    tighter: { value: '-0.05em' },
    tight: { value: '-0.025em' },
    normal: { value: '0' },
    wide: { value: '0.025em' },
    wider: { value: '0.05em' },
    widest: { value: '0.1em' },
  },

  radii: {
    none: { value: '0' },
    sm: { value: '0.25rem' },
    md: { value: '0.375rem' },
    lg: { value: '0.5rem' },
    xl: { value: '0.75rem' },
    '2xl': { value: '1rem' },
    full: { value: '9999px' },
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
    thin: { value: '1px' },
    medium: { value: '2px' },
    thick: { value: '3px' },
  },

  sizes: {
    targetMin: { value: '24px' },
    targetComfortable: { value: '44px' },
    headerHeight: { value: '72px' },
  },

  opacity: {
    disabled: { value: '0.5' },
    overlay: { value: '0.8' },
  },

  fonts: {
    body: {
      value: 'var(--font-zen-kaku), var(--font-mplus1), system-ui, -apple-system, sans-serif',
    },
    heading: {
      value: 'var(--font-mplus1), var(--font-zen-kaku), system-ui, -apple-system, sans-serif',
    },
    mono: { value: 'ui-monospace, "Cascadia Code", "Fira Code", monospace' },
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
    fastest: { value: '50ms' },
    faster: { value: '100ms' },
    fast: { value: '150ms' },
    normal: { value: '200ms' },
    slow: { value: '300ms' },
    slower: { value: '500ms' },
    slowest: { value: '700ms' },
  },

  easings: {
    linear: { value: 'linear' },
    ease: { value: 'ease' },
    easeIn: { value: 'ease-in' },
    easeOut: { value: 'ease-out' },
    easeInOut: { value: 'ease-in-out' },
    outCubic: { value: 'cubic-bezier(0.33, 1, 0.68, 1)' },
    inOutCubic: { value: 'cubic-bezier(0.65, 0, 0.35, 1)' },
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
// color-mix helper
// ---------------------------------------------------------------------------
const mix = (base: string, target: string, pct: number) => `color-mix(in oklch, ${base} ${pct}%, ${target})`;

// ---------------------------------------------------------------------------
// Semantic Tokens — dark-mode-first
// ---------------------------------------------------------------------------
export const semanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      DEFAULT: { value: { base: '{colors.white}', _dark: '{colors.gray.12}' } },
      subtle: { value: { base: '{colors.gray.2}', _dark: '{colors.gray.11}' } },
      muted: { value: { base: '{colors.gray.3}', _dark: '{colors.gray.9}' } },
      emphasis: { value: { base: '{colors.gray.9}', _dark: '{colors.gray.3}' } },
      glass: {
        value: {
          base: mix('{colors.white}', 'transparent', 85),
          _dark: mix('{colors.gray.12}', 'transparent', 85),
        },
      },
    },
    fg: {
      DEFAULT: { value: { base: '{colors.gray.12}', _dark: '{colors.gray.1}' } },
      muted: { value: { base: '{colors.gray.11}', _dark: '{colors.gray.8}' } },
      subtle: { value: { base: '{colors.gray.9}', _dark: '{colors.gray.7}' } },
      onEmphasis: { value: { base: '{colors.white}', _dark: '{colors.gray.12}' } },
    },
    border: {
      DEFAULT: { value: { base: '{colors.gray.6}', _dark: '{colors.gray.9}' } },
      strong: { value: { base: '{colors.gray.8}', _dark: '{colors.gray.7}' } },
      focus: { value: { base: '{colors.pink.9}', _dark: '{colors.pink.7}' } },
    },
    accent: {
      DEFAULT: { value: { base: '{colors.pink.9}', _dark: '{colors.pink.9}' } },
      hover: {
        value: {
          base: mix('{colors.pink.9}', 'oklch(0 0 0)', 85),
          _dark: mix('{colors.pink.9}', 'oklch(1 0 0)', 85),
        },
      },
      subtle: {
        value: {
          base: mix('{colors.pink.9}', 'oklch(1 0 0)', 12),
          _dark: mix('{colors.pink.9}', 'oklch(0 0 0)', 15),
        },
      },
      fg: { value: { base: '{colors.pink.11}', _dark: '{colors.pink.5}' } },
    },
    danger: {
      DEFAULT: { value: { base: '{colors.red.9}', _dark: '{colors.red.9}' } },
      fg: { value: { base: '{colors.red.11}', _dark: '{colors.red.5}' } },
    },
    success: {
      DEFAULT: { value: { base: '{colors.green.9}', _dark: '{colors.green.9}' } },
      fg: { value: { base: '{colors.green.11}', _dark: '{colors.green.5}' } },
    },
    warning: {
      DEFAULT: { value: { base: '{colors.yellow.9}', _dark: '{colors.yellow.9}' } },
      fg: { value: { base: '{colors.yellow.11}', _dark: '{colors.yellow.5}' } },
    },
  },
  spacing: {
    page: { value: '{spacing.6}' },
    section: { value: '{spacing.12}' },
    element: { value: '{spacing.4}' },
    inline: { value: '{spacing.2}' },
  },
});
