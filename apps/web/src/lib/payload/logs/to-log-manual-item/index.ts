import { dayjs } from '@utils/dayjs';

import type { LogManualItem } from '../../../../app/(site)/log/_lib/log-manual-item';
import type { Log } from '@payload-types';

// Maps a Payload `logs` document to a LogManualItem. NULL url coerced at this
// boundary. Pure.
export const toLogManualItem = (doc: Log): LogManualItem => ({
  id: `${doc.id}`,
  title: doc.title,
  date: dayjs(doc.date).tz('Asia/Tokyo').format('YYYY-MM-DD'),
  meta: doc.meta,
  url: doc.url ?? undefined,
});
