import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyUploadURLParams } from '../upload-url';

import { createBlogToolHandlers } from '.';

import type { BlogToolDeps } from '.';
import type { Blog, User } from '@payload-types';

// Vite reserves `BASE_URL` (default '/') and injects it into `process.env` in
// the vitest node environment, which breaks `absoluteUrl`'s `new URL(path, base)`
// call. Stub a real origin for the duration of this suite (see src/utils/site-url
// for the same pattern).
beforeEach(() => {
  vi.stubEnv('BASE_URL', 'https://www.napochaan.com');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const user = { id: 1, email: 'dev@napochaan.com' } as User;
const SIGNING_SECRET = 'test-signing-secret';

const paragraphBody = (): Blog['body'] => ({ root: { type: 'root', children: [{ type: 'paragraph', version: 1 }], direction: null, format: '', indent: 0, version: 1 } }) as Blog['body'];

const blockBody = (): Blog['body'] => ({ root: { type: 'root', children: [{ type: 'block', version: 2 }], direction: null, format: '', indent: 0, version: 1 } }) as Blog['body'];

const createDeps = () => {
  const payload = {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const codec = {
    toLexical: vi.fn((_markdown: string) => paragraphBody()),
    toMarkdown: vi.fn(() => '# md'),
  };
  const deps = { payload, user, codec, signingSecret: SIGNING_SECRET } as unknown as BlogToolDeps;
  return { payload, codec, deps };
};

// payload.find は「filename equals」(media-file-refs lookup)と「id in」(alt lookup)の
// 2 用途で呼ばれる。fixtures から両クエリ形を判別して返すモック実装(args.where の形で分岐)。
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

describe('createPost', () => {
  it('creates a draft with overrideAccess: false', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    payload.create.mockResolvedValue({ id: 10, slug: 'hello' });

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 'hello',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: '# hi',
    });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'blog',
        draft: true,
        overrideAccess: false,
        user,
        data: expect.objectContaining({ _status: 'draft', slug: 'hello', thumbnail: 5 }),
      }),
    );
  });

  it('rejects raw image URLs with a recovery hint', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 's',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: '![x](https://example.com/x.png)',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('upload_media');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('accepts a raw image URL inside a generic code fence as example text', async () => {
    // フェンス内は例示テキスト — get_post と write でフェンス扱いを統一(リファクタ後の意図的挙動をピン留め)。
    // 言語キーは Code block の select options として別途検証される(後続テスト参照)ため、
    // ここではキー省略の素の ``` フェンスを使う。
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    payload.create.mockResolvedValue({ id: 11, slug: 's2' });
    const handlers = createBlogToolHandlers(deps);
    const bodyMarkdown = ['intro', '', '```', '![shot](https://example.com/a.png)', '```'].join('\n');
    const result = await handlers.createPost({
      title: 't',
      slug: 's2',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown,
    });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalled();
  });

  it('passes a language-tagged code fence through unchanged, even when it contains image syntax', async () => {
    // フェンス内の ![media:...] / 生 URL は検証・書き換えの対象外(splitCodeFences 保護)。
    // 空 alt の placeholder はフェンス外なら拒否されるが、フェンス内なら素通りする。
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    payload.create.mockResolvedValue({ id: 12, slug: 'code' });
    const handlers = createBlogToolHandlers(deps);
    const bodyMarkdown = ['intro', '', '```bash', 'curl https://example.com/x.png', '![media:99]()', '![shot](https://example.com/a.png)', '```'].join('\n');
    const result = await handlers.createPost({
      title: 't',
      slug: 'code',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown,
    });

    expect(result.isError).toBeUndefined();
    expect(codec.toLexical).toHaveBeenCalledWith(bodyMarkdown);
  });

  it('rejects an unsupported code-fence language key with a recovery hint', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    const handlers = createBlogToolHandlers(deps);
    const bodyMarkdown = ['```python', 'print(1)', '```'].join('\n');
    const result = await handlers.createPost({ title: 't', slug: 's3', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('python');
    expect(result.content[0]?.text).toContain('typescript');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('accepts the standalone YouTube link syntax and hands the raw markdown to the codec (tree transform は codec 内)', async () => {
    // 検証は raw 入力に対して走り、リンク行 → block node の置き換えは codec.toLexical の
    // 内側(convertMarkdownToLexical 後の lexical tree 変換)で行われる —
    // tools 層は Markdown を書き換えないことをピン留めする。
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    payload.create.mockResolvedValue({ id: 13, slug: 'yt' });
    const handlers = createBlogToolHandlers(deps);
    const bodyMarkdown = ['intro', '', '[ライブ映像](https://youtu.be/dQw4w9WgXcQ)', '', 'outro'].join('\n');
    const result = await handlers.createPost({ title: 't', slug: 'yt', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown });

    expect(result.isError).toBeUndefined();
    expect(codec.toLexical).toHaveBeenCalledWith(bodyMarkdown);
  });

  it('rejects the retired ```youtube-embed fence with a recovery hint pointing to the link syntax', async () => {
    // 旧内部フェンスは廃止済み。素通しすると Code block の customStartRegex が行頭に
    // 部分一致して silent 破壊になるため、youtube-embed plugin の validateFences が
    // Payload に届く前に回復指示つきで拒否する(mcp-write-strict)。
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    const handlers = createBlogToolHandlers(deps);
    const bodyMarkdown = ['```youtube-embed', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '```'].join('\n');
    const result = await handlers.createPost({ title: 't', slug: 's4', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('廃止');
    expect(result.content[0]?.text).toContain('[キャプション](URL)');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects a missing thumbnail', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 's', excerpt: 'e', thumbnailMediaID: 99, bodyMarkdown: '# hi' });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('does not commit a media alt sync when the thumbnail is missing (thumbnail must be verified before prepareBody runs)', async () => {
    const { payload, deps } = createDeps();
    // thumbnail (99) missing; media id=5 referenced in bodyMarkdown exists with a
    // different alt than what's written, so prepareBody would call payload.update
    // for it if it ran. It must not run before the thumbnail check fails.
    payload.findByID.mockImplementation(async ({ id }: { id: number }) => (id === 99 ? null : { id }));
    mockMediaLookup(payload, [{ id: 5, alt: '古い説明' }]);
    payload.update.mockResolvedValue({});

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 's', excerpt: 'e', thumbnailMediaID: 99, bodyMarkdown: '![media:5](新しい説明)' });

    expect(result.isError).toBe(true);
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('defaults publishedAt to today (Asia/Tokyo)', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 });
    payload.create.mockResolvedValue({ id: 10, slug: 'hello' });
    const handlers = createBlogToolHandlers(deps);
    await handlers.createPost({ title: 't', slug: 'hello', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown: '# hi' });

    const arg = payload.create.mock.calls[0]?.[0] as { data: { publishedAt: string } };
    expect(arg.data.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

const FENCE = ['```image-row', '![media:5](left)', '![media:6]()', '```'].join('\n');

describe('createPost with image-row', () => {
  it('accepts a valid image-row fence and checks each cell media', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail + cells all exist
    payload.create.mockResolvedValue({ id: 20, slug: 'ir' });

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 'ir', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown: `intro\n\n${FENCE}` });

    expect(result.isError).toBeUndefined();
    expect(payload.create).toHaveBeenCalled();
  });

  it('rejects a malformed image-row fence', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 });
    const handlers = createBlogToolHandlers(deps);
    const bad = ['```image-row', '![media:5](only one)', '```'].join('\n');
    const result = await handlers.createPost({ title: 't', slug: 'ir', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown: bad });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects when a cell media does not exist', async () => {
    const { payload, deps } = createDeps();
    // thumbnail (5) exists, cell media (6) missing
    payload.findByID.mockImplementation(async ({ id }: { id: number }) => (id === 6 ? null : { id }));
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 'ir', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown: FENCE });

    expect(result.isError).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe('createPost with alt-mandatory placeholders', () => {
  it('syncs the written alt to the media doc and strips it before Lexical conversion', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 8 }); // thumbnail exists
    mockMediaLookup(payload, [{ id: 5, alt: '古い説明' }]);
    payload.create.mockResolvedValue({ id: 20, slug: 'alt-sync' });
    payload.update.mockResolvedValue({});

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 'alt-sync', excerpt: 'e', thumbnailMediaID: 8, bodyMarkdown: '![media:5](新しい説明)' });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', id: 5, data: { alt: '新しい説明' } }));
    expect(codec.toLexical).toHaveBeenCalledWith('![media:5]()');
    expect(payload.create).toHaveBeenCalled();
  });

  it('does not touch the media doc when the written alt matches the current one', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 8 });
    mockMediaLookup(payload, [{ id: 5, alt: '説明' }]);
    payload.create.mockResolvedValue({ id: 20, slug: 'alt-same' });

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 'alt-same', excerpt: 'e', thumbnailMediaID: 8, bodyMarkdown: '![media:5](説明)' });

    expect(result.isError).toBeUndefined();
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.create).toHaveBeenCalled();
  });

  it('rejects an empty alt', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 8 }); // thumbnail exists
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 'empty-alt', excerpt: 'e', thumbnailMediaID: 8, bodyMarkdown: '![media:5]()' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('alt');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects conflicting alts for the same media id', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 8 }); // thumbnail exists
    const handlers = createBlogToolHandlers(deps);
    const bodyMarkdown = ['![media:5](A)', '![media:5](B)'].join('\n');
    const result = await handlers.createPost({ title: 't', slug: 'conflict-alt', excerpt: 'e', thumbnailMediaID: 8, bodyMarkdown });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('統一');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects a placeholder referencing a media id that does not exist', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 8 }); // thumbnail exists
    mockMediaLookup(payload, []);
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 'missing-media', excerpt: 'e', thumbnailMediaID: 8, bodyMarkdown: '![media:999](desc)' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('存在しません');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('does not run alt validation on image-row cell captions and passes the fence through unchanged', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail + cells all exist
    payload.create.mockResolvedValue({ id: 30, slug: 'fence-only' });

    const handlers = createBlogToolHandlers(deps);
    const bodyMarkdown = `intro\n\n${FENCE}`;
    const result = await handlers.createPost({ title: 't', slug: 'fence-only', excerpt: 'e', thumbnailMediaID: 5, bodyMarkdown });

    expect(result.isError).toBeUndefined();
    expect(codec.toLexical).toHaveBeenCalledWith(bodyMarkdown);
  });
});

