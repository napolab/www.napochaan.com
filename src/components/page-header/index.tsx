import { Breadcrumbs } from '@components/breadcrumbs';
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
  // 'tight' pulls the title tracking in for long, content titles (e.g. a news
  // detail title) where the default label tracking reads too spread.
  titleTracking?: 'wide' | 'tight';
};

export const PageHeader = ({ title, breadcrumbs, kicker, lead, annotation, titleTracking }: Props) => {
  return (
    <header className={styles.root}>
      <Breadcrumbs items={breadcrumbs} />
      {kicker !== undefined ? <p className={styles.kicker}>{kicker}</p> : null}
      {/* Plain h1 (not Heading) so this class owns the type fully — no display
          font / tracking inherited from the Heading defaults to fight. */}
      <h1 className={styles.title} data-tracking={titleTracking}>
        {title}
      </h1>
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
