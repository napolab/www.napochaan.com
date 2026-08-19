import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { LOG_META_OPTIONS } from '../../../../collections/fields/log-meta';

import { createLogToolHandlers, registerLogTools } from '.';

import type { LogToolDeps } from '.';
import type { McpServer } from '@modelcontextprotocol/server';
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

  it('url: null を渡すとリンクをクリアする', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 9, title: '旧', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: 'https://example.com', _status: 'draft' });
    payload.update.mockResolvedValue({ id: 9, title: '旧', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: null, _status: 'draft' });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.updateLog({ id: 9, url: null });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'logs', id: 9, data: { url: null } }));
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

  // toSummary はバージョンの _status をそのまま返すため、公開済みの log を更新した直後
  // でも 'draft' に見えてしまう(実際の /log にはまだ古い published 内容が出ている)。
  // blog の updatePost と同じ形で status を説明的な文言に上書きする(Fix 2)。
  it('公開済み log を更新しても status は draft と断定せず説明的な文言を返す', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 9, title: '旧', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: null, _status: 'published' });
    payload.update.mockResolvedValue({ id: 9, title: '新', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: null, _status: 'draft' });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.updateLog({ id: 9, title: '新' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '');
    expect(parsed.status).toBe('draft version saved');
    expect(parsed.note).not.toContain('未公開');
    expect(parsed.note).not.toContain('年表への反映は');
  });
});

describe('registerLogTools - meta スキーマ', () => {
  // meta の不正値の弾き込みは今は MCP SDK の JSON Schema バリデータが enum を
  // 列挙していることに依存している。ハンドラ内の `meta: Log['meta']` は
  // コンパイル時の型に過ぎず、もし誰かが inputSchema を z.string() に緩めても
  // 気づけない(mcp-write-strict.md が言う「Payload に到達する前に弾く」対象)。
  // registerTool に渡された実際の zod スキーマを捕まえて直接検証する。
  it('create_log の meta スキーマは LOG_META_OPTIONS の 8 値のみ受理する', () => {
    const { deps } = createDeps();
    const captured: { inputSchema?: Record<string, z.ZodTypeAny> } = {};
    const server = {
      registerTool: (name: string, config: { inputSchema?: Record<string, z.ZodTypeAny> }) => {
        if (name === 'create_log') {
          captured.inputSchema = config.inputSchema;
        }
      },
    } as unknown as McpServer;

    registerLogTools(server, deps);

    const metaSchema = captured.inputSchema?.meta;
    if (metaSchema === undefined) throw new Error('create_log の inputSchema.meta が捕まえられなかった');

    for (const value of LOG_META_OPTIONS) {
      expect(metaSchema.safeParse(value).success).toBe(true);
    }
    expect(metaSchema.safeParse('存在しないラベル').success).toBe(false);
  });
});

describe('publishLog', () => {
  // draft-promotion: versions.drafts が有効なため update_log の変更は versions テーブルに
  // 積まれる。bare `_status` だけを update すると published 済みの main テーブル行の上に
  // 浅くマージされ、未公開の draft 編集が黙って失われる(blog の publishPost と同じ罠)。
  it('最新 draft の全フィールドを published で再送する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 9, title: '最新draft', date: '2026-11-01T00:00:00.000Z', meta: 'DJ/VJ', url: 'https://example.com', _status: 'draft' });
    payload.update.mockResolvedValue({ id: 9, title: '最新draft', date: '2026-11-01T00:00:00.000Z', meta: 'DJ/VJ', url: 'https://example.com', _status: 'published' });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.publishLog({ id: 9 });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'logs',
        id: 9,
        data: { title: '最新draft', date: '2026-11-01T00:00:00.000Z', meta: 'DJ/VJ', url: 'https://example.com', _status: 'published' },
      }),
    );
  });

  it('存在しない id は reject し、update しない', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.publishLog({ id: 999 });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text ?? '').toContain('list_logs');
    expect(payload.update).not.toHaveBeenCalled();
  });
});

describe('deleteLog', () => {
  it('存在する id を削除する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 9, title: '消す対象', date: '2026-11-01T00:00:00.000Z', meta: 'DJ', url: null, _status: 'draft' });
    payload.delete.mockResolvedValue({ id: 9 });

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.deleteLog({ id: 9 });

    expect(result.isError).toBeUndefined();
    expect(payload.delete).toHaveBeenCalledWith(expect.objectContaining({ collection: 'logs', id: 9, overrideAccess: false, user }));
    expect(JSON.parse(result.content[0]?.text ?? '')).toEqual(expect.objectContaining({ id: 9, title: '消す対象' }));
  });

  it('存在しない id は回復ヒント付きで reject し、delete しない', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createLogToolHandlers(deps);
    const result = await handlers.deleteLog({ id: 999 });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text ?? '').toContain('list_logs');
    expect(payload.delete).not.toHaveBeenCalled();
  });
});