describe('createPost with in-site media URLs', () => {
  it('rejects with the resolved media id in the recovery hint', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    mockMediaLookup(payload, [{ id: 42, alt: '既存のalt', filename: 'IMG_0185.jpeg' }]); // filename lookup hit

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 's',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: '![before](/api/media/file/IMG_0185.jpeg)',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('media id=42');
    expect(result.content[0]?.text).toContain('![media:42](既存のalt)');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects with an upload_media hint when the media file does not exist', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    payload.find.mockResolvedValue({ docs: [] }); // filename lookup miss

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 's',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: '![](/api/media/file/missing.png)',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('missing.png');
    expect(result.content[0]?.text).toContain('upload_media');
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe('updatePost with in-site media URLs', () => {
  it('rejects bodyMarkdown containing in-site URLs with the resolved id hint', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 4, body: paragraphBody() }); // post fetch
    mockMediaLookup(payload, [{ id: 9, alt: '別のalt', filename: 'IMG_0185.jpeg' }]); // filename lookup hit

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.updatePost({ id: 4, bodyMarkdown: '![old](/api/media/file/IMG_0185.jpeg)' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('media id=9');
    expect(payload.update).not.toHaveBeenCalled();
  });
});

describe('getPost normalizes in-site media URLs', () => {
  it('rewrites raw in-site refs to media placeholders in bodyMarkdown, filled with the doc alt', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: paragraphBody() });
    mockMediaLookup(payload, [{ id: 42, alt: 'IMG の alt', filename: 'IMG_0185.jpeg' }]);
    codec.toMarkdown.mockReturnValue('intro\n\n![](/api/media/file/IMG_0185.jpeg)');

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.getPost({ id: 3 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyMarkdown: string };
    expect(parsed.bodyMarkdown).toBe('intro\n\n![media:42](IMG の alt)');
  });

  it('leaves refs whose media is missing untouched', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: paragraphBody() });
    mockMediaLookup(payload, []);
    codec.toMarkdown.mockReturnValue('![](/api/media/file/gone.png)');

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.getPost({ id: 3 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyMarkdown: string };
    expect(parsed.bodyMarkdown).toBe('![](/api/media/file/gone.png)');
  });
});

