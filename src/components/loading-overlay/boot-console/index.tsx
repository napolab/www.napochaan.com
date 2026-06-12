import { BootQuestion } from '../boot-question';
import * as styles from '../styles.css';

// The overlay's inner console block: brand wordmark, the typed question line, and
// the progress bar. A Server Component (only the BootQuestion line is a client
// island). Kept separate from LoadingOverlay so the colophon demo can drop the
// same console into a static frame instead of the fixed full-viewport root.
export const BootConsole = () => {
  return (
    <div className={styles.consoleRoot}>
      <p className={styles.brand}>
        <span className={styles.square} />
        napochaan
      </p>
      <p className={styles.status}>
        <span className={styles.quote}>{'>'}</span>
        <BootQuestion />
      </p>
      <div className={styles.bar}>
        <span className={styles.barFill} />
      </div>
    </div>
  );
};
