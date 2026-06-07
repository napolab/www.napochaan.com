'use client';

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
            <Link key={label} href={href} className={styles.navLink} data-active={isNavActive(pathname, href) ? 'true' : undefined} tone="inherit" underline={false} fill={false}>
              <ScrambleText trigger="group">{label}</ScrambleText>
            </Link>
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
