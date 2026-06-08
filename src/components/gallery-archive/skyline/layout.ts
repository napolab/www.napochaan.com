// Wide landscape images (e.g. 16:9 VRChat shots) earn a 2-column span; portrait flyers
// and near-square frames stay 1 column. Packing clamps the span to the column count,
// so this never needs to know how many columns exist.
export const spanForAspect = (ratio: number): number => (ratio >= 1.6 ? 2 : 1);
