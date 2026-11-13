'use client';

import { useState } from 'react';
import { usePathname } from '@lib/navigation';

import { usePresence } from '@components/cursor-presence/presence-store';
import { useLifeState } from '@components/game-of-life/provider';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { useMotion } from '@hooks/use-prefers-reduced-motion';
import { siteNavItems } from '@utils/nav-items';

import { isNavActive } from '@utils/is-nav-active';
import { NavMenu } from './nav-menu';
import { aliveText, cursorsText, genText, motionText, watchingText } from './status-text';
import * as styles from './styles.css';
import { useClock } from './use-clock';

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

// The React SysBar: the reference markup for sys-bar.astro (the site runs the
// <sys-bar> element, ./element.ts — no React until the mobile menu is first used).
export const SysBar = ({ initialTime }: { initialTime: string }) => {
  const clock = useClock(initialTime);
  const state = useLifeState();
  const pathname = usePathname();
  const presence = usePresence();
  const motion = useMotion();

  return (
    <>
      <header className={styles.root}>
        <div className={styles.navRow}>
          {/* Inline slots. Each one collapses out of the row at its own width
              (right-to-left, blog → index); whatever is hidden is reached through
              the menu, which holds the full set at every width. */}
          <nav className={styles.nav} aria-label="グローバルナビゲーション">
            {siteNavItems.map(({ label, href }, order) => (
              <NavLink key={label} label={label} href={href} active={isNavActive(pathname, href)} order={order} />
            ))}
          </nav>
          {/* Below 768px (i.e. once any slot has collapsed): a single trigger
              that opens the full set of targets in a react-aria Menu popover, so
              the bar never wraps to a second row. The menu code itself is a lazy
              chunk, fetched on the first hover / focus / press of the trigger. */}
          <div className={styles.menuRoot} data-nav-menu="">
            <NavMenu pathname={pathname} />
          </div>
        </div>
        <div className={styles.status}>
          {/* data-status / data-toggle: the hooks the <sys-bar> element writes the
              live values through (sys-bar.astro renders this same markup). */}
          <span className={styles.clock} data-status="clock">
            {clock}
          </span>
          <span className={styles.gen} data-status="gen">
            {genText(state.generation)}
          </span>
          <span className={styles.alive} data-status="alive">
            {aliveText(state.alive)}
          </span>
          <span className={styles.rec}>● rec</span>
          <span className={styles.watching} data-status="watching">
            {watchingText(presence.count)}
          </span>
          <button type="button" className={styles.toggle} data-toggle="cursors" onClick={presence.toggle}>
            {cursorsText(presence.enabled)}
          </button>
          <button type="button" className={styles.toggle} data-toggle="motion" onClick={motion.toggle}>
            {motionText(motion.reduced)}
          </button>
        </div>
      </header>
      <div className={styles.checker} aria-hidden />
    </>
  );
};
