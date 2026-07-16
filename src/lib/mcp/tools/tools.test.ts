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
  it('sets _status published and returns the public URL', async () => {
    const { payload, deps } = createDeps();
    payload.update.mockResolvedValue({ id: 3, slug: 'hello', _status: 'published' });
    const handlers = createBlogToolHandlers(deps);
    const result = await handlers.publishPost({ id: 3 });

    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ collection: 'blog', id: 3, overrideAccess: false, user, data: { _status: 'published' } }));
    expect(result.content[0]?.text).toContain('/blog/hello');
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
