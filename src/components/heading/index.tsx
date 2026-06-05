import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

import type { HTMLAttributes } from 'react';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type Props = HTMLAttributes<HTMLHeadingElement> & { level?: Level };

export const Heading = ({ level = 2, className, children, ...rest }: Props) => {
  const Tag: Tag = `h${level}` as Tag;
  return (
    <Tag {...rest} data-level={level} className={clsx(styles.root, className)}>
      {children}
    </Tag>
  );
};
