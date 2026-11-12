import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { WORK_TYPE_OPTIONS } from '../../../../collections/fields/work-type';
import { Works } from '../../../../collections/works';

import { createWorkToolHandlers, registerWorkTools } from '.';

import type { WorkBody, WorkToolDeps } from '.';
import type { McpServer } from '@modelcontextprotocol/server';
import type { User } from '@payload-types';

// Vite reserves `BASE_URL` (default '/') and injects it into `process.env` in
// the vitest node environment, which breaks `absoluteUrl`'s `new URL(path, base)`
// call. Stub a real origin for the duration of this suite (blog の tools.test.ts と同じ)。
beforeEach(() => {
  vi.stubEnv('BASE_URL', 'https://www.napochaan.com');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const user = { id: 1, email: 'dev@napochaan.com' } as User;

const paragraphBody = (): WorkBody => ({ root: { type: 'root', children: [{ type: 'paragraph', version: 1 }], direction: null, format: '', indent: 0, version: 1 } }) as WorkBody;

const blockBody = (): WorkBody => ({ root: { type: 'root', children: [{ type: 'block', version: 2 }], direction: null, format: '', indent: 0, version: 1 } }) as WorkBody;

const workDoc = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  slug: 'napochaan-v3',
  title: 'napochaan.com v3',
  type: 'production',
  date: '2026-09-01T00:00:00.000Z',
  url: null,
  description: null,
  thumbnail: null,
  body: null,
  _status: 'draft',
  ...overrides,
});

const createDeps = () => {
  const payload = {
    // 既定は slug 未使用(requireSlugAvailable の重複チェックが通る)。
    find: vi.fn().mockResolvedValue({ docs: [] }),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const codec = {
    toLexical: vi.fn((_markdown: string) => paragraphBody()),
    toMarkdown: vi.fn(() => '# md'),
  };
  const deps = { payload, user, codec, siteBaseUrl: 'https://napochaan.com' } as unknown as WorkToolDeps;

  return { payload, codec, deps };
};

const parseText = (text: string | undefined): Record<string, unknown> => JSON.parse(text ?? '{}') as Record<string, unknown>;

describe('listWorks', () => {
  it('published だけを引く where を組み、date 降順で depth 0 で読む', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.listWorks({ status: 'published' });

    expect(result.isError).toBeUndefined();
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'works',
        draft: true,
        where: { _status: { equals: 'published' } },
        sort: '-date',
        depth: 0,
        overrideAccess: false,
        user,
      }),
    );
  });

  it('status 未指定なら all 扱いで where を付けない', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });

    const handlers = createWorkToolHandlers(deps);
    await handlers.listWorks({});

    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
  });

  it('date を JST 暦日の YYYY-MM-DD に正規化し、未設定の url / description / thumbnail は null で返す', async () => {
    const { payload, deps } = createDeps();
    // UTC 15:00 は JST では翌日 00:00。JST 暦日で切らないと 1 日ズレる。
    payload.find.mockResolvedValue({ docs: [workDoc({ date: '2026-08-31T15:00:00.000Z', _status: 'published' })] });

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.listWorks({});

    expect(JSON.parse(result.content[0]?.text ?? '')).toEqual([
      { id: 5, slug: 'napochaan-v3', title: 'napochaan.com v3', type: 'production', date: '2026-09-01', url: null, description: null, thumbnailMediaID: null, status: 'published' },
    ]);
  });

  it('thumbnail が populate 済みの Media オブジェクトでも id を取り出す', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [workDoc({ thumbnail: { id: 42, alt: 'サムネ' } })] });

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.listWorks({});

    const [first] = JSON.parse(result.content[0]?.text ?? '[]') as { thumbnailMediaID: number }[];
    expect(first?.thumbnailMediaID).toBe(42);
  });
});

describe('getWork', () => {
  it('id で findByID を draft: true / depth: 0 で引き、summary + adminURL + 本文を返す', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue(workDoc({ body: paragraphBody(), thumbnail: 7 }));
    codec.toMarkdown.mockReturnValue('# 本文');

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.getWork({ id: 5 });

    expect(result.isError).toBeUndefined();
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'works', id: 5, draft: true, overrideAccess: false, user, depth: 0 }));
    expect(parseText(result.content[0]?.text)).toEqual(
      expect.objectContaining({ id: 5, slug: 'napochaan-v3', thumbnailMediaID: 7, adminURL: 'https://www.napochaan.com/admin/collections/works/5', bodyEditable: true, bodyMarkdown: '# 本文' }),
    );
  });

  it('slug で find を引く', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [workDoc()] });

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.getWork({ slug: 'napochaan-v3' });

    expect(result.isError).toBeUndefined();
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'works', draft: true, where: { slug: { equals: 'napochaan-v3' } }, limit: 1, depth: 0 }));
  });

  it('id も slug も無ければ reject する', async () => {
    const { payload, deps } = createDeps();

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.getWork({});

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('id か slug');
    expect(payload.findByID).not.toHaveBeenCalled();
    expect(payload.find).not.toHaveBeenCalled();
  });

  it('見つからなければ list_works を案内する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.getWork({ id: 999 });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('list_works');
  });

  it('body 未設定の doc は bodyEditable: true / bodyMarkdown: "" を返し codec を呼ばない', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue(workDoc({ body: null }));

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.getWork({ id: 5 });

    expect(result.isError).toBeUndefined();
    expect(parseText(result.content[0]?.text)).toEqual(expect.objectContaining({ bodyEditable: true, bodyMarkdown: '' }));
    expect(codec.toMarkdown).not.toHaveBeenCalled();
  });

  it('MCP 非対応 block を含む本文は bodyEditable: false + warning を返す', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue(workDoc({ body: blockBody() }));

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.getWork({ id: 5 });

    expect(result.content[0]?.text).toContain('"bodyEditable": false');
    expect(codec.toMarkdown).not.toHaveBeenCalled();
  });
});

