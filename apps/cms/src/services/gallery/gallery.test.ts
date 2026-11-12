import { describe, expect, it } from 'vitest';

import { createFakeRunner } from '../payload-runner/fake';

import { createGalleryService } from './index';

const image = { id: 1, alt: 'alt', url: '/media/x.jpg', width: 800, height: 600 };

describe('createGalleryService', () => {
  it('list() queries published photos by _order at depth 1 and drops incomplete rows', async () => {
    const { run, find } = createFakeRunner({
      docs: [
        { id: 1, image },
        { id: 2, image: 7 },
      ],
    });

    const photos = await createGalleryService(run).list();

    expect(find).toHaveBeenCalledWith({ collection: 'gallery', where: { _status: { equals: 'published' } }, sort: '_order', depth: 1, limit: 0 });
    expect(photos.map((photo) => photo.id)).toEqual(['1']);
  });

  it('draftList() reads every latest draft without the published filter', async () => {
    const { run, find } = createFakeRunner({ docs: [{ id: 1, image }] });

    await createGalleryService(run).draftList();

    expect(find).toHaveBeenCalledWith({ collection: 'gallery', draft: true, overrideAccess: true, sort: '_order', depth: 1, limit: 0 });
  });
});
