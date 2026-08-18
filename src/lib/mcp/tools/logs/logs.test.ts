import { describe, expect, it, vi } from 'vitest';

import { createLogToolHandlers } from '.';

import type { LogToolDeps } from '.';
import type { User } from '@payload-types';

const user = { id: 1, email: 'dev@napochaan.com' } as User;

const createDeps = () => {
  const payload = {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const deps = { payload, user } as unknown as LogToolDeps;

  return { payload, deps };
};

describe('listLogs', () => {
  it('published だけを引く where を組む', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.listLogs({ status: 'published' });

    expect(result.isError).toBeUndefined();
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'logs',
        draft: true,
        where: { _status: { equals: 'published' } },
        sort: '-date',
        overrideAccess: false,
        user,
      }),
    );
  });

  it('status 未指定なら all 扱いで where を付けない', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });

    const handlers = createLogToolHandlers(deps);
    await handlers.listLogs({});

    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
  });

  it('date を JST 暦日の YYYY-MM-DD に正規化して返す', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({
      docs: [{ id: 7, title: 'TBA at Real に VJ 出演', date: '2026-10-24T00:00:00.000Z', meta: 'VJ', url: null, _status: 'published' }],
    });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.listLogs({});

    expect(JSON.parse(result.content[0]?.text ?? '')).toEqual([{ id: 7, title: 'TBA at Real に VJ 出演', date: '2026-10-24', meta: 'VJ', url: null, status: 'published' }]);
  });
});
