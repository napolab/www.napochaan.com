import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Large contact-sheet proof, grayscale by default to keep the ledger's proof
// aesthetic, blooming to colour on hover. Centres the image so a portrait that
// is bounded below the column width sits in the middle with even side gutters.
export const figureRoot = css({
  margin: '0',
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
});

// Box-fit: the proof keeps its aspect ratio, bounded by the column width
// (maxWidth) and a viewport-relative height cap (maxHeight) so a portrait source
// can't dominate the screen. width/height auto let the intrinsic ratio drive the
// final size; landscape fills the column, portrait shrinks to the height cap.
export const image = css({
  display: 'block',
  width: 'auto',
  height: 'auto',
  maxWidth: 'full',
  maxHeight: '[min(70vh, 640px)]',
  filter: '[grayscale(1) contrast(1.05)]',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
  transitionProperty: '[filter]',
  transitionDuration: 'base',
  transitionTimingFunction: 'stepSnap',
  _hover: { filter: '[grayscale(0)]' },
  '@media (prefers-reduced-motion: reduce)': {
    transitionDuration: 'instant',
  },
});

export const imagePlaceholder = css({
  display: 'block',
  width: 'full',
  aspectRatio: '[16 / 10]',
  bg: 'bg.muted',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
});

// Mono spec ledger: dt/dd pairs laid out as a label grid, hairline-ruled like the
// archive rows. Each pair sits on its own line with a leading mono label.
export const spec = css({
  display: 'grid',
  gridTemplateColumns: '[auto 1fr]',
  columnGap: 'element',
  rowGap: '0',
  margin: '0',
});

export const specTerm = css({
  paddingBlock: 'inline',
  fontFamily: 'mono',
  fontSize: 'xs',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.subtle',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
});

export const specDesc = css({
  margin: '0',
  paddingBlock: 'inline',
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'fg.default',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
});

// Thin override on top of RichText's own `styles.root` (which already owns color
// fg.default / fontSize md / lineHeight jp). Here we only dim the prose to the
// muted ink so the body sits quieter than the spec ledger — the proof aesthetic.
export const body = css({
  color: 'fg.muted',
});
