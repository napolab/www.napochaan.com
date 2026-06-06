'use client';

import { useSyncExternalStore } from 'react';

import { useLifeState } from '@components/game-of-life/provider';
import { dayjs } from '@utils/dayjs';

import * as styles from './styles.css';

const formatNow = () => dayjs().tz('Asia/Tokyo').format('HH:mm:ss');

const listeners = new Set<() => void>();
// Subscription store for useSyncExternalStore: a const cell object holds the
// cached snapshot and the shared interval handle (mutated, never reassigned).
const clockStore: { current: string; timer: ReturnType<typeof setInterval> | undefined } = {
  current: '--:--:--',
  timer: undefined,
};

const emit = () => {
  clockStore.current = formatNow();
  for (const listener of listeners) listener();
};

const subscribeClock = (listener: () => void) => {
  listeners.add(listener);
  if (clockStore.timer === undefined) clockStore.timer = setInterval(emit, 1000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && clockStore.timer !== undefined) {
      clearInterval(clockStore.timer);
      clockStore.timer = undefined;
    }
  };
};

const getClock = () => clockStore.current;
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
            <a key={label} href={href} className={styles.navLink} data-active={active === true ? 'true' : undefined}>
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
