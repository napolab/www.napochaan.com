'use client';

import { useCallback } from 'react';

import { Button } from '@components/button';
import { useAutoResetFlag } from '@hooks/use-auto-reset-flag';

import { buildTweetUrl } from './build-tweet-url';
import * as styles from './styles.css';

type Props = {
  url: string;
  title: string;
};

// Public detail-page share bar. X (Twitter) is a stateless web-intent link; Copy
// writes the canonical URL to the clipboard and flips its label to a transient
// confirmation (the auto-reset flag). Instagram is intentionally omitted — it has
// no URL share intent.
export const ShareBar = ({ url, title }: Props) => {
  const { active: copied, trigger: markCopied } = useAutoResetFlag();

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(url);
    markCopied();
  }, [url, markCopied]);

  return (
    <div className={styles.root} role="group" aria-label="この記事を共有">
      <span className={styles.label} aria-hidden="true">
        share
      </span>
      <div className={styles.actions}>
        <Button variant="outline" href={buildTweetUrl(title, url)} target="_blank" rel="noopener noreferrer">
          Twitter(X) ↗
        </Button>
        <Button variant="outline" onPress={handleCopy}>
          {copied ? 'COPIED ✓' : 'COPY'}
        </Button>
      </div>
    </div>
  );
};
