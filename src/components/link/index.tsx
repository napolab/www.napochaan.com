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
  // Suppress the recipe's shared focus ring (which sits 3px outside the element).
  // Default false. Set it on whole-card links / full-width bars that draw their
  // own inset focus indicator, where an outside ring would be clipped.
  hideOutsideFocusRing?: boolean;
};

export const Link = ({ ref, className, tone, underline, hideOutsideFocusRing, ...rest }: Props) => {
  return <a ref={ref} {...rest} className={clsx(link({ tone, underline, hideOutsideFocusRing }), className)} />;
};
