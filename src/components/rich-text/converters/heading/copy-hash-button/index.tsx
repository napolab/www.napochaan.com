'use client';

import { useCallback } from 'react';
import { Button } from 'react-aria-components';

import { useAutoResetState } from '@hooks/use-auto-reset-state';
import { clsx } from '@utils/clsx';

import * as styles from './styles.css';

import type { Ref } from 'react';

type Props = {
  slug: string;
  label?: string;
  onPress?: () => void;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

// Generic affordance: shows a `#` glyph and copies this page's `#slug` deep link to
// the clipboard, briefly flipping `data-copied` on success (the stylesheet renders
// that as an accent flash; auto-resets fast). Anything beyond the copy — scrolling,
// updating the address bar — is the caller's concern, passed via `onPress` and run
// after the copy. The glyph is CSS content; consumers position it via `className`.
export const CopyHashButton = ({ slug, label = 'リンクをコピー', onPress, className, ref }: Props) => {
  const [copied, setCopied] = useAutoResetState(false, 800);

  const handlePress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(new URL(`#${slug}`, window.location.href).href);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
    onPress?.();
  }, [slug, onPress, setCopied]);

  return <Button ref={ref} type="button" aria-label={label} onPress={handlePress} data-copied={copied || undefined} className={clsx(styles.root, className)} />;
};
