import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  reverse?: boolean;
};

export const Marquee = ({ children, reverse }: Props) => {
  return (
    <div data-testid="marquee" aria-hidden="true" data-reverse={reverse === true ? 'true' : undefined} className={styles.root}>
      <div className={styles.track} data-reverse={reverse === true ? 'true' : undefined}>
        <span>{children}</span>
        <span>{children}</span>
      </div>
    </div>
  );
};
