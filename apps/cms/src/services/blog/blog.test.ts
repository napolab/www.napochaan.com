import { describe, expect, it } from 'vitest';

import { createFakeRunner } from '../payload-runner/fake';

import { createBlogService } from './index';

const doc = (id: number, slug: string) => ({ id, slug, title: slug, publishedAt: '2026-05-10T00:00:00.000Z', excerpt: '', body: null });

describe('createBlogService', () => {
  it('list() queries published posts by -publishedAt with the default depth and numbers them 01, 02', async () => {
    const { run, find } = createFakeRunner({ docs: [doc(2, 'newer'), doc(1, 'older')] });

    const posts = await createBlogService(run).list();

    expect(find).toHaveBeenCalledWith({ collection: 'blog', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 0 });
    expect(find.mock.calls[0]?.[0]).not.toHaveProperty('depth');
    expect(posts.map((post) => [post.slug, post.index])).toEqual([
      ['newer', '01'],
      ['older', '02'],
    ]);
  });

  it('bySlug() filters by slug AND published, limit 1', async () => {
    const { run, find } = createFakeRunner({ docs: [doc(1, 'hello')] });

    const post = await createBlogService(run).bySlug('hello');

    expect(find).toHaveBeenCalledWith({ collection: 'blog', where: { and: [{ slug: { equals: 'hello' } }, { _status: { equals: 'published' } }] }, limit: 1 });
    expect(post?.slug).toBe('hello');
    expect(post?.index).toBe('01');
  });

  it("bySlug('nope') resolves undefined when nothing matches", async () => {
    const { run } = createFakeRunner({ docs: [] });

    expect(await createBlogService(run).bySlug('nope')).toBeUndefined();
  });

  it('draft() reads the latest draft by id without the published filter', async () => {
    const { run, find } = createFakeRunner({ docs: [doc(9, 'draft')] });

    const post = await createBlogService(run).draft('9');

    expect(find).toHaveBeenCalledWith({ collection: 'blog', where: { id: { equals: '9' } }, draft: true, overrideAccess: true, limit: 1 });
    expect(post?.id).toBe('9');
  });

  it('draft() resolves undefined for an unknown id', async () => {
    const { run } = createFakeRunner({ docs: [] });

    expect(await createBlogService(run).draft('404')).toBeUndefined();
  });
});
