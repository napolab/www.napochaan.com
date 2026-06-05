import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

import type { HTMLAttributes } from 'react';

type Tone = 'default' | 'blue' | 'outline';

type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export const Tag = ({ tone = 'default', className, ...rest }: Props) => {
  return <span {...rest} data-tone={tone} className={clsx(styles.root, className)} />;
};
