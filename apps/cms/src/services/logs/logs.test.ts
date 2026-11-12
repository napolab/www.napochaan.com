import { describe, expect, it } from 'vitest';

import { createFakeRunner } from '../payload-runner/fake';

import { createLogsService } from './index';

const doc = { id: 2, title: 'サイト公開', date: '2026-06-01T00:00:00.000Z', meta: 'milestone', url: null };

describe('createLogsService', () => {
  it('list() queries published logs by -date, unlimited', async () => {
    const { run, find } = createFakeRunner({ docs: [doc] });

    const items = await createLogsService(run).list();

    expect(find).toHaveBeenCalledWith({ collection: 'logs', where: { _status: { equals: 'published' } }, sort: '-date', limit: 0 });
    expect(items).toEqual([{ id: '2', title: 'サイト公開', date: '2026-06-01', meta: 'milestone' }]);
  });

  it('draftList() reads every latest draft without the published filter', async () => {
    const { run, find } = createFakeRunner({ docs: [doc] });

    await createLogsService(run).draftList();

    expect(find).toHaveBeenCalledWith({ collection: 'logs', draft: true, overrideAccess: true, sort: '-date', limit: 0 });
  });
});
