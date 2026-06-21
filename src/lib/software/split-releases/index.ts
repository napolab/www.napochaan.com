import { dayjs } from '@utils/dayjs';

import type { SoftwareRelease } from '@lib/payload/software';

// Newest release (by releasedAt) is the primary download; the remainder is history,
// newest-first. Returns undefined when there are no releases (block renders nothing).
export const splitReleases = (releases: readonly SoftwareRelease[]): { latest: SoftwareRelease; history: readonly SoftwareRelease[] } | undefined => {
  const sorted = [...releases].sort((a, b) => dayjs(b.releasedAt).tz('Asia/Tokyo').valueOf() - dayjs(a.releasedAt).tz('Asia/Tokyo').valueOf());
  const [latest, ...history] = sorted;
  if (latest === undefined) return undefined;
  return { latest, history };
};
