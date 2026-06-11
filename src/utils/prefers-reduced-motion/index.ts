import { read, subscribe as subscribePersistent } from '@utils/persistent-store';

const QUERY = '(prefers-reduced-motion: reduce)';

// localStorage key for the user's explicit motion choice. `boolean | null`:
//   true  → motion on  (not reduced)
//   false → motion off (reduced)
//   null  → no choice yet, follow the OS setting
export const MOTION_STORAGE_KEY = 'motion-enabled';

// Pure resolution of the effective preference: an explicit user override always
// wins; absent one (null) we follow the OS. Extracted so the precedence is unit
// testable without touching localStorage or matchMedia.
export const resolveReducedMotion = (override: boolean | null, osReduced: boolean): boolean => (override === null ? osReduced : !override);

const osReduced = (): boolean => typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
const readOverride = (): boolean | null => read<boolean | null>(MOTION_STORAGE_KEY, null);

// Standalone read of the current effective preference (user override + OS). Used
// directly by imperative callers (e.g. GSAP decode guards) that can't read context.
export const prefersReducedMotion = (): boolean => resolveReducedMotion(readOverride(), osReduced());

// Subscribe to effective-preference changes: fires when EITHER the stored override
// changes (this tab via the toggle, other tabs via `storage`) OR the OS setting
// changes. Exported for imperative consumers (e.g. the cursor canvas rAF loop) that
// live outside React render and so can't use the hook.
export const subscribeReducedMotion = (onChange: () => void): (() => void) => {
  const unsubscribeStore = subscribePersistent(MOTION_STORAGE_KEY, onChange);
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);

  return () => {
    unsubscribeStore();
    query.removeEventListener('change', onChange);
  };
};
