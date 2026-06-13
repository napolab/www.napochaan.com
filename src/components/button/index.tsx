'use client';

import { Button as AriaButton, Link as AriaLink } from 'react-aria-components';

import * as styles from './styles.css';

import type { ButtonProps as AriaButtonProps, LinkProps as AriaLinkProps } from 'react-aria-components';

type Variant = 'solid' | 'outline' | 'danger';
type Size = 'md' | 'sm';

type ButtonVariantProps = Omit<AriaButtonProps, 'className'> & { variant?: Variant; size?: Size; href?: never };
type LinkVariantProps = Omit<AriaLinkProps, 'className' | 'href'> & { variant?: Variant; size?: Size; href: string };

type Props = ButtonVariantProps | LinkVariantProps;

export const Button = ({ variant = 'solid', size = 'md', ...rest }: Props) => {
  if (rest.href !== undefined) {
    return <AriaLink {...rest} data-variant={variant} data-size={size} className={styles.root} />;
  }

  return <AriaButton {...rest} data-variant={variant} data-size={size} className={styles.root} />;
};
