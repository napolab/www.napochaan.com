import { Button } from 'react-aria-components';

import * as styles from '../styles.css';
import { MENU_LABEL, TriggerFace } from './trigger-face';

import type { ButtonProps } from 'react-aria-components';
import type { Ref } from 'react';

type Props = Omit<ButtonProps, 'className' | 'children' | 'aria-label'> & {
  ref?: Ref<HTMLButtonElement>;
};

// The menu trigger before the react-aria menu chunk lands: the same react-aria Button
// face as the real MenuTrigger's (so the data-hovered / data-pressed styles and the
// accessible name are identical). aria-haspopup / aria-expanded mirror what
// react-aria's MenuTrigger puts on its Button, so the swap is silent to assistive tech.
// Rendered by the React NavMenu placeholder (wired with press handlers) and, without a
// directive, by sys-bar.astro (wired by the <sys-bar> element).
export const MenuTriggerButton = ({ ref, ...rest }: Props) => (
  <Button ref={ref} {...rest} className={styles.menuButton} aria-label={MENU_LABEL} aria-haspopup="true" aria-expanded={false}>
    <TriggerFace />
  </Button>
);
