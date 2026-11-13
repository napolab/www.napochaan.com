// woff2Only drops the woff fallback src from the @fontsource @font-face rules
// (src/themes/font-faces.css); see src/config/woff2-only. Required as .ts through
// Node's built-in type stripping (Node 24, mise.toml) — a postcss.config.ts would go
// through tsx/esbuild, which fails inside vitest.
const { woff2Only } = require('./src/config/woff2-only/index.ts');

module.exports = {
  plugins: [require('@pandacss/dev/postcss')(), woff2Only()],
};
