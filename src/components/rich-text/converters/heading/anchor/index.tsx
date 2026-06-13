'use client';

import { useCallback, useRef } from 'react';

import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';

import { CopyHashButton } from '../copy-hash-button';
import * as styles from './styles.css';

type Props = {
  slug: string;
};

// Heading gutter wrapper around CopyHashButton. It positions the `#` in the left
// gutter (styles) and injects the heading-specific press behavior: smooth-scroll the
// heading into view (reduced-motion aware) and reflect `#slug` in the address bar via
// history.replaceState (replaceState preserves the smooth scroll — location.hash
// would jump). The scroll target is the button's own heading, reached via the ref's
// `closest(...)`. The copy itself lives in CopyHashButton and runs first.
export const HeadingAnchor = ({ slug }: Props) => {
  const ref = useRef<HTMLButtonElement>(null);
  const reduced = usePrefersReducedMotion();

  const handlePress = useCallback(() => {
    ref.current?.closest('h1, h2, h3, h4, h5, h6')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', new URL(`#${slug}`, window.location.href).href);
  }, [slug, reduced]);

  return <CopyHashButton ref={ref} slug={slug} label="この見出しへのリンクをコピー" onPress={handlePress} className={styles.root} />;
};
