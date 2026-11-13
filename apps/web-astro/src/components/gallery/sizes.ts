import { CONTENT_MAX_WIDTH_PX } from '@themes/layout';

import type { GalleryArea } from './index';

// Column span of each named template area out of the 6-column grid in styles.css.ts.
const COLUMN_SPAN: Record<GalleryArea, number> = {
  lead: 2,
  sub: 2,
  wide: 4,
  square: 2,
  column: 2,
  inset: 2,
};

const COLUMNS = 6;

/** `sizes` attribute for a gallery cell: a fraction of the viewport below the
 * content cap, a fixed px width above it. */
export const gallerySizes = (area: GalleryArea): string => {
  const fraction = COLUMN_SPAN[area] / COLUMNS;

  return `(min-width: ${CONTENT_MAX_WIDTH_PX}px) ${Math.round(CONTENT_MAX_WIDTH_PX * fraction)}px, ${Math.round(fraction * 100)}vw`;
};
