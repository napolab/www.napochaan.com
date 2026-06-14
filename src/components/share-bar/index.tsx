'use client';

import { useMemo } from 'react';

import { Button } from '@components/button';
import { useShare } from '@hooks/use-share';

import { buildTweetUrl } from '@utils/tweet-intent';
import { ShareIcon } from './icons';
import * as styles from './styles.css';

type Props = {
  url: string;
  title: string;
};

// Public detail-page share bar. X (Twitter) is a stateless web-intent link; Share
// hands the canonical URL to the OS share sheet (Web Share API) and falls back to a
// clipboard copy — flipping its label to a transient confirmation — when the API is
// unavailable. Instagram is intentionally omitted — it has no URL share intent.
export const ShareBar = ({ url, title }: Props) => {
  const shareData = useMemo(() => ({ title, url }) satisfies ShareData, [title, url]);
  const { copied, share } = useShare(shareData, url);

  return (
    <div className={styles.root} role="group" aria-label="この記事を共有">
      <span className={styles.label} aria-hidden="true">
        share
      </span>
      <div className={styles.actions}>
        <Button type="link" variant="outline" href={buildTweetUrl(title, url)} target="_blank" rel="noopener noreferrer">
          Twitter(X) ↗
        </Button>
        <Button variant="outline" onPress={share}>
          <ShareIcon width={16} height={16} />
          {copied ? 'copied ✓' : 'share'}
        </Button>
      </div>
    </div>
  );
};