describe('createWork', () => {
  const baseInput = { title: 'napochaan.com v3', slug: 'napochaan-v3', type: 'production' as const, date: '2026-09-01' };

  it('draft として作成し、id / slug / adminURL を返す', async () => {
    const { payload, codec, deps } = createDeps();
    payload.create.mockResolvedValue(workDoc());

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.createWork({ ...baseInput, url: 'https://example.com', description: '概要' });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'works',
        draft: true,
        overrideAccess: false,
        user,
        data: expect.objectContaining({ title: 'napochaan.com v3', slug: 'napochaan-v3', type: 'production', date: '2026-09-01', url: 'https://example.com', description: '概要', _status: 'draft' }),
      }),
    );
    // bodyMarkdown 省略時は本文パイプラインを通さない。
    expect(codec.toLexical).not.toHaveBeenCalled();
    expect(payload.create.mock.calls[0]?.[0].data).not.toHaveProperty('body');
    expect(parseText(result.content[0]?.text)).toEqual(expect.objectContaining({ id: 5, slug: 'napochaan-v3', status: 'draft', adminURL: 'https://www.napochaan.com/admin/collections/works/5' }));
  });

  it('bodyMarkdown があれば codec に渡して body を保存する', async () => {
    const { payload, codec, deps } = createDeps();
    payload.create.mockResolvedValue(workDoc());

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.createWork({ ...baseInput, bodyMarkdown: '# 本文' });

    expect(result.isError).toBeUndefined();
    expect(codec.toLexical).toHaveBeenCalledWith('# 本文');
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ body: paragraphBody() }) }));
  });

  it('date の形式が違えば回復ヒント付きで reject し、create しない', async () => {
    const { payload, deps } = createDeps();

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.createWork({ ...baseInput, date: '2026/09/01' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text ?? '').toContain('YYYY-MM-DD');
    expect(result.content[0]?.text ?? '').toContain('2026/09/01');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('存在しない日付は reject する', async () => {
    const { payload, deps } = createDeps();

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.createWork({ ...baseInput, date: '2026-02-30' });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('slug が既に使われていたら update_work を案内して reject し、create しない', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 1 }] });

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.createWork(baseInput);

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('napochaan-v3');
    expect(result.content[0]?.text).toContain('update_work');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('thumbnailMediaID の media が無ければ reject し、create しない', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.createWork({ ...baseInput, thumbnailMediaID: 99 });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('thumbnailMediaID=99');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('thumbnailMediaID の media があれば thumbnail として保存する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 99, alt: 'サムネ' });
    payload.create.mockResolvedValue(workDoc({ thumbnail: 99 }));

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.createWork({ ...baseInput, thumbnailMediaID: 99 });

    expect(result.isError).toBeUndefined();
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', id: 99 }));
    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ thumbnail: 99 }) }));
  });
});

