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
