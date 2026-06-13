'use client';

import { useCallback } from 'react';

import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';

import { CopyHashButton } from '../copy-hash-button';
import * as styles from './styles.css';

type Props = {
  slug: string;
};

// Heading gutter wrapper around CopyHashButton: positions the `#` in the left gutter
// (styles) and injects the heading press behavior — smooth-scroll the heading into
// view (reduced-motion aware) and reflect `#slug` in the address bar via
// history.replaceState (replaceState preserves the smooth scroll — location.hash
// would jump). The copy itself lives in CopyHashButton and runs first.
//
// The scroll target is resolved with getElementById: ideally a component would not
// reach for DOM it doesn't own, but the converter that owns the heading is a Server
// Component, so it can't share the heading ref or DI a scroll handler down. Interim
// trade-off until that boundary can.
export const HeadingAnchor = ({ slug }: Props) => {
  const reduced = usePrefersReducedMotion();

  const handlePress = useCallback(() => {
    document.getElementById(slug)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', new URL(`#${slug}`, window.location.href).href);
  }, [slug, reduced]);

  return <CopyHashButton slug={slug} label="この見出しへのリンクをコピー" onPress={handlePress} className={styles.root} />;
};
