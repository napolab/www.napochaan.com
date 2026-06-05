'use client';

import { Button as AriaButton } from 'react-aria-components';

import * as styles from './styles.css';

import type { ButtonProps as AriaButtonProps } from 'react-aria-components';

type Variant = 'solid' | 'outline' | 'danger';

type Props = Omit<AriaButtonProps, 'className'> & { variant?: Variant };

export const Button = ({ variant = 'solid', children, ...rest }: Props) => {
  return (
    <AriaButton {...rest} data-variant={variant} className={styles.button({ variant })}>
      {children}
    </AriaButton>
  );
};