// LLM 向け回復指示メッセージと get_post 正規化出力は MCP の実質的な API contract。
// 文言・形式の変化を snapshot で固定する。
describe('I/O snapshot', () => {
  it('write rejection message covers all three hint variants', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 5 }); // thumbnail exists
    mockMediaLookup(payload, [{ id: 42, alt: '既存のalt', filename: 'known.jpeg' }]);

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({
      title: 't',
      slug: 's',
      excerpt: 'e',
      thumbnailMediaID: 5,
      bodyMarkdown: ['![a](/api/media/file/known.jpeg)', '![b](/api/media/file/unknown.png)', '![c](https://example.com/ext.png)'].join('\n'),
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toMatchInlineSnapshot(`
      "本文に生 URL の画像参照があります。画像は ![media:<id>](alt) 参照で書いてください:
      - ![a](/api/media/file/known.jpeg): media id=42 の画像です。![media:42](既存のalt) に置き換えて再送してください。
      - ![b](/api/media/file/unknown.png): 対応する media(unknown.png)が見つかりません。upload_media で登録し、返された placeholder(![media:<id>](alt))をそのまま貼ってください。
      - ![c](https://example.com/ext.png): 外部 URL は使えません。upload_media で画像を登録し、返された placeholder(![media:<id>](alt))をそのまま貼ってください。"
    `);
  });

  it('get_post bodyMarkdown normalization output', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: paragraphBody() });
    mockMediaLookup(payload, [
      { id: 42, alt: '写真の説明', filename: 'known.jpeg' },
      { id: 7, alt: '既存プレースホルダの説明' },
    ]);
    codec.toMarkdown.mockReturnValue(['# post', '', '![x](/api/media/file/known.jpeg)', '![y](/api/media/file/unknown.png)', '![media:7]()'].join('\n'));

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.getPost({ id: 3 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyMarkdown: string };
    expect(parsed.bodyMarkdown).toMatchInlineSnapshot(`
      "# post

      ![media:42](写真の説明)
      ![y](/api/media/file/unknown.png)
      ![media:7](既存プレースホルダの説明)"
    `);
  });
});

