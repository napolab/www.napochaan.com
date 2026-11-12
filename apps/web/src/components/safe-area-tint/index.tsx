import { ScrollRangeSync } from './scroll-range-sync';
import * as styles from './styles.css';

// iOS 26 Safari's Liquid Glass chrome (status-bar "forehead" / toolbar "chin")
// renders the page pixels located in DOCUMENT space just outside the viewport —
// the scrolled-away content above it, and the upcoming content below it.
// env(safe-area-inset-top) is 0 in browser mode, and fixed/sticky elements are
// clipped to the viewport, so they can never paint those regions.
// Absolutely-positioned strips anchored to the initial containing block CAN:
// scroll timelines (animation-timeline: scroll(root block)) translate them so
// the top strip's bottom edge chases the viewport top and the bottom strip's
// top edge chases the viewport bottom (small overlaps hidden behind the
// TypographyBand) at every scroll position, keeping brand-blue pixels behind
// the glass. The timeline's progress maps scrollY over
// (scrollHeight - innerHeight), which pure CSS cannot express, so
// ScrollRangeSync publishes it as --scroll-range (+ --viewport-h for the
// bottom strip's anchor).
export const SafeAreaTint = () => {
  return (
    <div className={styles.root} aria-hidden="true" data-testid="safe-area-tint">
      <div className={styles.strip} data-testid="safe-area-tint-strip" />
      <div className={styles.bottomClip}>
        <div className={styles.stripBottom} data-testid="safe-area-tint-strip-bottom" />
      </div>
      <ScrollRangeSync />
    </div>
  );
};
