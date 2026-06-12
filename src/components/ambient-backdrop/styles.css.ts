import { css } from '@styled/css';

// Fixed to the viewport and sunk to zIndex.hide (-1) — between the body's 方眼 grid
// (the rootmost background) and the GameOfLife canvas (zIndex.base). The thumb url is
// passed via `--thumb` and rendered full-viewport with heavy blur. An 82% white veil
// is stacked over the image via a flat linear-gradient so the thumbnail's residual
// contrast can't bleed behind body text; the whole layer then runs at partial opacity
// so the site's signature grid keeps showing through rather than being slabbed over by
// an opaque image. Fixed positioning holds because no detail-page ancestor establishes
// a transform/filter containing block.
export const root = css({
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
