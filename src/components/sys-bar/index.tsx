'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

import { useLifeState } from '@components/game-of-life/provider';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import { isNavActive } from './is-nav-active';
import * as styles from './styles.css';
import { useClock } from './use-clock';

// Transitional nav targets: 'index', 'about', 'works', 'news' and 'blog' are
// real pages; the rest jump to home-page sections until their own routes exist
// (see isNavActive — anchors are never page-active).
const navItems = [
  { label: 'index', href: '/' },
  { label: 'about', href: '/about' },
  { label: 'works', href: '/works' },
  { label: 'news', href: '/news' },
  { label: 'log', href: '/#log' },
  { label: 'gallery', href: '/#gallery' },
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
  const gen = `${state.generation}`.padStart(4, '0');

  return (
    <>
      <header className={styles.root}>
        <nav className={styles.nav}>
          {navItems.map(({ label, href }) => (
            <NavLink key={label} label={label} href={href} active={isNavActive(pathname, href)} />
          ))}
        </nav>
        <div className={styles.status}>
          <span>{clock}</span>
          <span className={styles.gen}>gen {gen}</span>
          <span>alive {state.alive}</span>
          <span className={styles.rec}>● rec</span>
        </div>
      </header>
      <div className={styles.checker} aria-hidden />
    </>
  );
};
