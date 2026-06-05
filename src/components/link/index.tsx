import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

import type { AnchorHTMLAttributes } from 'react';

type Props = AnchorHTMLAttributes<HTMLAnchorElement>;

export const Link = ({ className, ...rest }: Props) => {
  return <a {...rest} className={clsx(styles.root, className)} />;
};
