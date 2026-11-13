import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

import type { HTMLAttributes } from 'react';

type Tone = 'accent' | 'danger' | 'neutral';

type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export const Badge = ({ tone = 'accent', className, children, ...rest }: Props) => {
  return (
    <span {...rest} data-tone={tone} className={clsx(styles.root, className)}>
      <span data-testid="badge-dot" data-tone={tone} aria-hidden="true" className={styles.dot} />
      {children}
    </span>
  );
};
