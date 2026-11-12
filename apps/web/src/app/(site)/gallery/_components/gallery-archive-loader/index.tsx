import { GalleryArchive } from '@components/gallery-archive';
import { findGalleryList } from '@lib/payload/gallery';

const GalleryArchiveLoader = async () => {
  const galleryPhotos = await findGalleryList();

  return <GalleryArchive photos={galleryPhotos} />;
};

export { GalleryArchiveLoader };
