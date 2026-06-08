'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';

import { usePresence } from '@components/cursor-presence/presence-context';
import { useLifeState } from '@components/game-of-life/provider';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import { isNavActive } from './is-nav-active';
import * as styles from './styles.css';
import { useClock } from './use-clock';

// Every nav target is now a real page.
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
// explicit hover host — the whole padded slot, not just the label text.
const NavLink = ({ label, href, active }: { label: string; href: string; active: boolean }) => {
  const [el, setEl] = useState<HTMLAnchorElement | null>(null);

  return (
    <Link ref={setEl} href={href} className={styles.navLink} data-active={active ? 'true' : undefined} tone="inherit" underline={false}>
      <ScrambleText trigger="group" host={el}>
        {label}
      </ScrambleText>
    </Link>
  );
};

export const SysBar = () => {
  const clock = useClock();
  const state = useLifeState();
  const pathname = usePathname();
  const presence = usePresence();
  const gen = `${state.generation}`.padStart(4, '0');

  return (
    <>
      <header className={styles.root}>
        {/* Desktop (≥768px): inline slots. Hidden below, where 7 slots would wrap. */}
        <nav className={styles.nav} aria-label="グローバルナビゲーション">
          {navItems.map(({ label, href }) => (
            <NavLink key={label} label={label} href={href} active={isNavActive(pathname, href)} />
          ))}
        </nav>
        {/* Mobile (<768px): a single trigger that opens the same targets in a
            react-aria Menu popover, so the bar never wraps to a second nav row. */}
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
        <div className={styles.status}>
          <span>{clock}</span>
          <span className={styles.gen}>gen {gen}</span>
          <span>alive {state.alive}</span>
          <span className={styles.rec}>● rec</span>
          <span className={styles.watching}>watching {presence.count}</span>
          <button type="button" className={styles.toggle} onClick={presence.toggle}>
            {presence.enabled ? 'cursors: on' : 'cursors: off'}
          </button>
        </div>
      </header>
      <div className={styles.checker} aria-hidden />
    </>
  );
};
