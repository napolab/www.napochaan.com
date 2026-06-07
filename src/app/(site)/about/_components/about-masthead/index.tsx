import { EchoText } from '@components/echo-text';
import { SystemAnnotation } from '@components/system-annotation';

import * as styles from './styles.css';

type Props = {
  name: string;
  kicker: string;
  lead: string;
};

// The about masthead, built on the Hero vocabulary: a large EchoText wordmark as
// the page <h1>, a mono kicker, an accent lead, and scattered SystemAnnotation
// marginalia (code / status / coords + blue·red squares) that appear only on
// desktop where there is empty space for them.
export const AboutMasthead = ({ name, kicker, lead }: Props) => {
  return (
    <header className={styles.root}>
      <SystemAnnotation tone="accent" className={styles.annotationStart}>
        A-0420
      </SystemAnnotation>
      <p className={styles.kicker}>{kicker}</p>
      <h1 className={styles.title}>
        <EchoText>{name}</EchoText>
      </h1>
      <p className={styles.lead}>{lead}</p>
      <SystemAnnotation tone="danger" className={styles.annotationEnd}>
        ▸ whoami
      </SystemAnnotation>
      <SystemAnnotation tone="muted" className={styles.annotationCoords}>
        35.6595 / 139.7006
        <span className={styles.squareBlue} aria-hidden="true" />
        <span className={styles.squareRed} aria-hidden="true" />
      </SystemAnnotation>
    </header>
  );
};
