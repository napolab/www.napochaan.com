import { Button } from '@components/button';
import { EchoText } from '@components/echo-text';
import { SystemAnnotation } from '@components/system-annotation';

import { LeadQuote } from './lead-quote';
import * as styles from './styles.css';

const DEFAULT_NAME = 'napochaan';
const DEFAULT_LEAD = 'さまざまな「破壊」、承っております。';
const SUB = 'も～っと！ドパガキ！！！！！！！！！！！！！！(11期)';

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
      <p className={styles.kicker}>// おそろしき、なんでも屋 — engineer / DJ / VJ</p>
      <EchoText>{name}</EchoText>
      <LeadQuote text={lead} />
      <p className={styles.sub}>{SUB}</p>
      <div className={styles.buttons}>
        <Button type="link" variant="solid" href="/about">
          enter →
        </Button>
        <Button type="link" variant="outline" href="/works">
          works
        </Button>
        <Button type="link" variant="danger" href="/contact">
          contact →
        </Button>
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
