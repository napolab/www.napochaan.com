import { Breadcrumbs } from '@components/breadcrumbs';
import { Heading } from '@components/heading';
import { SystemAnnotation } from '@components/system-annotation';

import * as styles from './styles.css';

type Crumb = {
  href?: string;
  label: string;
};

type Props = {
  title: string;
  breadcrumbs: readonly Crumb[];
  kicker?: string;
  lead?: string;
  annotation?: string;
};

export const PageHeader = ({ title, breadcrumbs, kicker, lead, annotation }: Props) => {
  return (
    <header className={styles.root}>
      <Breadcrumbs items={breadcrumbs} />
      {kicker !== undefined ? <p className={styles.kicker}>{kicker}</p> : null}
      <Heading level={1} className={styles.title}>
        {title}
      </Heading>
      {lead !== undefined ? <p className={styles.lead}>{lead}</p> : null}
      {annotation !== undefined ? (
        <SystemAnnotation tone="muted" className={styles.annotation}>
          {annotation}
          <span className={styles.squareBlue} aria-hidden="true" />
          <span className={styles.squareRed} aria-hidden="true" />
        </SystemAnnotation>
      ) : null}
    </header>
  );
};
