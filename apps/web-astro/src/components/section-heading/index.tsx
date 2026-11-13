import { Heading } from '@components/heading';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  no: string;
  level?: Level;
  children: ReactNode;
  // When set, the title itself links to its full page (with the shared scramble).
  href?: string;
  more?: ReactNode;
  moreHref?: string;
};

const MoreLabel = ({ href, children }: { href?: string; children: ReactNode }) => {
  if (href === undefined) return <span className={styles.more}>{children}</span>;
  return (
    <Link href={href} tone="muted" underline={false} className={styles.more}>
      {typeof children === 'string' ? <ScrambleText>{children}</ScrambleText> : children}
    </Link>
  );
};

const Title = ({ href, children }: { href?: string; children: ReactNode }) => {
  if (href === undefined) return <>{children}</>;
  return (
    <Link href={href} tone="inherit" underline={false}>
      {typeof children === 'string' ? <ScrambleText>{children}</ScrambleText> : children}
    </Link>
  );
};

export const SectionHeading = ({ no, level, children, href, more, moreHref }: Props) => {
  return (
    <div className={styles.root}>
      <span className={styles.no}>{no}</span>
      <Heading level={level ?? 2}>
        <Title href={href}>{children}</Title>
      </Heading>
      {more !== undefined ? <MoreLabel href={moreHref}>{more}</MoreLabel> : null}
    </div>
  );
};