describe('updatePost', () => {
  it('rejects bodyMarkdown when the current body contains block nodes', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: blockBody() });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.updatePost({ id: 3, bodyMarkdown: '# rewrite' });

    expect(result.isError).toBe(true);
    expect(payload.update).not.toHaveBeenCalled();
  });

  it('updates non-body fields of a block-containing post', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: blockBody() });
    payload.update.mockResolvedValue({ id: 3, slug: 's' });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.updatePost({ id: 3, title: 'new title' });

    expect(result.isError).toBeUndefined();
    const arg = payload.update.mock.calls[0]?.[0] as { draft: boolean; data: Record<string, unknown> };
    expect(arg.draft).toBe(true);
    expect(arg.data).not.toHaveProperty('body');
    expect(arg.data).toHaveProperty('title', 'new title');
  });

  it('syncs the written alt to the media doc when bodyMarkdown changes a placeholder alt', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 4, body: paragraphBody() }); // post fetch
    mockMediaLookup(payload, [{ id: 5, alt: '古い説明' }]);
    payload.update.mockResolvedValue({ id: 4, slug: 's' });

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.updatePost({ id: 4, bodyMarkdown: '![media:5](新しい説明)' });

    expect(result.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', id: 5, data: { alt: '新しい説明' } }));
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'blog', id: 4 }));
  });
});

describe('publishPost', () => {
  it('resends all draft fields with _status published and returns the public URL', async () => {
    const { payload, deps } = createDeps();
    const draft = {
      id: 3,
      slug: 'hello',
      title: 't',
      excerpt: 'e',
      thumbnail: 5,
      publishedAt: '2026-07-16',
      body: paragraphBody(),
    };
    payload.findByID.mockResolvedValue(draft);
    payload.update.mockResolvedValue({ id: 3, slug: 'hello', title: 't', _status: 'published' });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.publishPost({ id: 3 });

    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'blog', id: 3, draft: true, overrideAccess: false, user, depth: 0 }));
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'blog',
        id: 3,
        overrideAccess: false,
        user,
        data: {
          title: 't',
          slug: 'hello',
          excerpt: 'e',
          thumbnail: 5,
          publishedAt: '2026-07-16',
          body: draft.body,
          _status: 'published',
        },
      }),
    );
    expect(result.content[0]?.text).toContain('/blog/hello');
  });

  it('returns an error and does not update when the post does not exist', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.publishPost({ id: 999 });

    expect(result.isError).toBe(true);
    expect(payload.update).not.toHaveBeenCalled();
  });
});

