'use client';

import { useCallback } from 'react';
import { Button } from 'react-aria-components';

import { useAutoResetState } from '@hooks/use-auto-reset-state';

import * as styles from './styles.css';

type Props = {
  slug: string;
};

// Hover-revealed gutter affordance for a richtext body heading. Copies the
// heading's deep-link URL (current page + #slug) to the clipboard and flips a
// transient `data-copied` flag (auto-resets via useAutoResetState, same idiom as
// ShareBar). The `#` / `✓` glyph lives in CSS, and reveal is driven by the parent
// heading's inheriting `--anchor-opacity`, so this island owns no hover state.
export const HeadingAnchor = ({ slug }: Props) => {
  const [copied, setCopied] = useAutoResetState(false);

  const handleCopy = useCallback(async () => {
    const href = new URL(`#${slug}`, window.location.href).href;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
  }, [slug, setCopied]);

  return <Button type="button" aria-label="この見出しへのリンクをコピー" onPress={handleCopy} data-copied={copied || undefined} className={styles.root} />;
};
