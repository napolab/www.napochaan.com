import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

import type { HTMLAttributes } from 'react';

type Tone = 'muted' | 'accent' | 'danger';

type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export const SystemAnnotation = ({ tone = 'muted', className, ...rest }: Props) => {
  return <span {...rest} data-tone={tone} className={clsx(styles.root, className)} />;
};
