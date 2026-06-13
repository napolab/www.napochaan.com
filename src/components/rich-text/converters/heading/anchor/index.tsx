'use client';

import { useCallback, useRef } from 'react';
import { Button } from 'react-aria-components';

import { useAutoResetState } from '@hooks/use-auto-reset-state';
import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';

import * as styles from './styles.css';

type Props = {
  slug: string;
};

// Hover-revealed gutter affordance for a richtext body heading. On press it copies
// the heading's deep-link URL, scrolls the heading into view, and reflects `#slug`
// in the address bar via history.replaceState (replaceState keeps the smooth scroll
// — location.hash would jump). The scroll target is the anchor's own heading,
// reached through the button ref's `closest(...)` rather than a global id lookup.
// Scroll honors reduced-motion (matches the site's global scroll-behavior gate). A
// successful copy briefly flips `data-copied`, which the stylesheet renders as an
// accent flash on the `#` glyph (auto-resets fast). The `#` glyph lives in CSS; the
// reveal is driven by the parent heading's inheriting `--anchor-opacity`.
export const HeadingAnchor = ({ slug }: Props) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useAutoResetState(false, 800);
  const reduced = usePrefersReducedMotion();

  const handlePress = useCallback(async () => {
    const url = new URL(`#${slug}`, window.location.href);
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
    ref.current?.closest('h1, h2, h3, h4, h5, h6')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', url.href);
  }, [slug, reduced, setCopied]);

  return <Button ref={ref} type="button" aria-label="この見出しへのリンクをコピー" onPress={handlePress} data-copied={copied || undefined} className={styles.root} />;
};
