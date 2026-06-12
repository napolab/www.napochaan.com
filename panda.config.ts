import { defineConfig } from '@pandacss/dev';

import { breakpoints } from './src/themes/breakpoints';
import { globalCss } from './src/themes/global-css';
import { linkRecipe } from './src/themes/recipes';
import { semanticTokens, tokens } from './src/themes/tokens';

export default defineConfig({
  strictTokens: true,
  jsxFramework: 'react',
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  globalCss,
  // The Link recipe's variants are chosen at runtime (component props), so force
  // every combination to be generated rather than relying on static usage.
  staticCss: {
    recipes: {
      link: ['*'],
    },
  },
  theme: {
    breakpoints,
    extend: {
      tokens,
      semanticTokens,
      recipes: {
        link: linkRecipe,
      },
      layerStyles: {
        focusRing: {
          value: {
            // base = static dashed ring (reduced-motion fallback)
            outlineWidth: 'default',
            outlineStyle: 'dashed',
            outlineColor: 'accent.solid',
            outlineOffset: '[3px]',
            borderRadius: 'none',
          },
        },
      },
      keyframes: {
        marchingAnts: {
          to: { backgroundPosition: '8px 0, -8px 100%, 0 -8px, 100% 8px' },
        },
        // Blog TOC reading-progress colour, driven by each heading's scroll-driven
        // view-timeline (see global-css `@supports` block). Unread (fg.muted) → read
        // (accent.text), held by `animation-fill-mode: both`. Both ends clear WCAG AA
        // on the page surface; colours reference the emitted token CSS variables.
        blogTocProgress: {
          '0%': { color: 'var(--colors-fg-muted)' },
          '100%': { color: 'var(--colors-accent-text)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
        // LoadingOverlay progress fill: eases toward 90% and holds. The overlay
        // is always dismissed within Typekit's 3s scriptTimeout, so the cap is
        // never on screen long enough to look stuck.
        loadBar: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(0.9)' },
        },
        // DecodingSkeleton glyph churn. Each step swaps a cell's ::before content
        // through the ScrambleText glyph vocabulary (█▓▒░#%&@/\<>0-9) so a row of
        // cells reads as text being decoded. Three variants + per-cell delay keep
        // adjacent cells out of phase (random-ish), and `steps(1)` snaps each glyph
        // (chunky/digital) instead of cross-fading.
        churnA: {
          '0%': { content: '"█"' },
          '20%': { content: '"%"' },
          '40%': { content: '"0"' },
          '60%': { content: '"▒"' },
          '80%': { content: '"@"' },
          '100%': { content: '"7"' },
        },
        churnB: {
          '0%': { content: '"#"' },
          '20%': { content: '"▓"' },
          '40%': { content: '">"' },
          '60%': { content: '"4"' },
          '80%': { content: '"░"' },
          '100%': { content: '"&"' },
        },
        churnC: {
          '0%': { content: '"/"' },
          '20%': { content: '"2"' },
          '40%': { content: '"█"' },
          '60%': { content: '"<"' },
          '80%': { content: '"9"' },
          '100%': { content: '"▒"' },
        },
        // Subtle per-row opacity pulse so the whole block breathes while decoding.
        decodePulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
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
        marquee: {
          to: { transform: 'translateX(-50%)' },
        },
        // SafeAreaTint strip: scroll-timeline-driven chase so the strip's bottom
        // edge tracks (viewport top + band extent) at every scroll position. The
        // var(--band-top) / 160px values mirror VIEWPORT_OVERLAP / STRIP_HEIGHT
        // in src/components/safe-area-tint/styles.css.ts — keep them in sync.
        // --scroll-range (body height - innerHeight) is published by
        // safe-area-tint/scroll-range-sync.tsx because that range is not
        // expressible in pure CSS units.
        safeAreaChase: {
          from: { transform: 'translateY(calc(var(--band-top, 24px) - 160px))' },
          to: { transform: 'translateY(calc(var(--scroll-range, 0px) + var(--band-top, 24px) - 160px))' },
        },
        // Chin counterpart: stripBottom's static top already encodes
        // (viewport bottom - overlap) via --viewport-h, so the chase is a pure
        // scrollY follow.
        safeAreaChaseBottom: {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(var(--scroll-range, 0px))' },
        },
        marqueeY: {
          to: { transform: 'translateY(-50%)' },
        },
      },
    },
  },
});
