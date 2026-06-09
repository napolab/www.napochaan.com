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

// Every nav target is now a real page. `primary` items stay inline at every
// width (the mobile shortcut row); the rest collapse into the menu below 768px.
const navItems = [
  { label: 'index', href: '/', primary: true },
  { label: 'about', href: '/about', primary: true },
  { label: 'works', href: '/works', primary: true },
  { label: 'news', href: '/news', primary: false },
  { label: 'log', href: '/log', primary: false },
  { label: 'gallery', href: '/gallery', primary: false },
  { label: 'blog', href: '/blog', primary: false },
];

// One nav item. Holds its own ref so the ScrambleText (trigger="group") has an
// explicit hover host — the whole padded slot, not just the label text.
const NavLink = ({ label, href, active, primary }: { label: string; href: string; active: boolean; primary: boolean }) => {
  const [el, setEl] = useState<HTMLAnchorElement | null>(null);

  return (
    <Link ref={setEl} href={href} className={styles.navLink} data-active={active ? 'true' : undefined} data-primary={primary ? 'true' : undefined} tone="inherit" underline={false}>
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
  const gen = `${state.generation}`.padStart(4, '0');

  return (
    <>
      <header className={styles.root}>
        <div className={styles.navRow}>
          {/* Inline slots. Below 768px only the `primary` items stay (index/about/
              works) — the rest are hidden here and reached through the menu. */}
          <nav className={styles.nav} aria-label="グローバルナビゲーション">
            {navItems.map(({ label, href, primary }) => (
              <NavLink key={label} label={label} href={href} active={isNavActive(pathname, href)} primary={primary} />
            ))}
          </nav>
          {/* Mobile (<768px): a single trigger that opens the full set of targets
              in a react-aria Menu popover, so the bar never wraps to a second row. */}
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
        </div>
      </header>
      <div className={styles.checker} aria-hidden />
    </>
  );
};
