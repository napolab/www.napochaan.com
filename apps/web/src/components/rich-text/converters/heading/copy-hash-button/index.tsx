'use client';

import { useCallback, useRef } from 'react';
import { Button } from 'react-aria-components';

import { useAutoResetState } from '@hooks/use-auto-reset-state';
import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';
import { clsx } from '@utils/clsx';

import { jumpToHeading } from '../jump-to-heading';
import * as styles from './styles.css';

type Props = {
  slug: string;
  label?: string;
  onPress?: () => void;
  className?: string;
  // Island use inside a server-rendered heading (components/rich-text/rich-text.astro):
  // no parent can pass `onPress` across the island boundary, so the button jumps to
  // its own enclosing heading (what AnchoredHeading's onPress does).
  anchored?: boolean;
};

// Generic affordance: shows a `#` glyph and copies this page's `#slug` deep link to
// the clipboard, briefly flipping `data-copied` on success (the stylesheet renders
// that as an accent flash; auto-resets fast). Anything beyond the copy — scrolling,
// updating the address bar — is the caller's concern, passed via `onPress` and run
// after the copy (or `anchored` for the enclosing heading). The glyph is CSS content; consumers position it via `className`.
export const CopyHashButton = ({ slug, label = 'リンクをコピー', onPress, className, anchored = false }: Props) => {
  const [copied, setCopied] = useAutoResetState(false, 800);
  const ref = useRef<HTMLButtonElement>(null);
  const reduced = usePrefersReducedMotion();

  const handlePress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(new URL(`#${slug}`, window.location.href).href);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
    if (anchored) jumpToHeading(ref.current?.closest('h1, h2, h3, h4, h5, h6'), slug, reduced);
    onPress?.();
  }, [slug, onPress, setCopied, anchored, reduced]);

  return <Button ref={ref} type="button" aria-label={label} onPress={handlePress} data-copied={copied || undefined} className={clsx(styles.root, className)} />;
};
