import { css } from '@styled/css';

export const root = css({
  display: 'flex',
  flexDirection: 'column',
  // Grow to absorb the slack in the shell's filled column so the related works and
  // prev/next nav settle at the bottom of the fold on short works. The grow resolves
  // to 0 once the page overflows the viewport, so longer works are unaffected.
  flexGrow: 1,
  gap: 'block',
});

// No-thumbnail stand-in. Mirrors the shared Figure proof frame (16/10, 2px fg.default
// border) so the empty state keeps the same outer silhouette as a real thumbnail.
export const imagePlaceholder = css({
  display: 'block',
  width: 'full',
  aspectRatio: '[16 / 10]',
  bg: 'bg.muted',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
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

// Persistent per-work ambient backdrop. Fixed to the viewport and sunk to zIndex.hide
// (-1) — between the body's 方眼 grid (the rootmost background) and the GameOfLife
// canvas (zIndex.base). The work's thumb url is passed via `--thumb` and rendered
// full-viewport with heavy blur. An 82% white veil is stacked over the image via a
// flat linear-gradient so the artwork's residual contrast can't bleed behind body
// text; the whole layer then runs at partial opacity so the site's signature grid
// keeps showing through underneath rather than being slabbed over by an opaque image.
// The net read: near-white page, the grid intact, a faint blurred trace of the work's
// colour as ambience. Fixed positioning holds because no ancestor (WorkDetail root,
// the page <main>) establishes a transform/filter containing block.
export const ambient = css({
  position: 'fixed',
  inset: '0',
  zIndex: 'hide',
  backgroundImage: '[linear-gradient(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.82)), var(--thumb)]',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  filter: '[blur(40px)]',
  opacity: '[0.5]',
  pointerEvents: 'none',
});

// Thin override on top of RichText's own `styles.root` (which already owns color
// fg.default / fontSize md / lineHeight jp). Dims the prose to the muted ink so
// the body sits quieter than the spec ledger — the proof aesthetic. No weight
// override: the body inherits the global body weight so the prose matches /about.
export const body = css({
  color: 'fg.muted',
});
