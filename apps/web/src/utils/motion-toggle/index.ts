import { writeMotionCookie } from '@utils/motion-cookie';
import { write } from '@utils/persistent-store';
import { MOTION_STORAGE_KEY, prefersReducedMotion, subscribeReducedMotion } from '@utils/prefers-reduced-motion';

// The header `motion:` toggle and the `--motion-play` bridge, framework-free. They used
// to live only inside the React MotionProvider; the SysBar is now a custom element and a
// typical page mounts no React root, so the element (and MotionProvider, for the islands
// that remain) share these. Client only.

// Flip the effective motion state: store the explicit "motion enabled" boolean that is
// the opposite of the current motion-on — i.e. the current `reduced` — and mirror it
// into the cookie the pre-paint boot script reads (@utils/motion-cookie).
export const toggleMotion = (): void => {
  const reduced = prefersReducedMotion();
  write(MOTION_STORAGE_KEY, reduced);
  writeMotionCookie(reduced);
};

// Imperative bridge from JS state to CSS. Pure-CSS animations read `var(--motion-play)`;
// writing it inline on <html> lets the toggle (which can override the OS either way)
// pause/resume them. Inline beats the stylesheet :root default, so this is the
// effective source once JS runs.
export const writeMotionPlay = (reduced: boolean): void => {
  document.documentElement.style.setProperty('--motion-play', reduced ? 'paused' : 'running');
};

// Keeps `--motion-play` in step with the effective preference (override + OS) until the
// returned function is called.
export const bindMotionPlay = (): (() => void) => {
  const apply = () => writeMotionPlay(prefersReducedMotion());
  apply();

  return subscribeReducedMotion(apply);
};
