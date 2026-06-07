import { link } from '@styled/recipes';
import { clsx } from '@utils/clsx';

import type { AnchorHTMLAttributes } from 'react';

type Tone = 'accent' | 'muted' | 'default' | 'subtle' | 'inherit';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  // Text colour. Defaults to 'accent' (the inline link colour); 'inherit' keeps
  // the parent's colour (e.g. a link inside an inverted/active context).
  tone?: Tone;
  // Resting underline. Default true.
  underline?: boolean;
  // Saturated hover wash (legacy affordance). Default true; set false where the
  // site-wide scramble is the hover signal instead.
  fill?: boolean;
  // The shared focus ring. Default true; set false for whole-card links that draw
  // their own inset focus indicator.
  focusRing?: boolean;
};

export const Link = ({ className, tone, underline, fill, focusRing, ...rest }: Props) => {
  return <a {...rest} className={clsx(link({ tone, underline, fill, focusRing }), className)} />;
};
