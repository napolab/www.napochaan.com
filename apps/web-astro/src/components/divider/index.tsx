'use client';

import { Separator } from 'react-aria-components';

import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

import type { SeparatorProps } from 'react-aria-components';

type Orientation = 'horizontal' | 'vertical';
type Variant = 'solid' | 'dashed';

type Props = Omit<SeparatorProps, 'orientation' | 'className'> & {
  orientation?: Orientation;
  variant?: Variant;
  className?: string;
};

export const Divider = ({ orientation = 'horizontal', variant = 'solid', className, ...rest }: Props) => {
  return <Separator {...rest} orientation={orientation} data-orientation={orientation} data-variant={variant} className={clsx(styles.root, className)} />;
};
