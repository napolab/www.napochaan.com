import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Button, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';

import { isNavActive } from '@utils/is-nav-active';
import { siteNavItems } from '@utils/nav-items';

import * as styles from '../styles.css';
import { shouldOpenOnMount } from './handoff';
import { MENU_LABEL, TriggerFace } from './trigger-face';

import type { RefObject } from 'react';
import type { MenuHandoff } from './handoff';

type Props = {
  pathname: string;
  handoff: RefObject<MenuHandoff>;
};

// The react-aria mobile nav menu — the lazily loaded half of ./index.tsx (MenuTrigger,
// Popover, Menu and their overlay/collection code stay out of the initial bundle).
// Behaviour is plain react-aria (arrow keys, type-ahead, focus management, MenuItem
// href soft navigation through the island's RouterProvider); the only addition is
// taking over from the placeholder trigger it replaces.
export const AriaNavMenu = ({ pathname, handoff }: Props) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [initialFocus, setInitialFocus] = useState<MenuHandoff['focusStrategy']>(undefined);

  // USEEFFECT_JUSTIFICATION: imperative focus handoff from the swapped-out
  // placeholder, before paint. The menu mounts CLOSED and opens in this effect's
  // re-render, because the popover's FocusScope captures its restore target during
  // render: opening on mount would capture the outgoing placeholder (detached a
  // moment later), and Escape would drop focus to <body> instead of the trigger.
  useLayoutEffect(() => {
    const open = shouldOpenOnMount(handoff.current);
    if (handoff.current.focused || open) triggerRef.current?.focus();
    if (!open) return;
    setInitialFocus(handoff.current.focusStrategy);
    setOpen(true);
  }, [handoff]);

  // Controlled only so the handed-off open can be applied; react-aria still drives
  // every later open/close (and its own focus strategy) through onOpenChange.
  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setInitialFocus(undefined);
  }, []);

  return (
    <MenuTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <Button ref={triggerRef} className={styles.menuButton} aria-label={MENU_LABEL}>
        <TriggerFace />
      </Button>
      <Popover className={styles.popover}>
        {/* autoFocus only for the handed-off open (undefined → react-aria's own). */}
        <Menu className={styles.menu} aria-label={MENU_LABEL} autoFocus={initialFocus}>
          {siteNavItems.map(({ label, href }) => (
            <MenuItem key={label} href={href} className={styles.menuItem} data-active={isNavActive(pathname, href) ? 'true' : undefined}>
              {label}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
};
