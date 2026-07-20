import { describe, expect, it, vi } from 'vitest';

import { createLegalToolHandlers } from '.';

import type { LegalToolDeps } from '.';
import type { User } from '@payload-types';

const user = { id: 1, email: 'dev@napochaan.com' } as User;

const paragraphBody = () => ({ root: { type: 'root', children: [{ type: 'paragraph', version: 1 }], direction: null, format: '', indent: 0, version: 1 } });

const createDeps = () => {
  const payload = {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const codec = {
    toLexical: vi.fn((_markdown: string) => paragraphBody()),
    toMarkdown: vi.fn(() => '# 第1条'),
  };
  const deps = { payload, user, codec } as unknown as LegalToolDeps;

  return { payload, codec, deps };
};

describe('createLegalDocument', () => {
  it('draft として作成する', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] }); // slug 未使用
    payload.create.mockResolvedValue({ id: 3, slug: 'terms' });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.createLegalDocument({ title: '利用規約', slug: 'terms', effectiveAt: '2026-08-01', bodyMarkdown: '# 第1条' });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'legal-documents',
        draft: true,
        overrideAccess: false,
        user,
        data: expect.objectContaining({ _status: 'draft', slug: 'terms', effectiveAt: '2026-08-01' }),
      }),
    );
  });

  it('slug が既に使われていたら回復ヒント付きで reject し、create しない', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 1 }] }); // slug 使用済み

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.createLegalDocument({ title: '利用規約', slug: 'terms', effectiveAt: '2026-08-01', bodyMarkdown: '# 第1条' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('terms');
    expect(result.content[0]?.text).toContain('update_legal_document');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('effectiveAt が YYYY-MM-DD でなければ回復ヒント付きで reject する', async () => {
    const { payload, deps } = createDeps();

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.createLegalDocument({ title: '利用規約', slug: 'terms', effectiveAt: '来月1日', bodyMarkdown: '# 第1条' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('YYYY-MM-DD');
    expect(result.content[0]?.text).toContain('来月1日');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('存在しない日付を reject する', async () => {
    const { payload, deps } = createDeps();

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.createLegalDocument({ title: '利用規約', slug: 'terms', effectiveAt: '2026-02-30', bodyMarkdown: '# 第1条' });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe('getLegalDocument', () => {
  it('本文を Markdown で返し、effectiveAt は独立フィールドで返す', async () => {
    const { payload, deps } = createDeps();
    // Payload は date フィールドを ISO タイムスタンプで返す。read は YYYY-MM-DD に正規化する。
    payload.find.mockResolvedValue({ docs: [{ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01T00:00:00.000Z', _status: 'published', body: paragraphBody() }] });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.getLegalDocument({ slug: 'terms' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyMarkdown: string; effectiveAt: string };
    expect(parsed.bodyMarkdown).toBe('# 第1条');
    expect(parsed.effectiveAt).toBe('2026-08-01');
    // 施行日を本文に混ぜない(read → write の往復で本文に焼き付くのを防ぐ)
    expect(parsed.bodyMarkdown).not.toContain('2026-08-01');
  });

  it('effectiveAt を UTC ではなく JST の暦日に正規化する', async () => {
    const { payload, deps } = createDeps();
    // UTC 2026-07-31T15:00:00Z = JST 2026-08-01。UTC 切りだと 07-31 になり write で弾かれる。
    payload.find.mockResolvedValue({ docs: [{ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-07-31T15:00:00.000Z', _status: 'published', body: paragraphBody() }] });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.getLegalDocument({ slug: 'terms' });

    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { effectiveAt: string };
    expect(parsed.effectiveAt).toBe('2026-08-01');
  });

  it('id も slug も無ければ回復ヒントを返す', async () => {
    const { deps } = createDeps();

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.getLegalDocument({});

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('slug');
  });

  it('見つからなければ回復ヒントを返す', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.getLegalDocument({ slug: 'missing' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('list_legal_documents');
  });

  it('結合セル table を含む本文は bodyEditable: false と警告を返し、bodyMarkdown は含めない', async () => {
    const { payload, codec, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01T00:00:00.000Z', _status: 'published', body: mergedCellTableBody() }] });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.getLegalDocument({ slug: 'terms' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyEditable: boolean; warning: string; bodyMarkdown: string | undefined };
    expect(parsed.bodyEditable).toBe(false);
    expect(parsed.warning).toContain('table');
    expect(parsed.bodyMarkdown).toBeUndefined();
    expect(codec.toMarkdown).not.toHaveBeenCalled();
  });

  it('通常の本文は bodyEditable: true と bodyMarkdown を返す', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01T00:00:00.000Z', _status: 'published', body: paragraphBody() }] });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.getLegalDocument({ slug: 'terms' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyEditable: boolean; bodyMarkdown: string };
    expect(parsed.bodyEditable).toBe(true);
    expect(typeof parsed.bodyMarkdown).toBe('string');
  });
});

describe('updateLegalDocument', () => {
  it('本文だけの部分更新ができる', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01', body: paragraphBody() });
    payload.update.mockResolvedValue({ id: 3, slug: 'terms' });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.updateLegalDocument({ id: 3, bodyMarkdown: '# 改訂' });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'legal-documents',
        id: 3,
        draft: true,
        overrideAccess: false,
      }),
    );
  });

  it('更新対象が無ければ reject する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.updateLegalDocument({ id: 999, bodyMarkdown: '# 改訂' });

    expect(result.isError).toBe(true);
    expect(payload.update).not.toHaveBeenCalled();
  });
});

const mergedCellTableBody = () => ({
  root: {
    type: 'root',
    children: [{ type: 'table', children: [{ type: 'tablerow', children: [{ type: 'tablecell', headerState: 0, colSpan: 2, children: [] }] }] }],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
});

describe('legal documents with tables', () => {
  it('createLegalDocument はセル内 \\| を回復ヒント付きで reject する', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] }); // slug 未使用

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.createLegalDocument({ title: '利用規約', slug: 'terms', effectiveAt: '2026-08-01', bodyMarkdown: '| a \\| b | c |' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('該当行: | a \\| b | c |');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('updateLegalDocument は bodyMarkdown の table 構文違反を reject する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 1, slug: 'terms', body: paragraphBody() });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.updateLegalDocument({ id: 1, bodyMarkdown: ['| A |', '| :--- |'].join('\n') });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('配置指定');
    expect(payload.update).not.toHaveBeenCalled();
  });

  it('updateLegalDocument は結合セル table を含む既存本文への bodyMarkdown 上書きを reject する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 1, slug: 'terms', body: mergedCellTableBody() });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.updateLegalDocument({ id: 1, bodyMarkdown: '# 全面改稿' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('table');
    expect(payload.update).not.toHaveBeenCalled();
  });
});

describe('listLegalDocuments', () => {
  it('slug / title / effectiveAt / status を返す', async () => {
    const { payload, deps } = createDeps();
    // Payload の ISO タイムスタンプが YYYY-MM-DD に正規化されて返ることを確認する。
    payload.find.mockResolvedValue({ docs: [{ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01T00:00:00.000Z', _status: 'published' }] });

    const handlers = createLegalToolHandlers(deps);
    const result = await handlers.listLegalDocuments();

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '[]') as { slug: string; effectiveAt: string; status: string }[];
    expect(parsed[0]).toEqual({ id: 3, slug: 'terms', title: '利用規約', effectiveAt: '2026-08-01', status: 'published' });
  });
});
