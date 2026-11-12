import { describe, expect, it, vi } from 'vitest';

import { createBodyPipeline, DEFAULT_UNEDITABLE_WORDING } from '.';

import type { BodyPipelineDeps, LexicalBody } from '.';
import type { User } from '@payload-types';

const user = { id: 1, email: 'dev@napochaan.com' } as User;

const paragraphBody = (): LexicalBody => ({ root: { type: 'root', children: [{ type: 'paragraph', version: 1 }], direction: null, format: '', indent: 0, version: 1 } }) as LexicalBody;

// registry 未登録の blockType を持つ block node — hasUnsupportedBlocks が true になる。
const blockBody = (): LexicalBody => ({ root: { type: 'root', children: [{ type: 'block', version: 2 }], direction: null, format: '', indent: 0, version: 1 } }) as LexicalBody;

const createDeps = () => {
  const payload = {
    find: vi.fn().mockResolvedValue({ docs: [] }),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const codec = {
    toLexical: vi.fn((_markdown: string) => paragraphBody()),
    toMarkdown: vi.fn(() => '# md'),
  };
  const deps = { payload, user, codec, siteBaseUrl: 'https://napochaan.com' } as unknown as BodyPipelineDeps<LexicalBody>;
  return { payload, codec, deps };
};

// payload.find は「filename equals」(media-file lookup)と「id in」(alt lookup)の 2 用途で
// 呼ばれる。fixtures から両クエリ形を判別して返す(tools.test.ts と同じ形のモック)。
type MediaFixture = { id: number; alt: string; filename?: string };

const mockMediaLookup = (payload: { find: ReturnType<typeof vi.fn> }, fixtures: readonly MediaFixture[]): void => {
  payload.find.mockImplementation((args: { where: { filename: { equals: string } } | { id: { in: number[] } } }) => {
    const { where } = args;
    if ('filename' in where) {
      const hit = fixtures.find((fixture) => fixture.filename === where.filename.equals);
      return Promise.resolve({ docs: hit === undefined ? [] : [{ id: hit.id, alt: hit.alt }] });
    }
    const ids = where.id.in;
    return Promise.resolve({ docs: fixtures.filter((fixture) => ids.includes(fixture.id)).map((fixture) => ({ id: fixture.id, alt: fixture.alt })) });
  });
};

describe('prepareBody', () => {
  it('生 URL 画像を回復ヒント付きで reject し、Lexical 変換しない', async () => {
    const { codec, deps } = createDeps();
    const pipeline = createBodyPipeline(deps);

    const result = await pipeline.prepareBody('![x](https://example.com/x.png)');

    expect(result.isErr()).toBe(true);
    expect(result.isErr() ? result.error.message : '').toContain('upload_media');
    expect(codec.toLexical).not.toHaveBeenCalled();
  });

  it('placeholder の alt を media doc に同期し、alt を空にしてから Lexical 変換する', async () => {
    const { payload, codec, deps } = createDeps();
    mockMediaLookup(payload, [{ id: 42, alt: '古いalt' }]);
    payload.update.mockResolvedValue({ id: 42 });
    const pipeline = createBodyPipeline(deps);

    const result = await pipeline.prepareBody('![media:42](新しいalt)');

    expect(result.isOk()).toBe(true);
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', id: 42, data: { alt: '新しいalt' }, overrideAccess: false, user }));
    expect(codec.toLexical).toHaveBeenCalledWith('![media:42]()');
  });

  it('doc alt と同じ alt なら media を update しない', async () => {
    const { payload, deps } = createDeps();
    mockMediaLookup(payload, [{ id: 42, alt: '同じalt' }]);
    const pipeline = createBodyPipeline(deps);

    const result = await pipeline.prepareBody('![media:42](同じalt)');

    expect(result.isOk()).toBe(true);
    expect(payload.update).not.toHaveBeenCalled();
  });
});

describe('buildBodyPayload', () => {
  it('MCP 非対応 block を含む本文は bodyEditable=false と warning を返し、Markdown 変換しない', async () => {
    const { codec, deps } = createDeps();
    const pipeline = createBodyPipeline(deps);

    const result = await pipeline.buildBodyPayload(blockBody());

    expect(result.isOk() ? result.value : undefined).toEqual({ bodyEditable: false, warning: expect.stringContaining('MCP 非対応の block') });
    expect(codec.toMarkdown).not.toHaveBeenCalled();
  });

  it('本文が無い(undefined)なら bodyEditable=true と空 Markdown を返す(works の本文未設定)', async () => {
    const { codec, deps } = createDeps();
    const pipeline = createBodyPipeline(deps);

    const result = await pipeline.buildBodyPayload(undefined);

    expect(result.isOk() ? result.value : undefined).toEqual({ bodyEditable: true, bodyMarkdown: '' });
    expect(codec.toMarkdown).not.toHaveBeenCalled();
  });

  it('編集可能な本文は Markdown に変換し、placeholder の alt を doc の現在値で充填する', async () => {
    const { payload, codec, deps } = createDeps();
    mockMediaLookup(payload, [{ id: 42, alt: 'docのalt' }]);
    codec.toMarkdown.mockReturnValue('![media:42]()');
    const pipeline = createBodyPipeline(deps);

    const result = await pipeline.buildBodyPayload(paragraphBody());

    expect(result.isOk() ? result.value : undefined).toEqual({ bodyEditable: true, bodyMarkdown: '![media:42](docのalt)' });
  });
});

describe('resolveNextBody', () => {
  it('bodyMarkdown が undefined なら skip を返し、Lexical 変換しない', async () => {
    const { codec, deps } = createDeps();
    const pipeline = createBodyPipeline(deps);

    const result = await pipeline.resolveNextBody(undefined, paragraphBody());

    expect(result.isOk() ? result.value : undefined).toEqual({ kind: 'skip' });
    expect(codec.toLexical).not.toHaveBeenCalled();
  });

  it('既存本文が MCP 非対応 block を含むなら既定(blog)の文言で reject する', async () => {
    const { codec, deps } = createDeps();
    const pipeline = createBodyPipeline(deps);

    const result = await pipeline.resolveNextBody('# rewrite', blockBody());

    expect(result.isErr()).toBe(true);
    const message = result.isErr() ? result.error.message : '';
    expect(message).toContain(DEFAULT_UNEDITABLE_WORDING.subject);
    expect(message).toContain(DEFAULT_UNEDITABLE_WORDING.otherFields);
    expect(codec.toLexical).not.toHaveBeenCalled();
  });

  it('wording を渡すと reject 文言の主語とフィールド例示が差し替わる', async () => {
    const { deps } = createDeps();
    const pipeline = createBodyPipeline({ ...deps, wording: { subject: 'この制作物', otherFields: 'title/description 等' } });

    const result = await pipeline.resolveNextBody('# rewrite', blockBody());

    const message = result.isErr() ? result.error.message : '';
    expect(message).toContain('この制作物の本文には');
    expect(message).toContain('title/description 等の他フィールド');
    expect(message).not.toContain('この記事');
  });

  it('既存本文が無い(undefined)なら往復 guard を通らず prepareBody に進む', async () => {
    const { codec, deps } = createDeps();
    const pipeline = createBodyPipeline(deps);

    const result = await pipeline.resolveNextBody('# new', undefined);

    expect(result.isOk() ? result.value : undefined).toEqual({ kind: 'body', body: paragraphBody() });
    expect(codec.toLexical).toHaveBeenCalledWith('# new');
  });
});
