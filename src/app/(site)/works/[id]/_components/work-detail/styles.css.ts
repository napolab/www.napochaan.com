import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'block',
});

// Full-colour figure spanning the column. The image inside owns the uniform 16/10
// frame, so this only resets margin and anchors the ambient layer.
export const figureRoot = css({
  margin: '0',
  position: 'relative',
});

// Uniform contact-sheet frame: every thumbnail fills the column at a fixed 16/10
// aspect ratio and is contained (objectFit) so the whole artwork is shown — never
// cropped. Portrait or square sources letterbox over a transparent backdrop (the
// blurred ambient layer shows through) instead of being clipped.
export const image = css({
  display: 'block',
  width: 'full',
  aspectRatio: '[16 / 10]',
  objectFit: 'contain',
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

// Inline mono meta line: `type · year` on a single hairline-ruled row (replaces
// the former dt/dd ledger). The display number was dropped with the CMS `no` field.
export const meta = css({
  margin: '0',
  paddingTop: 'inline',
  borderTopWidth: 'hairline',
  borderTopStyle: 'solid',
  borderTopColor: 'border.subtle',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
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
// fg.default / fontSize md / lineHeight jp). Dims the prose to the muted ink so
// the body sits quieter than the spec ledger — the proof aesthetic — and bumps
// the weight to medium so the (system-font) Japanese body reads a touch less thin.
// Inherited by the RichText tree; explicit-weight nodes (headings) are unaffected.
export const body = css({
  color: 'fg.muted',
  fontWeight: 'medium',
});
