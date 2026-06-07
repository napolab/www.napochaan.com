import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Props = {
  name: string;
  why: string;
  children: ReactNode;
};

// One catalog entry: a bordered cell with the component name (mono), a loose
// "why this shape" line, and the real component rendered live as children.
// The demo JSX is passed in by the page so this stays UI-only (no data coupling).
export const ComponentDemo = ({ name, why, children }: Props) => {
  return (
    <div className={styles.root}>
      <span className={styles.name}>{name}</span>
      <p className={styles.why}>{why}</p>
      <div className={styles.stage}>{children}</div>
    </div>
  );
};
