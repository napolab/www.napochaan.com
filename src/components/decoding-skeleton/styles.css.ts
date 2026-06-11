import { css } from '@styled/css';

export const srOnly = css({ srOnly: true });

// Status host. Carries role="status" + the srOnly label; the visible churn is a
// separate aria-hidden child so screen readers never read the decorative glyphs.
export const root = css({
  display: 'block',
  // `fill` (page-level fallback) reserves a full dynamic-viewport block so the
  // loading screen fills the viewport (footer stays off the fold) and the swap to
  // real content doesn't jump. `dvh` so iOS' collapsing toolbar leaves no gap.
  '&[data-fill]': { minBlockSize: '[100dvh]' },
});

// The decorative glyph block. Mono family + xs size mirrors the site's
// system-annotation voice (the machine talking to itself while it decodes).
export const glyphs = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  lineHeight: 'tight',
  color: 'fg.muted',
  userSelect: 'none',
});

// One decode row. Rows pulse opacity out of phase (per-row delay below) so the
// stack breathes rather than blinking in lockstep. Under reduced-motion the pulse
// is frozen (rows hold a static dim state).
export const row = css({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5',
  animationName: 'decodePulse',
  animationDuration: '[2.4s]',
  animationTimingFunction: '[ease-in-out]',
  animationIterationCount: 'infinite',
  // Driven by the global motion switch: paused (OS reduce and/or the header toggle)
  // freezes the pulse at its dim 0% opacity — the static reduced-motion look.
  animationPlayState: 'var(--motion-play, running)',
  // Per-row phase offset. Six declared rows cover the default; extra rows reuse the
  // last offset, which is fine — the goal is "not in lockstep", not uniqueness.
  '&:nth-child(2)': { animationDelay: '[-0.4s]' },
  '&:nth-child(3)': { animationDelay: '[-0.8s]' },
  '&:nth-child(4)': { animationDelay: '[-1.2s]' },
  '&:nth-child(5)': { animationDelay: '[-1.6s]' },
  '&:nth-child(6)': { animationDelay: '[-2s]' },
});

// A single glyph cell. The glyph itself is drawn by ::before whose `content` is
// stepped through the ScrambleText glyph set by the churn* keyframes, so the cell
// reads as a character being decoded. width holds the advance so the wider block
// glyphs (█▓) never reflow the row. Three churn variants assigned by column, with a
// per-column delay, keep neighbours out of phase (random-ish decoding). Under
// reduced-motion the churn freezes on a static glyph.
export const cell = css({
  display: 'inline-block',
  width: '[0.62em]',
  textAlign: 'center',
  color: 'fg.subtle',
  _before: {
    content: '"▒"',
    animationDuration: '[0.45s]',
    animationTimingFunction: '[steps(1)]',
    animationIterationCount: 'infinite',
    // Global motion switch: paused freezes each cell on a single static glyph.
    animationPlayState: 'var(--motion-play, running)',
  },
  // Column → churn variant (3-way cycle).
  '&:nth-child(3n+1)::before': { animationName: 'churnA' },
  '&:nth-child(3n+2)::before': { animationName: 'churnB' },
  '&:nth-child(3n)::before': { animationName: 'churnC' },
  // Column → phase offset, so adjacent cells never flip on the same frame.
  '&:nth-child(2)::before': { animationDelay: '[-0.05s]' },
  '&:nth-child(3)::before': { animationDelay: '[-0.1s]' },
  '&:nth-child(4)::before': { animationDelay: '[-0.15s]' },
  '&:nth-child(5)::before': { animationDelay: '[-0.2s]' },
  '&:nth-child(6)::before': { animationDelay: '[-0.25s]' },
  '&:nth-child(7)::before': { animationDelay: '[-0.3s]' },
  '&:nth-child(8)::before': { animationDelay: '[-0.35s]' },
  '&:nth-child(9)::before': { animationDelay: '[-0.4s]' },
  '&:nth-child(10)::before': { animationDelay: '[-0.45s]' },
  '&:nth-child(11)::before': { animationDelay: '[-0.5s]' },
  '&:nth-child(12)::before': { animationDelay: '[-0.55s]' },
});

// Blinking electric-blue block caret at the end of the first row — the decode
// cursor. Static (no blink) under reduced-motion.
export const caret = css({
  display: 'inline-block',
  width: '[0.62em]',
  height: '[1.1em]',
  marginInlineStart: '1',
  backgroundColor: 'accent.solid',
  animationName: 'blink',
  animationDuration: '[1s]',
  animationTimingFunction: '[steps(1)]',
  animationIterationCount: 'infinite',
  animationPlayState: 'var(--motion-play, running)',
});
