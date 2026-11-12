import { defineConfig } from '@pandacss/dev';

// Themes (tokens / recipes / keyframes) are ported from apps/web in a later task.
export default defineConfig({
  strictTokens: true,
  jsxFramework: 'react',
  preflight: true,
  include: ['./src/**/*.{ts,tsx,astro}'],
  exclude: [],
  outdir: 'styled-system',
});
