'use client';

import { useEffect, useRef } from 'react';

import { useBootReady } from '@components/boot-status';
import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';
import { prefersReducedMotion } from '@utils/prefers-reduced-motion';

import { clsx } from '@utils/clsx';

import { bindScramble } from './bind-scramble';
import * as styles from './styles.css';

import type { ReactNode } from 'react';

type BaseProps = {
  children: string;
  className?: string;
  // When set, the text clamps to 2 lines on mobile/tablet. The (hidden, in-flow)
  // ghost reserves that clamped height while the absolute fill decodes, so the
  // in-view scramble can never grow/shrink the box (no layout shift). Desktop is
  // unclamped — the ghost reserves the full title height there.
  clamp?: boolean;
  // When set, the text truncates to a single ellipsised line at every breakpoint.
  // A parent's `text-overflow:ellipsis` can't reach the painted (absolute) fill, so
  // the styles cap the root width and apply the ellipsis to BOTH the in-flow ghost
  // (reserves the capped line) and the fill (paints the "…"). Used by adjacent-nav.
  truncate?: boolean;
  // Optional decoration painted right after the text (e.g. an external-link ↗). It
  // renders as an in-flow sibling of the inline ghost, so it tucks against the LAST
  // wrapped line instead of orphaning below the atomic inline-block box — a trailing
  // sibling of the whole ScrambleText would drop to its own line on wrap. It is NOT
  // scrambled (the decode only churns the fill's text). Pass an aria-hidden node:
  // the accessible name stays the text alone (carried by the clipped srOnly copy).
  trailing?: ReactNode;
};

// The hover host is always passed as a value — never resolved by walking up the
// DOM — so when a scramble misfires the trigger source is obvious:
//   'self' (default) — the text scrambles on its own hover (the text IS the link).
//   'group'          — the text scrambles when `host` is hovered (a whole-card
//                      link larger than its title). Pass the host element via a
//                      callback ref + useState so it flows as a value: when the
//                      ancestor mounts, `host` updates and the effect re-binds (a
//                      RefObject would still be null in this child's effect, since
//                      an ancestor's ref is committed after the child's effects).
// (The `.astro` twin, ./scramble-text.astro, marks the host with `data-scramble-host`
// instead — there is no value to pass across the server/client boundary.)
type Props = BaseProps & ({ trigger?: 'self' } | { trigger: 'group'; host: HTMLElement | null });

// Inline text that decodes through glitch glyphs on hover (a terminal/command-line
// reveal). Client Component — the scramble needs GSAP. The text is rendered as a
// width-reserving ghost plus an absolutely-overlaid animated copy, so the churning
// glyphs never reflow surrounding layout (see styles). A clipped srOnly copy carries
// the accessible name (both ghost and fill are aria-hidden), so an ancestor link's
// name stays stable while the glyphs churn — and the name survives even in plain
// text context, where `aria-label` on the generic root span would be prohibited.
// The decode itself lives in ./bind-scramble, shared with the `<scramble-text>`
// custom element the `.astro` twin uses. Keep the markup below in sync with
// ./scramble-text.astro (asserted by scramble-text.astro.test.ts).
export const ScrambleText = (props: Props) => {
  const { children, className, clamp, truncate, trailing } = props;
  const rootRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  // For 'self' the host is the text's own span (resolved at effect time); for
  // 'group' it is the passed element. Tracked in deps so a late-arriving host
  // re-binds the listener.
  const host = props.trigger === 'group' ? props.host : null;
  const group = props.trigger === 'group';

  const bootReady = useBootReady();
  // Effective reduced-motion (OS setting + the header motion toggle). Checked
  // BEFORE bindScramble() (whose triggers call loadGsap()) so the gsap chunk is never
  // imported at all for a reduced-motion visitor — not merely no-op'd after loading.
  // The hook alone is not enough on a hydrated island (sys-bar): the hydration commit
  // renders with the server snapshot (reduced=false) and runs this effect before the
  // re-render with the client value, so the live preference is read here too.
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative matchMedia + hover listener /
    // IntersectionObserver setup on DOM refs (hover/scroll-into-view decode); gsap
    // itself is loaded lazily (dynamic import) on the first trigger.
    if (reduced || prefersReducedMotion()) return;
    const root = rootRef.current;
    const fill = fillRef.current;
    if (root === null || fill === null) return;

    return bindScramble({ root, fill, text: children, host: group ? host : root, bootReady });
  }, [children, host, group, bootReady, reduced]);

  return (
    <span ref={rootRef} className={clsx(styles.root, className)} data-clamp={clamp || undefined} data-truncate={truncate || undefined}>
      {/* Full text stays available to SR / crawlers; the ghost and fill are visual only. */}
      <span className={styles.srOnly}>{children}</span>
      <span aria-hidden className={styles.ghost}>
        {children}
      </span>
      <span ref={fillRef} aria-hidden className={styles.fill}>
        {children}
      </span>
      {/* In-flow sibling of the inline ghost — tucks against the last wrapped line.
          srOnly and fill are out of flow (clipped / absolute), so this follows the
          ghost's last glyph directly. The caller styles + aria-hides it. */}
      {trailing}
    </span>
  );
};
