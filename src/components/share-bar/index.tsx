'use client';

import { useCallback } from 'react';

import { Button } from '@components/button';
import { useAutoResetState } from '@hooks/use-auto-reset-state';

import { buildTweetUrl } from '@utils/tweet-intent';
import * as styles from './styles.css';

type Props = {
  url: string;
  title: string;
};

// Public detail-page share bar. X (Twitter) is a stateless web-intent link; Copy
// writes the canonical URL to the clipboard and flips its label to a transient
// confirmation (the auto-reset state). Instagram is intentionally omitted — it
// has no URL share intent.
export const ShareBar = ({ url, title }: Props) => {
  const [copied, setCopied] = useAutoResetState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }, [url, setCopied]);

  return (
    <div className={styles.root} role="group" aria-label="この記事を共有">
      <span className={styles.label} aria-hidden="true">
        share
      </span>
      <div className={styles.actions}>
        <Button type="link" variant="outline" href={buildTweetUrl(title, url)} target="_blank" rel="noopener noreferrer">
          Twitter(X) ↗
        </Button>
        <Button variant="outline" onPress={handleCopy}>
          {copied ? 'COPIED ✓' : 'COPY'}
        </Button>
      </div>
    </div>
  );
};
