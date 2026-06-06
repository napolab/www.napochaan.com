import { Button } from '@components/button';
import { EchoText } from '@components/echo-text';
import { SystemAnnotation } from '@components/system-annotation';

import * as styles from './styles.css';

const DEFAULT_NAME = 'napochaan';
const DEFAULT_LEAD = '相互作用するインターネットの実験場。影響と関係を、グリッドの上でデザインする。';

type Props = {
  name?: string;
  lead?: string;
};

export const Hero = ({ name = DEFAULT_NAME, lead = DEFAULT_LEAD }: Props) => {
  return (
    <header className={styles.root}>
      <SystemAnnotation tone="accent" className={styles.annotationStart}>
        5470009
      </SystemAnnotation>
      <p className={styles.kicker}>// DJ · VJ · graphic · digital — since 2020</p>
      <EchoText>{name}</EchoText>
      <p className={styles.lead}>
        {lead}
        <span className={styles.caret} aria-hidden="true" />
      </p>
      <div className={styles.buttons}>
        <Button variant="solid">enter →</Button>
        <Button variant="outline">works</Button>
        <Button variant="danger">contact →</Button>
      </div>
      <SystemAnnotation tone="danger" className={styles.annotationEnd}>
        ▸ not found
      </SystemAnnotation>
      <SystemAnnotation tone="muted" className={styles.annotationCoords}>
        35.6595 / 139.7006
        <span className={styles.squareBlue} aria-hidden="true" />
        <span className={styles.squareRed} aria-hidden="true" />
      </SystemAnnotation>
    </header>
  );
};
