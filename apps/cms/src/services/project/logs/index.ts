import { dayjs } from '@utils/dayjs';

import type { LogManualItemDTO } from '@napochaan/cms-api/services';
import type { Log } from '@payload-types';

// Maps a Payload `logs` document to `LogManualItemDTO`. A NULL url is left out of
// the object. Pure.
export const projectLogManualItem = (doc: Log): LogManualItemDTO => {
  const url = doc.url ?? undefined;

  return {
    id: `${doc.id}`,
    title: doc.title,
    date: dayjs(doc.date).tz('Asia/Tokyo').format('YYYY-MM-DD'),
    meta: doc.meta,
    ...(url !== undefined && { url }),
  };
};
