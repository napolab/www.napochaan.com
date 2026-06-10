import { css } from '@styled/css';

// Single column on mobile (TOC above body in DOM order); two columns on desktop
// with the body left and a fixed-width TOC rail right.
export const layout = css({
  display: 'grid',
  // Grow to absorb the slack in the shell's filled column so the prev/next nav and
  // footer settle at the bottom of the fold on short posts. The grow resolves to 0
  // once the post overflows the viewport, so long posts are unaffected.
  flexGrow: 1,
  gap: 'block',
  gridTemplateColumns: { base: '[1fr]', desktop: '[1fr 14rem]' },
  columnGap: { desktop: 'block' },
});

// Desktop: pin the body to column 1 / row 1 so it sits left of the TOC despite
// coming second in the DOM.
// No weight override: the RichText body inherits the global body weight so the
// prose matches /about (which renders bio/philosophy through the same RichText).
export const bodyCol = css({
  gridColumn: { desktop: '1' },
  gridRow: { desktop: '1' },
});

// Desktop: TOC rail in column 2 / row 1, stuck below the fixed top band (the
// safe-area-aware --band-top, see global-css).
export const tocCol = css({
  gridColumn: { desktop: '2' },
  gridRow: { desktop: '1' },
  alignSelf: 'start',
  position: { desktop: 'sticky' },
  top: { desktop: '[calc(var(--band-top) + token(spacing.6))]' },
});
