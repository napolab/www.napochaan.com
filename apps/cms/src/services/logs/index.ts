import { projectLogManualItem } from '../project/logs';

import type { PayloadRunner } from '../payload-runner';
import type { CMSServices, LogManualItemDTO } from '@napochaan/cms-api/services';

const publishedWhere = { _status: { equals: 'published' } } as const;

// Manual log reads, newest first. The draft list resolves each entry to its latest
// draft and is only reachable through the secret-gated preview route.
export const createLogsService = (run: PayloadRunner): CMSServices['logs'] => ({
  async list(): Promise<LogManualItemDTO[]> {
    const result = await run((payload) => payload.find({ collection: 'logs', where: publishedWhere, sort: '-date', limit: 0 }));

    return result.docs.map(projectLogManualItem);
  },
  async draftList(): Promise<LogManualItemDTO[]> {
    const result = await run((payload) => payload.find({ collection: 'logs', draft: true, overrideAccess: true, sort: '-date', limit: 0 }));

    return result.docs.map(projectLogManualItem);
  },
});
