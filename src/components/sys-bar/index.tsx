'use client';

import { useSyncExternalStore } from 'react';

import { useLifeState } from '@components/game-of-life/provider';
import { dayjs } from '@utils/dayjs';

import * as styles from './styles.css';

const formatNow = () => dayjs().tz('Asia/Tokyo').format('HH:mm:ss');

const listeners = new Set<() => void>();
// Subscription store: these module-level cells are the single allowed `let`
// exception — a useSyncExternalStore source needs a mutable cached snapshot
// and a shared interval handle.
let current = '--:--:--';
let timer: ReturnType<typeof setInterval> | undefined;

const emit = () => {
  current = formatNow();
  for (const listener of listeners) listener();
};

const subscribeClock = (listener: () => void) => {
  listeners.add(listener);
  if (timer === undefined) timer = setInterval(emit, 1000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
};

const getClock = () => current;
const getServerClock = () => '--:--:--';

const navItems = [
  { label: 'index', href: '/', active: true },
  { label: 'about', href: '#about' },
  { label: 'works', href: '#works' },
  { label: 'live', href: '#gigs' },
  { label: 'gallery', href: '#gallery' },
  { label: 'blog', href: '#blog' },
];

export const SysBar = () => {
  const clock = useSyncExternalStore(subscribeClock, getClock, getServerClock);
  const state = useLifeState();
  const gen = `${state.generation}`.padStart(4, '0');

  return (
    <>
      <header className={styles.root}>
        <nav className={styles.nav}>
          {navItems.map(({ label, href, active }) => (
            <a key={label} href={href} className={styles.navLink} data-active={active || undefined}>
              {label}
            </a>
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
