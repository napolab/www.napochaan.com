import { describe, expect, it } from 'vitest';

import { createFakeRunner } from '../payload-runner/fake';

import { createWorksService } from './index';

const doc = (id: number, slug: string) => ({ id, slug, title: slug, type: 'production', date: '2025-03-15T00:00:00.000Z' });

const published = { _status: { equals: 'published' } };

describe('createWorksService', () => {
  it('list() queries published works by -date at depth 1 and numbers them 01, 02', async () => {
    const { run, find } = createFakeRunner({ docs: [doc(2, 'b'), doc(1, 'a')] });

    const rows = await createWorksService(run).list();

    expect(find).toHaveBeenCalledWith({ collection: 'works', where: published, sort: '-date', depth: 1, limit: 0 });
    expect(rows.map((row) => [row.slug, row.no])).toEqual([
      ['b', '01'],
      ['a', '02'],
    ]);
  });

  it('bySlug() filters by slug AND published at depth 1, limit 1', async () => {
    const { run, find } = createFakeRunner({ docs: [doc(1, 'a')] });

    expect((await createWorksService(run).bySlug('a'))?.no).toBe('01');
    expect(find).toHaveBeenCalledWith({ collection: 'works', where: { and: [{ slug: { equals: 'a' } }, published] }, depth: 1, limit: 1 });
  });

  it('bySlug() resolves undefined when nothing matches', async () => {
    const { run } = createFakeRunner({ docs: [] });

    expect(await createWorksService(run).bySlug('nope')).toBeUndefined();
  });

  it('draft() reads the latest draft by id at depth 1', async () => {
    const { run, find } = createFakeRunner({ docs: [doc(3, 'c')] });

    expect((await createWorksService(run).draft('3'))?.id).toBe('3');
    expect(find).toHaveBeenCalledWith({ collection: 'works', where: { id: { equals: '3' } }, draft: true, overrideAccess: true, depth: 1, limit: 1 });
  });
});
