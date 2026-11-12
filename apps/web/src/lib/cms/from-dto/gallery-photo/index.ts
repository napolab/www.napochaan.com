import type { GalleryPhoto } from '@components/gallery-archive';
import type { GalleryPhotoDTO } from '@napochaan/cms-api/services';

// Maps the cms `GalleryPhotoDTO` to a `GalleryPhoto`. The cms omits a NULL
// caption; the site has always received `''` for it (the archive renders the
// corner label whenever caption is defined), so restore that here. Pure.
export const fromGalleryPhotoDTO = (dto: GalleryPhotoDTO): GalleryPhoto => ({ ...dto, caption: dto.caption ?? '' });
