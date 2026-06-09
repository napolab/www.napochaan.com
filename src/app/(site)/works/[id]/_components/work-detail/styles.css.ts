import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Full-colour figure. Centres the image so a portrait that is bounded below the
// column width sits in the middle with even side gutters.
// When data-fit="cover" is set (small thumbnail), centering is removed so the
// image stretches to fill the full column width.
export const figureRoot = css({
  margin: '0',
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  '&[data-fit="cover"]': {
    justifyContent: 'stretch',
  },
});

// Box-fit: keeps the image's aspect ratio, bounded by the column width
// (maxWidth) and a viewport-relative height cap (maxHeight) so a portrait source
// can't dominate the screen. width/height auto let the intrinsic ratio drive the
// final size; landscape fills the column, portrait shrinks to the height cap.
// When data-fit="cover" is present (small thumbnail < 1920×1080), the image fills
// the full column width at a fixed 16/10 aspect ratio instead.
export const image = css({
  display: 'block',
  width: 'auto',
  height: 'auto',
  maxWidth: 'full',
  maxHeight: '[min(70vh, 640px)]',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
  '&[data-fit="cover"]': {
    width: 'full',
    height: 'auto',
    maxHeight: '[none]',
    aspectRatio: '[16 / 10]',
    objectFit: 'cover',
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

// Inline mono meta line: `type · year` on a single hairline-ruled row (replaces
// the former dt/dd ledger). The display number was dropped with the CMS `no` field.
export const meta = css({
  margin: '0',
  paddingTop: 'inline',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
  fontFamily: 'mono',
  fontSize: 'sm',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  color: 'fg.subtle',
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
