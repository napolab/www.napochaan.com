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
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
});
