import { BootConsole } from './boot-console';
import * as styles from './styles.css';

// Font-load overlay shown while Adobe Fonts (Typekit) is still fetching the kit.
// Show / fade is driven ENTIRELY by the class hook the inline Typekit loader puts
// on <html> (boot → removed), so this stays a Server Component; the only client
// code is the BootQuestion typewriter island nested inside BootConsole.
//
// Decorative: the real page content sits in the DOM behind it and is fully
// available to assistive tech, so the overlay is aria-hidden rather than
// announcing a font load (which would be noise for screen-reader users).
export const LoadingOverlay = () => {
  return (
    <div className={styles.root} aria-hidden="true">
      <BootConsole />
    </div>
  );
};
