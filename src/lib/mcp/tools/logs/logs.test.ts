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

describe('createLog', () => {
  it('draft として作成する', async () => {
    const { payload, deps } = createDeps();
    payload.create.mockResolvedValue({ id: 9, title: 'Booth2Booth vol.04', date: '2026-11-01T00:00:00.000Z', meta: 'DJ/VJ', url: null, _status: 'draft' });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.createLog({ title: 'Booth2Booth vol.04', date: '2026-11-01', meta: 'DJ/VJ' });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'logs',
        draft: true,
        overrideAccess: false,
        user,
        data: expect.objectContaining({ title: 'Booth2Booth vol.04', date: '2026-11-01', meta: 'DJ/VJ', _status: 'draft' }),
      }),
    );
  });

  it('date の形式が違えば回復ヒント付きで reject し、create しない', async () => {
    const { payload, deps } = createDeps();

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.createLog({ title: 'x', date: '2026/11/01', meta: 'DJ' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text ?? '').toContain('YYYY-MM-DD');
    expect(result.content[0]?.text ?? '').toContain('2026/11/01');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('存在しない日付は reject する', async () => {
    const { payload, deps } = createDeps();

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.createLog({ title: 'x', date: '2026-02-30', meta: 'DJ' });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe('updateLog', () => {
  it('指定したフィールドだけを渡す', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 9, title: '旧', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: null, _status: 'draft' });
    payload.update.mockResolvedValue({ id: 9, title: '新', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: null, _status: 'draft' });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.updateLog({ id: 9, title: '新' });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'logs', id: 9, data: { title: '新' } }));
  });

  it('存在しない id は回復ヒント付きで reject し、update しない', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.updateLog({ id: 999, title: '新' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text ?? '').toContain('list_logs');
    expect(payload.update).not.toHaveBeenCalled();
  });
});
