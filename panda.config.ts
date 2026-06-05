import { defineConfig } from '@pandacss/dev';

import { breakpoints } from './src/themes/breakpoints';
import { globalCss } from './src/themes/global-css';
import { semanticTokens, tokens } from './src/themes/tokens';

export default defineConfig({
  strictTokens: true,
  jsxFramework: 'react',
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  globalCss,
  theme: {
    breakpoints,
    extend: {
      tokens,
      semanticTokens,
      layerStyles: {
        focusRing: {
          value: {
            outlineWidth: 'default',
            outlineStyle: 'dashed',
            outlineColor: 'accent.solid',
            outlineOffset: '0.5',
            borderRadius: 'none',
          },
        },
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
        glitchShift: {
          '0%, 92%, 100%': { textShadow: 'none', transform: 'none' },
          '93%': {
            textShadow: '2px 0 var(--colors-red-9), -2px 0 var(--colors-blue-9)',
            transform: 'translateX(1px)',
          },
          '97%': {
            textShadow: '-1px 0 var(--colors-red-9), 1px 0 var(--colors-blue-9)',
            transform: 'translateX(-1px)',
          },
        },
      },
    },
  },
});
