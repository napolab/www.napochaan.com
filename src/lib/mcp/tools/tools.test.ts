import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  const deps = { payload, user, codec } as unknown as BlogToolDeps;
  return { payload, codec, deps };
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

  it('rejects a missing thumbnail', async () => {
    const { payload, deps } = createDeps();
    payload.findByID.mockResolvedValue(null);
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.createPost({ title: 't', slug: 's', excerpt: 'e', thumbnailMediaID: 99, bodyMarkdown: '# hi' });

    expect(result.isError).toBe(true);
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

describe('createPost with in-site media URLs', () => {
  it('rejects with the resolved media id in the recovery hint', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [{ id: 42 }] }); // filename lookup hit

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
    expect(result.content[0]?.text).toContain('![media:42]()');
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects with an upload_media hint when the media file does not exist', async () => {
    const { payload, deps } = createDeps();
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
    payload.find.mockResolvedValue({ docs: [{ id: 9 }] }); // filename lookup hit

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.updatePost({ id: 4, bodyMarkdown: '![old](/api/media/file/IMG_0185.jpeg)' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('media id=9');
    expect(payload.update).not.toHaveBeenCalled();
  });
});

describe('getPost normalizes in-site media URLs', () => {
  it('rewrites raw in-site refs to media placeholders in bodyMarkdown', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: paragraphBody() });
    payload.find.mockResolvedValue({ docs: [{ id: 42 }] });
    codec.toMarkdown.mockReturnValue('intro\n\n![](/api/media/file/IMG_0185.jpeg)');

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.getPost({ id: 3 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyMarkdown: string };
    expect(parsed.bodyMarkdown).toBe('intro\n\n![media:42]()');
  });

  it('leaves refs whose media is missing untouched', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: paragraphBody() });
    payload.find.mockResolvedValue({ docs: [] });
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
  const findByFilename = (filename: string, hit: number | undefined) => ({ docs: hit === undefined ? [] : [{ id: hit }] });

  it('write rejection message covers all three hint variants', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockImplementation((args: { where: { filename: { equals: string } } }) =>
      Promise.resolve(findByFilename(args.where.filename.equals, args.where.filename.equals === 'known.jpeg' ? 42 : undefined)),
    );

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
      "本文に生 URL の画像参照があります。画像は ![media:<id>]() 参照で書いてください:
      - ![a](/api/media/file/known.jpeg): media id=42 の画像です。![media:42]() に置き換えて再送してください。
      - ![b](/api/media/file/unknown.png): 対応する media(unknown.png)が見つかりません。upload_media で登録し、返された ![media:<id>]() を使ってください。
      - ![c](https://example.com/ext.png): 外部 URL は使えません。upload_media で画像を登録し、返された ![media:<id>]() を使ってください。"
    `);
  });

  it('get_post bodyMarkdown normalization output', async () => {
    const { payload, codec, deps } = createDeps();
    payload.findByID.mockResolvedValue({ id: 3, body: paragraphBody() });
    payload.find.mockImplementation((args: { where: { filename: { equals: string } } }) =>
      Promise.resolve(findByFilename(args.where.filename.equals, args.where.filename.equals === 'known.jpeg' ? 42 : undefined)),
    );
    codec.toMarkdown.mockReturnValue(['# post', '', '![x](/api/media/file/known.jpeg)', '![y](/api/media/file/unknown.png)', '![media:7]()'].join('\n'));

    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.getPost({ id: 3 });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0]?.text ?? '{}') as { bodyMarkdown: string };
    expect(parsed.bodyMarkdown).toMatchInlineSnapshot(`
      "# post

      ![media:42]()
      ![y](/api/media/file/unknown.png)
      ![media:7]()"
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
    expect(result.content[0]?.text).toContain('![media:42]()');
  });

  it('fails without url or base64', async () => {
    const { deps } = createDeps();
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.uploadMedia({ alt: 'x', filename: 'x.png' });
    expect(result.isError).toBe(true);
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

describe('listPosts', () => {
  it('queries drafts with access control', async () => {
    const { payload, deps } = createDeps();
    payload.find.mockResolvedValue({ docs: [] });
    const handlers = createBlogToolHandlers(deps);
    await handlers.listPosts({});

    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'blog', draft: true, overrideAccess: false, user, sort: '-publishedAt' }));
  });
});
