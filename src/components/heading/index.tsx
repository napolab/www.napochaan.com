import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

import type { HTMLAttributes, Ref } from 'react';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type Props = HTMLAttributes<HTMLHeadingElement> & { level?: Level; ref?: Ref<HTMLHeadingElement> };

export const Heading = ({ level = 2, className, children, ref, ...rest }: Props) => {
  const Tag: Tag = `h${level}` as Tag;
  return (
    <Tag ref={ref} {...rest} data-level={level} className={clsx(styles.root, className)}>
      {children}
    </Tag>
  );
};
