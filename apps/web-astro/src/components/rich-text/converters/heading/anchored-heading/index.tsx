'use client';

import { useCallback, useRef } from 'react';

import { Heading } from '@components/heading';
import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';

import { CopyHashButton } from '../copy-hash-button';
import * as headingStyles from '../styles.css';
import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  level: Level;
  slug: string;
  children: ReactNode;
};

// A richtext body heading that owns its own DOM node, so the in-page copy-anchor acts
// on it through dependency injection rather than reaching for foreign DOM. The heading
// holds its ref; the press handler — smooth-scroll the heading into view (reduced-
// motion aware) and reflect `#slug` in the address bar via history.replaceState
// (replaceState preserves the smooth scroll) — closes over that ref and is passed to
// CopyHashButton as `onPress`. CopyHashButton stays unaware of the DOM: it only copies
// the link and calls the injected handler. The heading converter (a Server Component)
// streams the heading text in as `children`, so only this wrapper hydrates.
export const AnchoredHeading = ({ level, slug, children }: Props) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = usePrefersReducedMotion();

  const handlePress = useCallback(() => {
    ref.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', new URL(`#${slug}`, window.location.href).href);
  }, [slug, reduced]);

  return (
    <Heading ref={ref} level={level} id={slug !== '' ? slug : undefined} className={headingStyles.heading}>
      {slug !== '' && <CopyHashButton slug={slug} label="この見出しへのリンクをコピー" onPress={handlePress} className={styles.root} />}
      {children}
    </Heading>
  );
};
