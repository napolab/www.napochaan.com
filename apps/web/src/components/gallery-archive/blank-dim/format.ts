// The blank's dimension callout text, shared by the React BlankDim (./index.tsx) and the
// `<blank-dim>` custom element (./element.ts): the reference number alone until the
// cell has been measured, then "W×H" above it.
export type BlankSize = { width: number; height: number };

export const blankDimLabel = (refLabel: string, size: BlankSize | null): string => {
  if (size === null || size.width <= 0) return `NO.${refLabel}`;
  return `${size.width}×${size.height}\nNO.${refLabel}`;
};

// A ResizeObserver content rect, rounded to whole CSS pixels.
export const roundedSize = (rect: BlankSize): BlankSize => ({ width: Math.round(rect.width), height: Math.round(rect.height) });
