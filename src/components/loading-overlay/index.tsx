import * as styles from './styles.css';

// Font-load overlay shown while Adobe Fonts (Typekit) is still fetching the kit.
// It is driven ENTIRELY by the class hook the inline Typekit loader puts on
// <html> (wf-loading → wf-active / wf-inactive), so this stays a pure Server
// Component with zero client JS — all show / fade logic lives in styles.css.
//
// Decorative: the real page content sits in the DOM behind it and is fully
// available to assistive tech, so the overlay is aria-hidden rather than
// announcing a font load (which would be noise for screen-reader users).
export const LoadingOverlay = () => {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.consoleRoot}>
        <p className={styles.brand}>
          <span className={styles.square} />
          napochaan
        </p>
        <p className={styles.status}>
          LOADING TYPEFACES
          <span className={styles.caret} />
        </p>
        <div className={styles.bar}>
          <span className={styles.barFill} />
        </div>
      </div>
    </div>
  );
};
