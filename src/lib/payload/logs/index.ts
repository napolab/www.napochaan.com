import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { toLogManualItem } from './to-log-manual-item';

import type { LogManualItem } from '../../../app/(site)/log/_lib/log-manual-item';

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

const publishedWhere = { _status: { equals: 'published' } } as const;

const fetchLogList = unstable_cache(
  async (): Promise<readonly LogManualItem[]> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'logs',
      where: publishedWhere,
      sort: '-date',
      limit: 0,
    });

    return result.docs.map(toLogManualItem);
  },
  ['logs-list'],
  { tags: [CACHE_TAGS.logs] },
);

export const findLogList = async (): Promise<readonly LogManualItem[]> => {
  if (isBuildPhase()) return [];

  return fetchLogList();
};

// The draft path is intentionally uncached (never wrapped in `unstable_cache`)
// and drops the published filter via `draft: true`, so each entry resolves to
// its latest draft regardless of `_status`. Only reachable from the secret-gated
// preview route (`/log/preview`), so it never leaks drafts to the public site.
export const findLogDraftList = async (): Promise<readonly LogManualItem[]> => {
  if (isBuildPhase()) return [];

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'logs',
    draft: true,
    overrideAccess: true,
    sort: '-date',
    limit: 0,
  });

  return result.docs.map(toLogManualItem);
};
