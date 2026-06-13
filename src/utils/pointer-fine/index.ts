// Whether the primary pointer is a mouse-like "fine" pointer. The selection-share
// Popover is desktop-only; touch devices fall back to the OS selection menu.
const QUERY = '(pointer: fine)';

export const pointerFine = (): boolean => typeof window !== 'undefined' && window.matchMedia(QUERY).matches;

export const subscribePointerFine = (onChange: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
