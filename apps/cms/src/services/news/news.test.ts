import { describe, expect, it } from 'vitest';

import { createFakeRunner } from '../payload-runner/fake';

import { createNewsService } from './index';

const doc = (id: number, slug: string) => ({ id, slug, title: slug, publishedAt: '2026-06-05T00:00:00.000Z', category: 'site', url: null, body: null });

const published = { _status: { equals: 'published' } };

describe('createNewsService', () => {
  it('list() queries published news pinned-first then newest, unlimited', async () => {
    const { run, find } = createFakeRunner({ docs: [doc(1, 'a'), doc(2, 'b')] });

    const items = await createNewsService(run).list();

    expect(find).toHaveBeenCalledWith({ collection: 'news', where: published, sort: ['-pinned', '-publishedAt'], limit: 0 });
    expect(items.map((item) => item.slug)).toEqual(['a', 'b']);
  });

  it('latest(limit) uses the same order with the given limit', async () => {
    const { run, find } = createFakeRunner({ docs: [doc(1, 'a')] });

    await createNewsService(run).latest(3);

    expect(find).toHaveBeenCalledWith({ collection: 'news', where: published, sort: ['-pinned', '-publishedAt'], limit: 3 });
  });

  it('bySlug() filters by slug AND published, limit 1; undefined when missing', async () => {
    const { run, find } = createFakeRunner({ docs: [] });

    expect(await createNewsService(run).bySlug('nope')).toBeUndefined();
    expect(find).toHaveBeenCalledWith({ collection: 'news', where: { and: [{ slug: { equals: 'nope' } }, published] }, limit: 1 });
  });

  it('draft() reads the latest draft by id', async () => {
    const { run, find } = createFakeRunner({ docs: [doc(4, 'd')] });

    expect((await createNewsService(run).draft('4'))?.id).toBe('4');
    expect(find).toHaveBeenCalledWith({ collection: 'news', where: { id: { equals: '4' } }, draft: true, overrideAccess: true, limit: 1 });
  });
});
