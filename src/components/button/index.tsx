'use client';

import { Button as AriaButton, Link as AriaLink } from 'react-aria-components';

import * as styles from './styles.css';

import type { ButtonProps as AriaButtonProps, LinkProps as AriaLinkProps } from 'react-aria-components';

type Variant = 'solid' | 'outline' | 'danger';
type Size = 'md' | 'sm';

// `type` is the element axis: 'link' renders an anchor (Link), otherwise a button.
// For the button element, `type` doubles as the native button type so form submit
// still works (the contact form passes type="submit"). `variant`/`size` are the
// orthogonal visual axes.
type ButtonVariantProps = Omit<AriaButtonProps, 'className'> & { type?: 'button' | 'submit' | 'reset'; variant?: Variant; size?: Size };
type LinkVariantProps = Omit<AriaLinkProps, 'className'> & { type: 'link'; variant?: Variant; size?: Size; href: string };

type Props = ButtonVariantProps | LinkVariantProps;

export const Button = ({ variant = 'solid', size = 'md', ...rest }: Props) => {
  if (rest.type === 'link') {
    const { type: _elementType, ...linkProps } = rest;
    return <AriaLink {...linkProps} data-variant={variant} data-size={size} className={styles.root} />;
  }

  return <AriaButton {...rest} data-variant={variant} data-size={size} className={styles.root} />;
};
