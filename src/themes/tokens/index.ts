import { defineSemanticTokens, defineTokens } from '@pandacss/dev';

// ---------------------------------------------------------------------------
// oklch Scale Generator
// ---------------------------------------------------------------------------
// Shift the entire palette by changing Hue and Chroma alone.
// Steps: 1-2 bg, 3-5 states, 6-8 borders, 9-10 fills, 11-12 text (Radix pattern)

type ScaleEntry = { value: string };
type Scale12 = Record<number, ScaleEntry>;

const oklchScale = (hue: number, peakChroma: number, peakL = 0.45): Scale12 => {
  const top = 0.99 - peakL;

  const curve: [number, number][] = [
    [peakL + top * 0.99, 0.015],
    [peakL + top * 0.95, 0.04],
    [peakL + top * 0.88, 0.09],
    [peakL + top * 0.8, 0.15],
    [peakL + top * 0.7, 0.23],
    [peakL + top * 0.57, 0.35],
    [peakL + top * 0.4, 0.52],
    [peakL + top * 0.19, 0.76],
    [peakL, 1.0],
    [peakL * 0.88, 0.92],
    [peakL * 0.75, 0.78],
    [peakL * 0.5, 0.5],
  ];

  return Object.fromEntries(curve.map(([l, cr], i) => [i + 1, { value: `oklch(${l.toFixed(3)} ${(peakChroma * cr).toFixed(4)} ${hue})` }])) as Scale12;
};

const grayScale = (hue: number): Scale12 => {
  const curve: [number, number][] = [
    [0.99, 0.003],
    [0.975, 0.005],
    [0.94, 0.008],
    [0.905, 0.01],
    [0.865, 0.01],
    [0.825, 0.01],
    [0.755, 0.012],
    [0.67, 0.013],
    [0.555, 0.014],
    [0.51, 0.014],
    [0.42, 0.014],
    [0.2, 0.015],
  ];

  return Object.fromEntries(curve.map(([l, c], i) => [i + 1, { value: `oklch(${l.toFixed(3)} ${c.toFixed(4)} ${hue})` }])) as Scale12;
};

// ---------------------------------------------------------------------------
// Brand Hue Definitions
// ---------------------------------------------------------------------------
const HUE = {
  brand: 320, // napochaan pink/magenta
  violet: 290,
  cyan: 210,
  red: 27,
  green: 145,
  yellow: 80,
} as const;

// ---------------------------------------------------------------------------
// Primitive Tokens
// ---------------------------------------------------------------------------
export const tokens = defineTokens({
  colors: {
    white: { value: 'oklch(1.000 0 0)' },
    black: { value: 'oklch(0.000 0 0)' },

    pink: oklchScale(HUE.brand, 0.25, 0.55),
    gray: grayScale(HUE.brand),
    violet: oklchScale(HUE.violet, 0.27, 0.45),
    cyan: oklchScale(HUE.cyan, 0.14, 0.58),
    red: oklchScale(HUE.red, 0.2, 0.52),
    green: oklchScale(HUE.green, 0.17, 0.52),
    yellow: oklchScale(HUE.yellow, 0.17, 0.7),
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
