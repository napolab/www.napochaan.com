import { CONTENT_MAX_WIDTH_PX } from '@themes/layout';

import type { Props } from './index';

// The intrinsic frame renders at `min(var(--figure-width), 85%)` of the content
// column (see styles.css.ts) — a touch narrower than the body text — so the
// largest an intrinsic-fit image ever actually renders is 85% of the column,
// never the full column and never wider than its own source. Mirrors the
// `85%` literal in styles.css.ts by hand (Panda extracts that literal
// statically and cannot evaluate an imported constant); sizes.test.ts pins the
// two together the same way src/themes/layout.test.ts pins CONTENT_MAX_WIDTH_PX.
const INTRINSIC_COLUMN_RATIO = 0.85;

// Default `sizes` when the caller doesn't pass one: intrinsic fit never renders
// wider than min(source width, 85% of the content column), so it caps there;
// every other fit is bound by the full site content column.
export const resolveSizes = (fit: Props['fit'], width: number, sizes: Props['sizes']): string => {
  if (sizes !== undefined) return sizes;
  if (fit === 'intrinsic') {
    const cap = Math.min(width, Math.round(CONTENT_MAX_WIDTH_PX * INTRINSIC_COLUMN_RATIO));
    return `(min-width: ${CONTENT_MAX_WIDTH_PX}px) ${cap}px, min(${width}px, 85vw)`;
  }
  return `(min-width: ${CONTENT_MAX_WIDTH_PX}px) ${CONTENT_MAX_WIDTH_PX}px, 100vw`;
};
