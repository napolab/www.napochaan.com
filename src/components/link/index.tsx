import { link } from '@styled/recipes';
import { clsx } from '@utils/clsx';

import type { AnchorHTMLAttributes, Ref } from 'react';

type Tone = 'accent' | 'muted' | 'default' | 'subtle' | 'inherit';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  // Forwarded to the underlying <a> so a whole-card link can be the explicit
  // hover host of a ScrambleText (trigger="group").
  ref?: Ref<HTMLAnchorElement>;
  // Text colour. Defaults to 'accent' (the inline link colour); 'inherit' keeps
  // the parent's colour (e.g. a link inside an inverted/active context).
  tone?: Tone;
  // Resting underline. Default true.
  underline?: boolean;
  // The shared focus ring. Default true; set false for whole-card links that draw
  // their own inset focus indicator.
  focusRing?: boolean;
};

export const Link = ({ ref, className, tone, underline, focusRing, ...rest }: Props) => {
  return <a ref={ref} {...rest} className={clsx(link({ tone, underline, focusRing }), className)} />;
};
