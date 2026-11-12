import { projectGalleryPhoto } from '../project/gallery';

import type { PayloadRunner } from '../payload-runner';
import type { CMSServices, GalleryPhotoDTO } from '@napochaan/cms-api/services';
import type { Gallery } from '@payload-types';

// Local Payload API bypasses access control (overrideAccess defaults to true),
// so the public query below MUST filter `_status: published` explicitly.
const publishedWhere = { _status: { equals: 'published' } } as const;

// Projects every doc, dropping rows whose image is unpopulated or lacks dimensions.
const projectAll = (docs: Gallery[]): GalleryPhotoDTO[] => docs.map(projectGalleryPhoto).filter((photo): photo is GalleryPhotoDTO => photo !== undefined);

// Gallery reads in manual `_order`. The draft list resolves each photo to its
// latest draft and is only reachable through the secret-gated preview route.
export const createGalleryService = (run: PayloadRunner): CMSServices['gallery'] => ({
  async list(): Promise<GalleryPhotoDTO[]> {
    const result = await run((payload) => payload.find({ collection: 'gallery', where: publishedWhere, sort: '_order', depth: 1, limit: 0 }));

    return projectAll(result.docs);
  },
  async draftList(): Promise<GalleryPhotoDTO[]> {
    const result = await run((payload) => payload.find({ collection: 'gallery', draft: true, overrideAccess: true, sort: '_order', depth: 1, limit: 0 }));

    return projectAll(result.docs);
  },
});
