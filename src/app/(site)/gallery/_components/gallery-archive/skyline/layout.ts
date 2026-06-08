// Breakpoints: mobile 0 / tablet 480 / desktop 768 (src/themes/breakpoints.ts).
// Column count grows with available width so cells stay a comfortable size.
export const resolveColumns = (width: number): number => {
  if (width < 480) return 2;
  if (width < 768) return 3;
  return 4;
};

// Wide landscape images (e.g. 16:9 VRChat shots) earn a 2-column span; portrait
// flyers and near-square frames stay 1 column. Packing clamps span to the column
// count, so this never needs to know how many columns exist.
export const spanForAspect = (ratio: number): number => (ratio >= 1.6 ? 2 : 1);
