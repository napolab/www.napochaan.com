import * as styles from './typography-band-demo.css';

// A contained mini version of the page's four-edge band. Pure CSS (no JS / no
// scroll coupling): the wordmark scrolls clockwise around a small frame — top ←,
// right ↑, bottom →, left ↓ — to show the component's identity without the live
// viewport-fixed chrome.
const TEXT = 'NAPOCHAAN · DJ × VJ · SINCE 2020 · ';
const repeated = TEXT.repeat(6);

export const TypographyBandDemo = () => {
  return (
    <div className={styles.frame} aria-hidden="true">
      <div className={styles.bandTop}>
        <div className={styles.trackX}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
      <div className={styles.bandBottom}>
        <div className={styles.trackXReverse}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
      <div className={styles.bandLeft}>
        <div className={styles.trackYReverse}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
      <div className={styles.bandRight}>
        <div className={styles.trackY}>
          <span>{repeated}</span>
          <span>{repeated}</span>
        </div>
      </div>
    </div>
  );
};
