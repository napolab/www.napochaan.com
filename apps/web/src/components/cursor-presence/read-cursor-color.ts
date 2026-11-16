import { CURSOR_COLORS, type CursorColor } from '@lib/cursor/identity';

// Resolve a cursor color token to its computed CSS value. Lives at the consumer
// boundary (not in CursorLayer) so the layer stays agnostic of design tokens / the
// DOM. Shared by the real CursorPresence and the colophon catalog demo.

const FALLBACK = '#111111';

type Palette = ReadonlyMap<CursorColor, string>;

// getComputedStyle on <html> flushes a full-document style recalc whenever style is
// dirty, so the whole palette is read in ONE pass, lazily on the first draw.
const readPalette = (): Palette => {
  const computed = getComputedStyle(document.documentElement);

  return new Map(CURSOR_COLORS.map((color) => [color, computed.getPropertyValue(`--colors-cursor-${color}`).trim()]));
};

// A reader with its own palette cache (the tokens do not change for a document's life).
export const createCursorColorReader = (): ((color: CursorColor) => string) => {
  const cache: { palette: Palette | undefined } = { palette: undefined };

  return (color) => {
    cache.palette ??= readPalette();
    const value = cache.palette.get(color) ?? '';

    return value === '' ? FALLBACK : value;
  };
};

// The shared reader every consumer uses, so the palette is read once per document.
export const readCursorColor = createCursorColorReader();
