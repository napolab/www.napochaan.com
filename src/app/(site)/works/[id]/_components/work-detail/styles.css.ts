import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Full-colour figure. Centres the image so a portrait that is bounded below the
// column width sits in the middle with even side gutters.
export const figureRoot = css({
  margin: '0',
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
});

// Box-fit: keeps the image's aspect ratio, bounded by the column width
// (maxWidth) and a viewport-relative height cap (maxHeight) so a portrait source
// can't dominate the screen. width/height auto let the intrinsic ratio drive the
// final size; landscape fills the column, portrait shrinks to the height cap.
export const image = css({
  display: 'block',
  width: 'auto',
  height: 'auto',
  maxWidth: 'full',
  maxHeight: '[min(70vh, 640px)]',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
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

// Persistent per-work ambient backdrop. Fixed to the viewport and sunk behind all
// content (zIndex.hide). The work's thumb url is passed via `--thumb` and the
// image is rendered full-viewport with heavy blur at low opacity so body text
// stays readable. Fixed positioning holds because no ancestor (WorkDetail root,
// the page <main>) establishes a transform/filter containing block.
export const ambient = css({
  position: 'fixed',
  inset: '0',
  zIndex: 'hide',
  backgroundImage: 'var(--thumb)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  filter: '[blur(40px)]',
  opacity: '[0.2]',
  pointerEvents: 'none',
});

// Thin override on top of RichText's own `styles.root` (which already owns color
// fg.default / fontSize md / lineHeight jp). Here we only dim the prose to the
// muted ink so the body sits quieter than the spec ledger — the proof aesthetic.
export const body = css({
  color: 'fg.muted',
});
