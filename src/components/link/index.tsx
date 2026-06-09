'use client';
import { link } from '@styled/recipes';
import { clsx } from '@utils/clsx';
import { Link as AriaLink, LinkProps } from 'react-aria-components';

import type { Ref } from 'react';

type Tone = 'accent' | 'muted' | 'default' | 'subtle' | 'inherit';

type Props = Omit<LinkProps, 'className'> & {
  ref?: Ref<HTMLAnchorElement>;
  className?: string;
  tone?: Tone;
  underline?: boolean;
  hideOutsideFocusRing?: boolean;
};

export const Link = ({ ref, className, tone, underline, hideOutsideFocusRing, ...rest }: Props) => {
  return <AriaLink ref={ref} {...rest} className={clsx(link({ tone, underline, hideOutsideFocusRing }), className)} />;
};
