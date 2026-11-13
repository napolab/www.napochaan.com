import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

import type { ElementType, HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLElement> & { as?: ElementType };

export const Card = ({ as = 'article', className, children, ...rest }: Props) => {
  const Tag = as;
  return (
    <Tag {...rest} className={clsx(styles.root, className)}>
      {children}
    </Tag>
  );
};
