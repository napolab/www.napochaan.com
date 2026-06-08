import type { CursorColor } from '@lib/cursor/identity';

// Resolve a cursor color token to its computed CSS value. Lives at the consumer
// boundary (not in CursorLayer) so the layer stays agnostic of design tokens / the
// DOM. Shared by the real CursorPresence and the colophon catalog demo.
export const readCursorColor = (color: CursorColor): string => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--colors-cursor-${color}`).trim();

  return value === '' ? '#111111' : value;
};