describe('updateWork', () => {
  it('指定したフィールドだけを draft: true で渡し、本文は触らない', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue(workDoc({ body: paragraphBody() }));
    payload.update.mockResolvedValue(workDoc({ title: '新' }));

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.updateWork({ id: 5, title: '新' });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'works', id: 5, draft: true, data: { title: '新' }, overrideAccess: false, user }));
    expect(codec.toLexical).not.toHaveBeenCalled();
  });

  it('url / description / thumbnailMediaID に null を渡すとクリアする', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(workDoc({ url: 'https://example.com', description: '概要', thumbnail: 7 }));
    payload.update.mockResolvedValue(workDoc());

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.updateWork({ id: 5, url: null, description: null, thumbnailMediaID: null });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ data: { url: null, description: null, thumbnail: null } }));
  });

  it('bodyMarkdown があれば codec に渡して body を差し替える', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue(workDoc({ body: null }));
    payload.update.mockResolvedValue(workDoc());

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.updateWork({ id: 5, bodyMarkdown: '# 新本文' });

    expect(result.isError).toBeUndefined();
    expect(codec.toLexical).toHaveBeenCalledWith('# 新本文');
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ data: { body: paragraphBody() } }));
  });

  it('既存本文に MCP 非対応 block があれば bodyMarkdown での上書きを reject する', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(workDoc({ body: blockBody() }));

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.updateWork({ id: 5, bodyMarkdown: '# 新本文' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('この制作物');
    expect(payload.update).not.toHaveBeenCalled();
  });

  it('date の形式が違えば reject し、update しない', async () => {
    const { payload, deps } = createDeps();

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.updateWork({ id: 5, date: '来月' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text ?? '').toContain('YYYY-MM-DD');
    expect(payload.update).not.toHaveBeenCalled();
  });

  it('存在しない id は list_works を案内して reject し、update しない', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.updateWork({ id: 999, title: '新' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text ?? '').toContain('list_works');
    expect(payload.update).not.toHaveBeenCalled();
  });

  it('公開済み work を更新しても status は draft と断定せず説明的な文言を返す', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(workDoc({ _status: 'published' }));
    payload.update.mockResolvedValue(workDoc({ title: '新', _status: 'draft' }));

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.updateWork({ id: 5, title: '新' });

    const parsed = parseText(result.content[0]?.text);
    expect(parsed.status).toBe('draft version saved');
    expect(parsed.note).toContain('publish_work');
  });
});

describe('publishWork', () => {
  // draft-promotion: bare `_status` だけの update は published 行に浅くマージされ、
  // 未公開の draft 編集が黙って失われる(blog / logs と同じ罠)。
  it('最新 draft の全フィールドを published で再送し、/works/<slug> の url を返す', async () => {
    const { payload, deps } = createDeps();
    const draft = workDoc({ url: 'https://example.com', description: '概要', thumbnail: 7, body: paragraphBody() });
    payload.findByID.mockResolvedValue(draft);
    payload.update.mockResolvedValue({ ...draft, _status: 'published' });

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.publishWork({ id: 5 });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'works',
        id: 5,
        data: {
          title: 'napochaan.com v3',
          slug: 'napochaan-v3',
          type: 'production',
          date: '2026-09-01T00:00:00.000Z',
          url: 'https://example.com',
          description: '概要',
          thumbnail: 7,
          body: paragraphBody(),
          _status: 'published',
        },
        overrideAccess: false,
        user,
      }),
    );
    expect(parseText(result.content[0]?.text)).toEqual(expect.objectContaining({ id: 5, slug: 'napochaan-v3', status: 'published', url: 'https://www.napochaan.com/works/napochaan-v3' }));
  });

  it('存在しない id は reject し、update しない', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);

    const handlers = createWorkToolHandlers(deps);
    const result = await handlers.publishWork({ id: 999 });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text ?? '').toContain('list_works');
    expect(payload.update).not.toHaveBeenCalled();
  });
});

describe('registerWorkTools - type スキーマ', () => {
  // ハンドラ内の `type: Work['type']` はコンパイル時の型に過ぎず、誰かが inputSchema を
  // z.string() に緩めても気づけない(mcp-write-strict.md が言う「Payload に到達する前に弾く」対象)。
  // registerTool に渡された実際の zod スキーマを捕まえて直接検証する(logs と同じ)。
  it('create_work の type スキーマは WORK_TYPE_OPTIONS のみ受理する', () => {
    const { deps } = createDeps();
    const captured: { inputSchema?: Record<string, z.ZodTypeAny> } = {};
    const server = {
      registerTool: (name: string, config: { inputSchema?: Record<string, z.ZodTypeAny> }) => {
        if (name === 'create_work') {
          captured.inputSchema = config.inputSchema;
        }
      },
    } as unknown as McpServer;

    registerWorkTools(server, deps);

    const typeSchema = captured.inputSchema?.type;
    if (typeSchema === undefined) throw new Error('create_work の inputSchema.type が捕まえられなかった');

    for (const value of WORK_TYPE_OPTIONS) {
      expect(typeSchema.safeParse(value).success).toBe(true);
    }
    expect(typeSchema.safeParse('unknown').success).toBe(false);
  });
});

describe('WORK_TYPE_OPTIONS ↔ works collection の type options', () => {
  // cross-module-sync-test.md: 両モジュールを import して 1:1 を assert する。
  // works.ts が葉モジュールから options を組むのをやめて literal を再インライン化した瞬間に落ちる。
  it('collection の select options の value と 1:1 で一致する', () => {
    const typeField = Works.fields.find((field) => 'name' in field && field.name === 'type');
    if (typeField === undefined || !('options' in typeField)) throw new Error('works.ts に type select が無い');

    const values = typeField.options.map((option) => (typeof option === 'string' ? option : option.value));
    expect(values).toEqual([...WORK_TYPE_OPTIONS]);
  });
});