describe('getPost', () => {
  it('flags block-containing posts as not body-editable', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, slug: 's', title: 't', publishedAt: '2026-07-16', excerpt: 'e', body: blockBody() });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.getPost({ id: 3 });

    expect(result.content[0]?.text).toContain('"bodyEditable": false');
    expect(codec.toMarkdown).not.toHaveBeenCalled();
  });

  it('reads the post at depth 0 so body upload nodes keep raw ids instead of populating', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, slug: 's', title: 't', publishedAt: '2026-07-16', excerpt: 'e', body: paragraphBody() });
    const handlers = createBlogToolHandlers(deps);
    await handlers.getPost({ id: 3 });

    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'blog', id: 3, draft: true, overrideAccess: false, user, depth: 0 }));
  });

  it('fills an existing empty-alt placeholder with the current media doc alt', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: paragraphBody() });
    mockMediaLookup(payload, [{ id: 42, alt: 'docのalt' }]);
    codec.toMarkdown.mockReturnValue('![media:42]()');

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.getPost({ id: 3 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyMarkdown: string };
    expect(parsed.bodyMarkdown).toBe('![media:42](docのalt)');
  });

  it('leaves a placeholder unfilled when the doc alt contains a half-width close paren (unrepresentable in ![media:<id>](alt))', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: paragraphBody() });
    mockMediaLookup(payload, [{ id: 42, alt: '図(A)B' }]);
    codec.toMarkdown.mockReturnValue('![media:42]()');

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.getPost({ id: 3 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyMarkdown: string };
    expect(parsed.bodyMarkdown).toBe('![media:42]()');
  });

  it('round-trips a filled alt through updatePost without touching the media doc (getPost fill -> update_post with that exact bodyMarkdown)', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: paragraphBody() });
    mockMediaLookup(payload, [{ id: 42, alt: '写真の説明' }]);
    codec.toMarkdown.mockReturnValue('![media:42]()');
    payload.update.mockResolvedValue({ id: 3, slug: 's' });

    const handlers = createBlogToolHandlers(deps);
    const getResult = await handlers.getPost({ id: 3 });
    const parsed = JSON.parse(getResult.content[0]?.text ?? '{}') as { bodyMarkdown: string };
    expect(parsed.bodyMarkdown).toBe('![media:42](写真の説明)');

    const updateResult = await handlers.updatePost({ id: 3, bodyMarkdown: parsed.bodyMarkdown });

    expect(updateResult.isError).toBeUndefined();
    expect(payload.update).toHaveBeenCalledTimes(1);
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'blog', id: 3 }));
  });
});

