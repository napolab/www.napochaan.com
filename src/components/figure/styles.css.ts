import { css } from '@styled/css';

export const root = css({
  position: 'relative',
  display: 'block',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'fg.default',
  borderRadius: 'none',
  m: '0',
  // Cover variant clips the scaled blurred backdrop (and the corner tag) to the frame.
  '&[data-variant="cover"]': { overflow: 'hidden' },
  // Intrinsic fit (cover only): the frame width follows the source's real width,
  // capped to 85% of the content column (a touch narrower than the body text),
  // keeping the 16:9 ratio. A small source shrinks the whole frame; a large source
  // settles at the 85% cap. Centred in the column, with a little breathing room
  // above and below so the picture sits apart from the surrounding body text.
  '&[data-variant="cover"][data-fit="intrinsic"]': {
    width: '[min(var(--figure-width), 85%)]',
    aspectRatio: '[16 / 9]',
    marginInline: '[auto]',
    marginBlock: '8',
  },
});

// Uniform 16/9 frame: the image is contained so the whole picture is shown —
// never cropped. A 16:9 source (the common thumbnail ratio) fills the frame edge
// to edge, so the corner tag sits flush on the picture. Portrait or square sources
// letterbox over the blurred backdrop instead of being clipped. In the cover
// variant it is lifted above the blurred backdrop layer.
export const image = css({
  display: 'block',
  width: 'full',
  aspectRatio: '[16 / 9]',
  objectFit: 'contain',
  'figure[data-variant="cover"] &': {
    position: 'relative',
    zIndex: '[1]',
  },
  // Intrinsic fit: fill the (intrinsic-width) 16:9 frame and contain, so the
  // picture is letterboxed over the blurred backdrop — the cover look at a smaller
  // size. The base 16/9 aspect ratio is cleared so the frame governs the box.
  'figure[data-variant="cover"][data-fit="intrinsic"] &': {
    width: 'full',
    height: 'full',
    objectFit: 'contain',
    aspectRatio: '[auto]',
    position: 'relative',
    zIndex: '[1]',
  },
});

// Cover-variant backdrop: a heavily-blurred, cover-cropped copy of the image filling
// the whole frame so the letterbox gaps never reveal the page behind. Scaled up so
// the blur can't bleed transparent edges into the frame. Purely decorative.
export const backdrop = css({
  position: 'absolute',
  inset: '0',
  zIndex: '[0]',
  backgroundImage: 'var(--figure-backdrop)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  filter: '[blur(24px)]',
  transform: '[scale(1.15)]',
  pointerEvents: 'none',
});

// Zoomable trigger: wraps the image in a tap target that opens the shared gallery
// Lightbox. Mirrors the gallery cell trigger — a transparent button with a
// zoom-in cursor and an `::after` accent frame that fades in on hover/focus
// (plus an ink focus ring). The button paints above the cover backdrop (zIndex 1,
// same layer as the image) and the accent frame paints above the image (zIndex 2).
export const trigger = css({
  display: 'block',
  width: 'full',
  position: 'relative',
  zIndex: '[1]',
  m: '0',
  p: '0',
  border: 'none',
  bg: 'transparent',
  cursor: '[zoom-in]',
  // Intrinsic fit lets the image be width:full;height:full, so the trigger must
  // fill the frame's height for the image to size correctly. For fill, the image's
  // own 16:9 aspect-ratio drives the height, so leave it auto here.
  'figure[data-variant="cover"][data-fit="intrinsic"] &': { height: 'full' },
  _after: {
    content: '""',
    position: 'absolute',
    inset: '0',
    borderWidth: 'strong',
    borderStyle: 'solid',
    borderColor: 'accent.solid',
    opacity: '[0]',
    pointerEvents: 'none',
    zIndex: '[2]',
  },
  _hover: {
    _after: { opacity: '[1]' },
  },
  _focusVisible: {
    _after: {
      opacity: '[1]',
      inset: '[3px]',
      outlineWidth: 'strong',
      outlineStyle: 'solid',
      outlineColor: 'fg.default',
      outlineOffset: '0',
    },
  },
});

export const caption = css({
  display: 'block',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: 'xs',
  lineHeight: 'snug',
  color: 'fg.muted',
  px: 'element',
  py: '2',
  borderTopWidth: 'hairline',
  borderTopStyle: 'dashed',
  borderTopColor: 'border.subtle',
});

// Cover-variant caption: a gallery-style solid corner tag pinned to the frame's
// bottom-left, painted over the image. mono, uppercased (e.g. 'GRAPHIC / 2024').
export const tag = css({
  position: 'absolute',
  left: '0',
  bottom: '0',
  zIndex: '[2]',
  pointerEvents: 'none',
  fontFamily: 'mono',
  fontVariationSettings: '"wght" 600',
  fontSize: '[10px]',
  letterSpacing: 'wide',
  textTransform: 'uppercase',
  lineHeight: 'snug',
  bg: 'fg.default',
  color: 'fg.onSolid',
  paddingInline: '[6px]',
  paddingBlock: '[1px]',
});
