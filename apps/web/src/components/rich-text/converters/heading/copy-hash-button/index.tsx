'use client';

import { useCallback, useRef } from 'react';
import { Button } from 'react-aria-components';

import { useAutoResetState } from '@hooks/use-auto-reset-state';
import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';
import { clsx } from '@utils/clsx';

import { jumpToHeading } from '../jump-to-heading';
import { COPIED_RESET_MS, copyHashLink, enclosingHeading } from './copy-hash';
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
  const [copied, setCopied] = useAutoResetState(false, COPIED_RESET_MS);
  const ref = useRef<HTMLButtonElement>(null);
  const reduced = usePrefersReducedMotion();

  const handlePress = useCallback(async () => {
    if (await copyHashLink(slug)) setCopied(true);
    if (anchored && ref.current !== null) jumpToHeading(enclosingHeading(ref.current), slug, reduced);
    onPress?.();
  }, [slug, onPress, setCopied, anchored, reduced]);

  return <Button ref={ref} type="button" aria-label={label} onPress={handlePress} data-copied={copied || undefined} className={clsx(styles.root, className)} />;
};