describe('uploadMedia', () => {
  it('creates media from base64 and returns the placeholder', async () => {
    const { payload, deps } = createDeps();
    payload.create.mockResolvedValue({ id: 42, url: '/api/media/file/x.png' });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.uploadMedia({ base64: Buffer.from('png-bytes').toString('base64'), alt: 'x', filename: 'x.png' });

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        overrideAccess: false,
        user,
        data: { alt: 'x' },
        file: expect.objectContaining({ mimetype: 'image/png', name: 'x.png' }),
      }),
    );
    expect(result.content[0]?.text).toContain('![media:42](x)');
  });

  it('fails without url or base64', async () => {
    const { deps } = createDeps();
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.uploadMedia({ alt: 'x', filename: 'x.png' });
    expect(result.isError).toBe(true);
  });

  it('rejects an alt containing a half-width close paren (unrepresentable in ![media:<id>](alt))', async () => {
    const { payload, deps } = createDeps();
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.uploadMedia({ base64: Buffer.from('png-bytes').toString('base64'), alt: '図(A)B', filename: 'x.png' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('）');
    expect(payload.create).not.toHaveBeenCalled();
  });

  describe('SSRF guard', () => {
    beforeEach(() => {
      vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('rejects a non-http(s) URL scheme without calling fetch', async () => {
      const { payload, deps } = createDeps();
      const handlers = createBlogToolHandlers(deps);
      const result = await handlers.uploadMedia({ url: 'file:///etc/passwd', alt: 'x', filename: 'x.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('http(s) 以外の URL');
      expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
      expect(payload.create).not.toHaveBeenCalled();
    });

    it('rejects a localhost URL without calling fetch', async () => {
      const { payload, deps } = createDeps();
      const handlers = createBlogToolHandlers(deps);
      const result = await handlers.uploadMedia({ url: 'http://localhost:3000/x.png', alt: 'x', filename: 'x.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('内部ネットワークの URL');
      expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
      expect(payload.create).not.toHaveBeenCalled();
    });

    it('rejects a private IPv4 URL without calling fetch', async () => {
      const { payload, deps } = createDeps();
      const handlers = createBlogToolHandlers(deps);
      const result = await handlers.uploadMedia({ url: 'http://192.168.1.5/x.png', alt: 'x', filename: 'x.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('内部ネットワークの URL');
      expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
      expect(payload.create).not.toHaveBeenCalled();
    });

    it('rejects an IPv6 literal hostname without calling fetch', async () => {
      const { payload, deps } = createDeps();
      const handlers = createBlogToolHandlers(deps);
      const result = await handlers.uploadMedia({ url: 'http://[::ffff:127.0.0.1]/x.png', alt: 'x', filename: 'x.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('内部ネットワークの URL');
      expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
      expect(payload.create).not.toHaveBeenCalled();
    });

    it('rejects a URL whose fetch is redirected, without calling payload.create', async () => {
      const { payload, deps } = createDeps();
      vi.mocked(globalThis.fetch).mockRejectedValue(new TypeError('unexpected redirect'));
      const handlers = createBlogToolHandlers(deps);
      const result = await handlers.uploadMedia({ url: 'https://example.com/x.png', alt: 'x', filename: 'x.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('リダイレクト');
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith('https://example.com/x.png', expect.objectContaining({ redirect: 'error' }));
      expect(payload.create).not.toHaveBeenCalled();
    });
  });

  describe('size limit', () => {
    beforeEach(() => {
      vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('rejects a response whose content-length exceeds 10MB without reading the body', async () => {
      const { payload, deps } = createDeps();
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response('x', { headers: { 'content-type': 'image/png', 'content-length': `${11 * 1024 * 1024}` } }));
      const handlers = createBlogToolHandlers(deps);
      const result = await handlers.uploadMedia({ url: 'https://example.com/x.png', alt: 'x', filename: 'x.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('上限 10MB');
      expect(payload.create).not.toHaveBeenCalled();
    });

    it('rejects a streamed response exceeding 10MB when content-length is absent', async () => {
      const { payload, deps } = createDeps();
      const chunk = new Uint8Array(2 * 1024 * 1024);
      const stream = new ReadableStream<Uint8Array>({
        start: (controller) => {
          for (const _index of [0, 1, 2, 3, 4, 5]) controller.enqueue(chunk);
          controller.close();
        },
      });
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response(stream, { headers: { 'content-type': 'image/png' } }));
      const handlers = createBlogToolHandlers(deps);
      const result = await handlers.uploadMedia({ url: 'https://example.com/x.png', alt: 'x', filename: 'x.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('上限 10MB');
      expect(payload.create).not.toHaveBeenCalled();
    });

    it('rejects base64 input exceeding 10MB after decoding', async () => {
      const { payload, deps } = createDeps();
      const oversized = Buffer.alloc(11 * 1024 * 1024).toString('base64');
      const handlers = createBlogToolHandlers(deps);
      const result = await handlers.uploadMedia({ base64: oversized, alt: 'x', filename: 'x.png' });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('上限 10MB');
      expect(payload.create).not.toHaveBeenCalled();
    });
  });
});

describe('createUploadURL', () => {
  it('issues a URL whose query params verify against the same secret, expiring ~10min from now', async () => {
    const { deps } = createDeps();
    const handlers = createBlogToolHandlers(deps);
    const before = Math.floor(Date.now() / 1000);

    const result = await handlers.createUploadURL({ filename: 'cover.png', alt: 'テスト画像' });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { uploadURL: string; method: string; expiresAt: string; curlExample: string; note: string };
    const url = new URL(parsed.uploadURL);
    const userParam = url.searchParams.get('user');
    const expParam = url.searchParams.get('exp');
    const filenameParam = url.searchParams.get('filename');
    const altParam = url.searchParams.get('alt');
    const sigParam = url.searchParams.get('sig');

    expect(userParam).toBe('1');
    expect(filenameParam).toBe('cover.png');
    expect(altParam).toBe('テスト画像');
    expect(sigParam).not.toBeNull();
    expect(expParam).not.toBeNull();

    const exp = parseInt(expParam ?? '', 10);
    expect(exp).toBeGreaterThanOrEqual(before + 600);
    expect(exp).toBeLessThanOrEqual(before + 605);

    const verifyResult = await verifyUploadURLParams(SIGNING_SECRET, { userID: 1, exp, filename: 'cover.png', alt: 'テスト画像' }, sigParam ?? '', before);
    expect(verifyResult.isOk()).toBe(true);

    expect(parsed.method).toBe('POST');
    expect(new Date(parsed.expiresAt).getTime()).toBe(exp * 1000);
    expect(parsed.curlExample).toContain(parsed.uploadURL);
  });

  it('rejects a filename with an unresolvable extension', async () => {
    const { deps } = createDeps();
    const handlers = createBlogToolHandlers(deps);

    const result = await handlers.createUploadURL({ filename: 'cover.bmp', alt: 'テスト画像' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('MIME type を特定できません');
  });

  it('rejects an alt containing a half-width close paren', async () => {
    const { deps } = createDeps();
    const handlers = createBlogToolHandlers(deps);

    const result = await handlers.createUploadURL({ filename: 'cover.png', alt: '図(A)B' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('）');
  });
});

describe('listPosts', () => {
  it('queries drafts with access control', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });
    const handlers = createBlogToolHandlers(deps);
    await handlers.listPosts({});

    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'blog', draft: true, overrideAccess: false, user, sort: '-publishedAt' }));
  });
});

describe('listMedia', () => {
  it('queries media without a where clause when search is omitted', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 1, filename: 'a.png', alt: '説明A', url: '/api/media/file/a.png', width: 100, height: 50, mimeType: 'image/png' }] });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.listMedia({});

    expect(result.isError).toBeUndefined();
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', sort: '-createdAt', limit: 20, overrideAccess: false, user, depth: 0 }));
    const arg = payload.find.mock.calls[0]?.[0] as Record<string, unknown>;
    expect('where' in arg).toBe(false);
  });

  it('queries media with a filename/alt where clause when search is provided', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });
    const handlers = createBlogToolHandlers(deps);
    await handlers.listMedia({ search: 'VJ' });

    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ where: { or: [{ filename: { contains: 'VJ' } }, { alt: { contains: 'VJ' } }] } }));
  });

  it('returns id/filename/alt/url/width/height/mimeType and a media placeholder', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 1, filename: 'a.png', alt: '説明A', url: '/api/media/file/a.png', width: 100, height: 50, mimeType: 'image/png' }] });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.listMedia({});

    const parsed = JSON.parse(result.content[0]?.text ?? '[]') as unknown[];
    expect(parsed[0]).toEqual({
      id: 1,
      filename: 'a.png',
      alt: '説明A',
      url: '/api/media/file/a.png',
      width: 100,
      height: 50,
      mimeType: 'image/png',
      placeholder: '![media:1](説明A)',
    });
  });

  it('emits an empty placeholder (but keeps the raw alt) when the doc alt contains ")"', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 9, alt: '図(A)B', filename: null, url: null, width: null, height: null, mimeType: null }] });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.listMedia({});

    const parsed = JSON.parse(result.content[0]?.text ?? '[]') as unknown[];
    expect(parsed[0]).toEqual({ id: 9, alt: '図(A)B', placeholder: '![media:9]()' });
  });

  it('coerces null fields to undefined so they are dropped by JSON.stringify', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 2, alt: 'B', filename: null, url: null, width: null, height: null, mimeType: null }] });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.listMedia({});

    const parsed = JSON.parse(result.content[0]?.text ?? '[]') as unknown[];
    expect(parsed[0]).toEqual({ id: 2, alt: 'B', placeholder: '![media:2](B)' });
  });

  it('I/O snapshot', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({
      docs: [
        { id: 1, filename: 'a.png', alt: '説明A', url: '/api/media/file/a.png', width: 100, height: 50, mimeType: 'image/png' },
        { id: 2, filename: 'b.jpg', alt: '説明B', url: '/api/media/file/b.jpg', width: 200, height: 150, mimeType: 'image/jpeg' },
      ],
    });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.listMedia({});

    expect(result.content[0]?.text).toMatchInlineSnapshot(`
      "[
        {
          "id": 1,
          "filename": "a.png",
          "alt": "説明A",
          "url": "/api/media/file/a.png",
          "width": 100,
          "height": 50,
          "mimeType": "image/png",
          "placeholder": "![media:1](説明A)"
        },
        {
          "id": 2,
          "filename": "b.jpg",
          "alt": "説明B",
          "url": "/api/media/file/b.jpg",
          "width": 200,
          "height": 150,
          "mimeType": "image/jpeg",
          "placeholder": "![media:2](説明B)"
        }
      ]"
    `);
  });
});
