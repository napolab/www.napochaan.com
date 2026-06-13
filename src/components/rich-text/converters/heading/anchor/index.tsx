'use client';

import { useCallback } from 'react';
import { Button } from 'react-aria-components';

import { useAutoResetState } from '@hooks/use-auto-reset-state';

import * as styles from './styles.css';

type Props = {
  slug: string;
};

// Hover-revealed gutter affordance for a richtext body heading. On press it copies
// the heading's deep-link URL, smooth-scrolls the heading into view, and reflects
// `#slug` in the address bar via history.replaceState (replaceState keeps the
// smooth scroll — location.hash would jump). A successful copy briefly flips
// `data-copied`, which the stylesheet renders as an accent flash on the `#` glyph
// (auto-resets fast via useAutoResetState). The `#` glyph lives in CSS, and the
// reveal is driven by the parent heading's inheriting `--anchor-opacity`.
export const HeadingAnchor = ({ slug }: Props) => {
  const [copied, setCopied] = useAutoResetState(false, 800);

  const handlePress = useCallback(async () => {
    const url = new URL(`#${slug}`, window.location.href);
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
    document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', url.href);
  }, [slug, setCopied]);

  return <Button type="button" aria-label="この見出しへのリンクをコピー" onPress={handlePress} data-copied={copied || undefined} className={styles.root} />;
};
