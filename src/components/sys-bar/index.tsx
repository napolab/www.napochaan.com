'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';

import { usePresence } from '@components/cursor-presence/presence-context';
import { useLifeState } from '@components/game-of-life/provider';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { useMotion } from '@hooks/use-prefers-reduced-motion';

import { isNavActive } from './is-nav-active';
import * as styles from './styles.css';
import { useClock } from './use-clock';

// Every nav target is now a real page. The inline row holds all seven at the
// widest sizes; as the viewport shrinks each slot collapses into the menu one at
// a time from the right (blog first, index last) — see `data-order` in styles.
const navItems = [
  { label: 'index', href: '/' },
  { label: 'about', href: '/about' },
  { label: 'works', href: '/works' },
  { label: 'news', href: '/news' },
  { label: 'log', href: '/log' },
  { label: 'gallery', href: '/gallery' },
  { label: 'blog', href: '/blog' },
];

// One nav item. Holds its own ref so the ScrambleText (trigger="group") has an
// explicit hover host — the whole padded slot, not just the label text. `order`
// is the slot's position in the row (0 = leftmost / index); styles key each
// slot's collapse breakpoint off it so they drop right-to-left as width shrinks.
const NavLink = ({ label, href, active, order }: { label: string; href: string; active: boolean; order: number }) => {
  const [el, setEl] = useState<HTMLAnchorElement | null>(null);

  return (
    <Link ref={setEl} href={href} className={styles.navLink} data-active={active ? 'true' : undefined} data-order={order} tone="inherit" underline={false}>
      <ScrambleText trigger="group" host={el}>
        {label}
      </ScrambleText>
    </Link>
  );
};

export const SysBar = ({ initialTime }: { initialTime: string }) => {
  const clock = useClock(initialTime);
  const state = useLifeState();
  const pathname = usePathname();
  const presence = usePresence();
  const motion = useMotion();
  const gen = `${state.generation}`.padStart(4, '0');

  return (
    <>
      <header className={styles.root}>
        <div className={styles.navRow}>
          {/* Inline slots. Each one collapses out of the row at its own width
              (right-to-left, blog → index); whatever is hidden is reached through
              the menu, which holds the full set at every width. */}
          <nav className={styles.nav} aria-label="グローバルナビゲーション">
            {navItems.map(({ label, href }, order) => (
              <NavLink key={label} label={label} href={href} active={isNavActive(pathname, href)} order={order} />
            ))}
          </nav>
          {/* Below 768px (i.e. once any slot has collapsed): a single trigger
              that opens the full set of targets in a react-aria Menu popover, so
              the bar never wraps to a second row. */}
          <div className={styles.menuRoot}>
            <MenuTrigger>
              {/* aria-label names the trigger (and, through it, the popover) so the
                  decorative ≡ glyph never leaks into the accessible name. */}
              <Button className={styles.menuButton} aria-label="グローバルナビゲーション">
                <span aria-hidden="true">≡</span> menu
              </Button>
              <Popover className={styles.popover}>
                <Menu className={styles.menu} aria-label="グローバルナビゲーション">
                  {navItems.map(({ label, href }) => (
                    <MenuItem key={label} href={href} className={styles.menuItem} data-active={isNavActive(pathname, href) ? 'true' : undefined}>
                      {label}
                    </MenuItem>
                  ))}
                </Menu>
              </Popover>
            </MenuTrigger>
          </div>
        </div>
        <div className={styles.status}>
          <span className={styles.clock}>{clock}</span>
          <span className={styles.gen}>gen {gen}</span>
          <span className={styles.alive}>alive {state.alive}</span>
          <span className={styles.rec}>● rec</span>
          <span className={styles.watching}>watching {presence.count}</span>
          <button type="button" className={styles.toggle} onClick={presence.toggle}>
            {presence.enabled ? 'cursors: on' : 'cursors: off'}
          </button>
          <button type="button" className={styles.toggle} onClick={motion.toggle}>
            {motion.reduced ? 'motion: off' : 'motion: on'}
          </button>
        </div>
      </header>
      <div className={styles.checker} aria-hidden />
    </>
  );
};
