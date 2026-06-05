import { Heading } from '@components/heading';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  no: string;
  level?: Level;
  children: ReactNode;
  more?: ReactNode;
};

export const SectionHeading = ({ no, level, children, more }: Props) => {
  return (
    <div className={styles.root}>
      <span className={styles.no}>{no}</span>
      <Heading level={level ?? 2}>{children}</Heading>
      {more !== undefined ? <span className={styles.more}>{more}</span> : null}
    </div>
  );
};
