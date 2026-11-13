import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import * as styles from './styles.css';

type Props = {
  href: string;
  label: string;
};

// Back-to-index link rendered at the foot of a detail page (blog / works). The
// arrow is decorative ink; the label carries the accent colour + the resting
// underline, with the scramble as the hover signal — the site-wide link
// affordance, kept legible (sm) instead of the buried xs/subtle it replaced.
export const BackToIndex = ({ href, label }: Props) => {
  return (
    <Link href={href} className={styles.root} tone="accent" underline={false}>
      <span className={styles.arrow} aria-hidden="true">
        ←
      </span>
      <span className={styles.label}>
        <ScrambleText>{label}</ScrambleText>
      </span>
    </Link>
  );
};
