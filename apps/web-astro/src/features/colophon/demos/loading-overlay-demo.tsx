import { BootConsole } from '@components/loading-overlay/boot-console';

import * as styles from './loading-overlay-demo.css';

// The boot overlay is a fixed, full-viewport element that only appears while fonts
// load, so it can't be shown inline. This drops the real BootConsole — brand line,
// the cycling typed prompt, and the progress bar — into a static brand-blue frame.
// The prompt cycles and the bar fills independently; they aren't synced at boot either.
export const LoadingOverlayDemo = () => {
  return (
    <div className={styles.frame}>
      <BootConsole />
    </div>
  );
};
