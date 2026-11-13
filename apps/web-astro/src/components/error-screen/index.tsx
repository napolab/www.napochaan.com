import { Heading } from '@components/heading';
import { SystemAnnotation } from '@components/system-annotation';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Props = {
  code: string;
  kind: string;
  lead: string;
  tag: string;
  children?: ReactNode;
};

export const ErrorScreen = ({ code, kind, lead, tag, children }: Props) => {
  return (
    <main className={styles.root} id="main-content">
      <p className={styles.kicker}>{`// ${code} — ${kind}`}</p>
      <Heading level={1} className={styles.code}>
        {code}
      </Heading>
      <p className={styles.lead}>{lead}</p>
      <SystemAnnotation tone="danger" className={styles.tag}>
        {tag}
      </SystemAnnotation>
      {children !== undefined ? <div className={styles.actions}>{children}</div> : null}
    </main>
  );
};
