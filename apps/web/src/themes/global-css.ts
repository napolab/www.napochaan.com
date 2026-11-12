import type { GlobalStyleObject } from '@pandacss/dev';

// Blog TOC reading-progress, in pure CSS (no JS, no generated stylesheet). Each
// heading defines a scroll-driven `view-timeline`; the matching TOC link binds to it
// and runs the `blogTocProgress` colour sweep, so the accent accumulates down the list
// as the reader scrolls. Heading ↔ link are paired by document order: the Nth heading
// (`:nth-child(N of :is(h2,h3))`, type-agnostic so h2/h3 share one sequence) and the
// Nth TOC entry both get `--tl-N`. Enumerated up to a cap because `view-timeline-name`
// / `animation-timeline` take literal idents (no var(), and `ident()` isn't shipped).
// `[data-toc-scope]` (the layout wrapping both columns) hoists the names via
// `timeline-scope` so the TOC column — a sibling subtree — can reach them. All gated
// behind @supports, so unsupported browsers keep the static `tone="muted"` fallback.
const TOC_PROGRESS_CAP = 30;

const tocProgressIndices = [...Array(TOC_PROGRESS_CAP).keys()].map((index) => index + 1);

const tocTimelineNames = tocProgressIndices.map((n) => `--tl-${n}`).join(', ');

const tocProgressBindings = Object.fromEntries(
  tocProgressIndices.flatMap((n) => [
    [`[data-toc-body] :nth-child(${n} of :is(h2, h3))`, { viewTimelineName: `[--tl-${n}]` }],
    [`[data-toc-list] > li:nth-child(${n}) > a`, { animationTimeline: `[--tl-${n}]` }],
  ]),
);

export const globalCss: GlobalStyleObject = {
  '@supports (animation-timeline: view())': {
    '[data-toc-scope]': { timelineScope: `[${tocTimelineNames}]` },
    '[data-toc-list] a': { animation: '[blogTocProgress linear both]', animationRange: '[cover 60% cover 75%]' },
    ...tocProgressBindings,
  },
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
    // Master play/pause switch for every CSS animation that opts in via
    // `animationPlayState: var(--motion-play)`. Default running; the OS preference
    // sets the no-JS / pre-hydration baseline below, and MotionProvider overrides it
    // inline on <html> per the user's header toggle (inline beats this stylesheet).
    '--motion-play': 'running',
  },
  // OS reduced-motion is the baseline before JS runs (and the whole story with JS
  // disabled): pause every opted-in animation. The header toggle can override this
  // either way via the inline var MotionProvider writes on <html>.
  '@media (prefers-reduced-motion: reduce)': {
    ':root': { '--motion-play': 'paused' },
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
  // --band-top) plus a gutter. Covers both section landmarks (`section[id]`) and
  // id-bearing headings — the actual fragment targets for in-page deep links: the
  // blog/news article TOC points at `#${slug}` on rich-text body headings, and the
  // news archive carries the `id` on its month `<h2>` (the `<section>` only holds
  // `aria-labelledby`). Without this the smooth scroll lands the heading tucked
  // under the band. Components that compute their own offset (e.g. the works sticky
  // year spine) target a non-heading anchor element, so they're unaffected.
  'section[id], :is(h1, h2, h3, h4, h5, h6)[id]': {
    scrollMarginTop: '[calc(var(--band-top) + token(spacing.6))]',
  },
  'h1, h2, h3, h4, h5, h6': { fontFamily: 'display', fontWeight: 'normal' },
  h1: { lineHeight: 'tight', letterSpacing: 'tighter' },
  h2: { lineHeight: 'tight', letterSpacing: 'tight' },
  h3: { lineHeight: 'tight' },
  // Marching-ants focus ring. The ::after always renders (the outline is hidden);
  // its march is driven by var(--motion-play), so when motion is paused (OS reduce
  // and/or the header toggle) the dashes freeze into a static 2px dashed ring — the
  // reduced-motion fallback — and resume marching when motion is on.
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
    animationPlayState: 'var(--motion-play, running)',
  },
  // Smooth in-page navigation (e.g. the works year-heading anchors). Stays gated on
  // the OS query — scroll-behavior isn't an animation, so the toggle doesn't drive it.
  '@media (prefers-reduced-motion: no-preference)': {
    html: {
      scrollBehavior: 'smooth',
    },
  },
};
