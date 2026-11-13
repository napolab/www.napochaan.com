import { Button } from '@components/button';

import { reloadPage } from './reload';

type Props = {
  // Injectable for tests (a function cannot cross the island props boundary anyway).
  reload?: () => void;
};

// The 500 screen's retry. Next's `reset()` re-rendered the failed segment from the
// `'use client'` error.tsx; a server-rendered Astro page has no client segment to
// reset, so retry reloads the document. The only client leaf of the error screen.
export const RetryButton = ({ reload = reloadPage }: Props) => (
  <Button variant="danger" onPress={reload}>
    retry
  </Button>
);
